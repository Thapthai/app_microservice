import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UpdateItemMinMaxDto } from './dto/update-item-minmax.dto';
import { ItemStockDto } from './dto/item-stock.dto';

@Injectable()
export class ItemServiceService {
  constructor(private prisma: PrismaService) { }

  async createItem(createItemDto: CreateItemDto) {
    try {
      // Remove undefined/null values from the DTO
      const cleanData = Object.fromEntries(
        Object.entries(createItemDto).filter(
          ([_, value]) => value !== undefined && value !== null,
        ),
      ) as any;

      // Add timestamp if not provided
      if (!cleanData.CreateDate) {
        cleanData.CreateDate = new Date();
      }
      if (!cleanData.ModiflyDate) {
        cleanData.ModiflyDate = new Date();
      }

      const item = await this.prisma.item.create({
        data: cleanData,
      });

      return {
        success: true,
        message: 'Item created successfully',
        data: item,
      };
    } catch (error) {
      console.error('❌ Create error:', error.message);
      return {
        success: false,
        message: 'Failed to create item',
        error: error.message,
      };
    }
  }

  async findAllItems(
    page: number,
    limit: number,
    keyword?: string,
    sort_by: string = 'itemcode',
    sort_order: string = 'asc',
    cabinet_id?: number,
    department_id?: number,
    status?: string,
  ) {
    try {
      const where: any = {};
      const skip = (page - 1) * limit;
      if (keyword) {
        where.OR = [
          { itemname: { contains: keyword } },
          { itemcode: { contains: keyword } },
          { itemcode2: { contains: keyword } },
          { itemcode3: { contains: keyword } },
          { Barcode: { contains: keyword } },
        ];
      }

      // Build orderBy object - Prisma needs proper type
      const validSortFields = [
        'itemcode',
        'itemname',
        'CostPrice',
        'SalePrice',
        'CreateDate',
      ];
      const validSortOrders = ['asc', 'desc'];

      const field = validSortFields.includes(sort_by) ? sort_by : 'itemcode';
      const order = validSortOrders.includes(sort_order)
        ? (sort_order as 'asc' | 'desc')
        : ('desc' as 'asc' | 'desc');

      const orderBy: any = {};
      orderBy[field] = order;

      // Build itemStocks where clause (count_itemstock คำนวณจาก IsStock = 1 ในขั้นตอน map)
      const itemStocksWhere: any = {
        RfidCode: {
          not: '',
        },
      };

      // Filter by cabinet_id if provided
      if (cabinet_id) {
        // Get stock_id from cabinet table
        const cabinet = await this.prisma.cabinet.findUnique({
          where: { id: cabinet_id },
          select: { stock_id: true },
        });
        if (cabinet?.stock_id) {
          itemStocksWhere.StockID = cabinet.stock_id;
        }
      }

      // Get all items matching the filter criteria (including keyword search)
      const allItemsQuery = await this.prisma.item.findMany({
        where: {
          ...where,
          item_status: 0, // Only active items
        },
        select: {
          itemcode: true,
          itemname: true,
          CostPrice: true,
          SalePrice: true,
          CreateDate: true,
          stock_max: true,
          stock_min: true,
          item_status: true,
          itemStocks: {
            where: itemStocksWhere,
            select: {
              RowID: true,
              StockID: true,
              Qty: true,
              RfidCode: true,
              ExpireDate: true,
              IsStock: true,
              cabinet: {
                select: {
                  id: true,
                  cabinet_name: true,
                  cabinet_code: true,
                  stock_id: true,
                  cabinetDepartments: {
                    where: {
                      department_id: department_id,
                      status: status,
                    },
                    select: {
                      id: true,
                      department_id: true,
                      status: true,
                      department: {
                        select: {
                          ID: true,
                          DepName: true,
                          DepName2: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Filter items that have itemStocks matching the criteria
      const filteredItems = allItemsQuery.filter((item: any) => {
        // Must have at least one itemStock
        if (!item.itemStocks || item.itemStocks.length === 0) {
          return false;
        }

        // If department_id is provided, check if at least one itemStock has cabinet with that department
        if (department_id) {
          return item.itemStocks.some((stock: any) =>
            stock.cabinet?.cabinetDepartments &&
            stock.cabinet.cabinetDepartments.length > 0
          );
        }

        return true;
      });

      // จำนวนอุปกรณ์ที่ถูกใช้งานในปัจจุบัน (จาก supply_usage_items: qty - qty_used_with_patient - qty_returned_to_cabinet)
      const itemCodes = filteredItems.map((i: any) => i.itemcode).filter(Boolean);
      const qtyInUseMap = new Map<string, number>();
      if (itemCodes.length > 0) {
        const qtyInUseRows = await this.prisma.$queryRaw<
          { order_item_code: string; qty_in_use: bigint }[]
        >` SELECT
            sui.order_item_code,
            SUM(COALESCE(sui.qty, 0) - COALESCE(sui.qty_used_with_patient, 0) - COALESCE(sui.qty_returned_to_cabinet, 0)) AS qty_in_use
          FROM app_microservice_supply_usage_items sui
          WHERE sui.order_item_code IN (${Prisma.join(itemCodes.map((c) => Prisma.sql`${c}`))})
            AND sui.order_item_code IS NOT NULL
            AND sui.order_item_code != ''
            AND date(sui.created_at) = date(now())    
          GROUP BY sui.order_item_code
        `;
        qtyInUseRows.forEach((row) => {
          const val = Number(row.qty_in_use ?? 0);
          if (val > 0) qtyInUseMap.set(row.order_item_code, val);
        });
      }

      // จำนวนที่แจ้งชำรุด/ไม่ถูกใช้งาน (จาก app_microservice_supply_item_return_records - รวมทุกวันที่)
      // รวมเฉพาะ DAMAGED (ชำรุด) และ CONTAMINATED (ปนเปื้อน)
      const damagedReturnMap = new Map<string, number>();
      if (itemCodes.length > 0) {
        const damagedRows = await this.prisma.$queryRaw<
          { item_code: string; total_returned: bigint }[]
        >` SELECT
            srr.item_code,
            SUM(COALESCE(srr.qty_returned, 0)) AS total_returned
          FROM app_microservice_supply_item_return_records srr
          WHERE srr.item_code IN (${Prisma.join(itemCodes.map((c) => Prisma.sql`${c}`))})
            AND srr.item_code IS NOT NULL
            AND srr.item_code != ''
            AND date(srr.return_datetime) = date(now())
          GROUP BY srr.item_code
        `;
        damagedRows.forEach((row) => {
          const val = Number(row.total_returned ?? 0);
          if (val > 0) damagedReturnMap.set(row.item_code, val);
        });
      }

      // จัดลำดับรายการตามสถานะของ itemStocks:
      // 1) มี stock หมดอายุ
      // 2) มี stock ใกล้หมดอายุ (ภายใน 7 วัน)
      // 3) จำนวนชิ้น (count_itemstock) ต่ำกว่า stock_min
      const now = new Date();
      const in7Days = new Date(now);
      in7Days.setDate(in7Days.getDate() + 7);

      const itemsWithMeta = filteredItems.map((item: any) => {
        // จำกัด itemStocks ตาม department ถ้ามีระบุ
        let matchingItemStocks = item.itemStocks;
        if (department_id) {
          matchingItemStocks = item.itemStocks.filter((stock: any) =>
            stock.cabinet?.cabinetDepartments &&
            stock.cabinet.cabinetDepartments.length > 0,
          );
        }

        // count_itemstock = จำนวนที่ IsStock = true/1 (schema เป็น Boolean, DB อาจเป็น 0/1)
        const countItemStock = matchingItemStocks.filter(
          (s: any) => s.IsStock === true || s.IsStock === 1,
        ).length;

        // วิเคราะห์วันหมดอายุ และสถานะหมดอายุ/ใกล้หมดอายุ
        let earliestExpireDate: Date | null = null;
        let hasExpired = false;
        let hasNearExpire = false;

        matchingItemStocks.forEach((stock: any) => {
          if (!stock.ExpireDate) return;
          const exp = new Date(stock.ExpireDate);

          if (!earliestExpireDate || exp.getTime() < (earliestExpireDate as Date).getTime()) {
            earliestExpireDate = exp;
          }

          if (exp < now) {
            hasExpired = true;
          } else if (exp >= now && exp <= in7Days) {
            hasNearExpire = true;
          }
        });

        const stockMin = item.stock_min ?? 0;
        const isLowStock = stockMin > 0 && countItemStock < stockMin;

        // จำนวนที่แจ้งชำรุด/ไม่ถูกใช้งาน (จาก app_microservice_supply_item_return_records)
        // ใช้ qty_returned จาก return_records โดยรวมทุกวันที่ (หรือเฉพาะ DAMAGED/CONTAMINATED ถ้าต้องการ)
        const damagedQty = damagedReturnMap.get(item.itemcode) ?? 0;

        const itemWithCount = {
          ...item,
          itemStocks: matchingItemStocks,
          count_itemstock: countItemStock,
          qty_in_use: qtyInUseMap.get(item.itemcode) ?? 0,
          damaged_qty: damagedQty,
        };

        return {
          item: itemWithCount,
          hasExpired,
          hasNearExpire,
          isLowStock,
          earliestExpireDate,
        };
      });

      const sortedItems = itemsWithMeta
        .sort((a, b) => {
          // 1) มี stock หมดอายุก่อน
          if (a.hasExpired !== b.hasExpired) {
            return a.hasExpired ? -1 : 1;
          }

          // 2) ถัดมา stock ใกล้หมดอายุ (ภายใน 7 วัน)
          if (a.hasNearExpire !== b.hasNearExpire) {
            return a.hasNearExpire ? -1 : 1;
          }

          // 3) ถัดมาคือ stock ที่จำนวนชิ้นต่ำกว่า MIN
          if (a.isLowStock !== b.isLowStock) {
            return a.isLowStock ? -1 : 1;
          }

          // 4) ถ้ามีวันหมดอายุทั้งคู่ ให้เรียงจากหมดอายุเร็วไปช้า
          if (a.earliestExpireDate && b.earliestExpireDate) {
            const aTime = (a.earliestExpireDate as Date).getTime();
            const bTime = (b.earliestExpireDate as Date).getTime();
            return aTime - bTime;
          }

          // 5) fallback: เรียงตาม itemcode (A-Z)
          const codeA = a.item.itemcode || '';
          const codeB = b.item.itemcode || '';
          return codeA.localeCompare(codeB);
        })
        .map((x) => x.item);

      // Apply pagination after sorting
      const total = sortedItems.length;
      const paginatedItems = sortedItems.slice(skip, skip + limit);

      return {
        success: true,
        data: paginatedItems,
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch items',
        error: error.message,
      };
    }
  }

  async getItemsStats(cabinet_id?: number, department_id?: number) {
    try {
      // Build itemStocks where clause
      const itemStocksWhere: any = {
        RfidCode: {
          not: '',
        },
      };

      // Filter by cabinet_id if provided
      if (cabinet_id) {
        const cabinet = await this.prisma.cabinet.findUnique({
          where: { id: cabinet_id },
          select: { stock_id: true },
        });
        if (cabinet?.stock_id) {
          itemStocksWhere.StockID = cabinet.stock_id;
        }
      }

      // ชนิดอุปกรณ์ทั้งหมด (จากตาราง Item)
      const totalItemTypes = await this.prisma.item.count();

      // Get all items with itemStocks (รวม ExpireDate สำหรับนับใกล้หมดอายุ) — ไม่กรอง item_status เพื่อนับชนิดที่มีในสต็อกได้ครบ
      const allItemsQuery = await this.prisma.item.findMany({
        where: {},
        select: {
          itemcode: true,
          itemname: true,
          item_status: true,
          stock_min: true,
          itemStocks: {
            where: itemStocksWhere,
            select: {
              RowID: true,
              StockID: true,
              ExpireDate: true,
              ItemCode: true,
              RfidCode: true,
              cabinet: {
                select: {
                  id: true,
                  cabinet_name: true,
                  cabinet_code: true,
                  cabinetDepartments: {
                    where: department_id ? {
                      department_id: department_id,
                      status: 'ACTIVE',
                    } : undefined,
                    select: {
                      id: true,
                      department_id: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      });


      // Filter items that have itemStocks matching the criteria
      const filteredItems = allItemsQuery.filter((item: any) => {
        if (!item.itemStocks || item.itemStocks.length === 0) {
          return false;
        }

        // If department_id is provided, check if at least one itemStock has cabinet with that department
        if (department_id) {
          return item.itemStocks.some((stock: any) =>
            stock.cabinet?.cabinetDepartments &&
            stock.cabinet.cabinetDepartments.length > 0
          );
        }

        return true;
      });

      // Calculate stats และรวบรวม itemStocks ที่ match สำหรับนับหมดอายุ
      let totalItems = 0;
      let activeItems = 0;
      let inactiveItems = 0;
      let lowStockItems = 0;
      const allMatchingStocks: Array<{ RowID: number; ItemCode: string | null; itemname: string | null; ExpireDate: Date | null; RfidCode: string | null; cabinet_name?: string; cabinet_code?: string }> = [];

      filteredItems.forEach((item: any) => {
        // Count itemStocks (only matching ones if department_id provided)
        let matchingItemStocks = item.itemStocks;
        if (department_id) {
          matchingItemStocks = item.itemStocks.filter((stock: any) =>
            stock.cabinet?.cabinetDepartments &&
            stock.cabinet.cabinetDepartments.length > 0
          );
        }

        const countItemStock = matchingItemStocks.length;
        const stockMin = item.stock_min ?? 0;
        const isLowStock = stockMin > 0 && countItemStock < stockMin;

        totalItems++;
        if (item.item_status === 0) {
          activeItems++;
        } else {
          inactiveItems++;
        }
        if (isLowStock) {
          lowStockItems++;
        }

        // รวบรวม itemStocks สำหรับรายการวันหมดอายุ
        matchingItemStocks.forEach((stock: any) => {
          allMatchingStocks.push({
            RowID: stock.RowID,
            ItemCode: stock.ItemCode ?? item.itemcode,
            itemname: item.itemname ?? null,
            ExpireDate: stock.ExpireDate ?? null,
            RfidCode: stock.RfidCode ?? null,
            cabinet_name: stock.cabinet?.cabinet_name ?? undefined,
            cabinet_code: stock.cabinet?.cabinet_code ?? undefined,
          });
        });
      });

      // นับจำนวนชิ้นใกล้หมดอายุ (ภายใน 7 วัน และ 3 วัน)
      const now = new Date();
      const in7Days = new Date(now);
      in7Days.setDate(in7Days.getDate() + 7);
      const in3Days = new Date(now);
      in3Days.setDate(in3Days.getDate() + 3);

      let nearExpire7Days = 0;
      let nearExpire3Days = 0;
      allMatchingStocks.forEach((s) => {
        if (!s.ExpireDate) return;
        const exp = new Date(s.ExpireDate);
        if (exp <= in7Days && exp >= now) nearExpire7Days++;
        if (exp <= in3Days && exp >= now) nearExpire3Days++;
      });

      // รายการ item_stock พร้อมวันหมดอายุ (เรียงจากใกล้หมดก่อน)
      const itemsWithExpiry = allMatchingStocks
        .filter((s) => s.ExpireDate != null)
        .map((s) => ({
          RowID: s.RowID,
          ItemCode: s.ItemCode,
          itemname: s.itemname,
          ExpireDate: s.ExpireDate,
          วันหมดอายุ: s.ExpireDate ? new Date(s.ExpireDate).toISOString().split('T')[0] : null,
          RfidCode: s.RfidCode,
          cabinet_name: s.cabinet_name,
          cabinet_code: s.cabinet_code,
        }))
        .sort((a, b) => (a.ExpireDate && b.ExpireDate ? new Date(a.ExpireDate).getTime() - new Date(b.ExpireDate).getTime() : 0));

      return {
        success: true,
        data: {
          details: {
            total_item_types: totalItemTypes,
            item_types_with_stock: filteredItems.length,
            total_items: totalItems,
            active_items: activeItems,
            inactive_items: inactiveItems,
            low_stock_items: lowStockItems,
          },
          item_stock: {
            expire: {
              near_expire_7_days: nearExpire7Days,
              near_expire_3_days: nearExpire3Days,
            },
            items_with_expiry: itemsWithExpiry,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch items stats',
        error: error.message,
      };
    }
  }

  async findOneItem(itemcode: string) {
    try {
      const item = await this.prisma.item.findUnique({
        where: { itemcode },
      });

      if (!item) {
        return { success: false, message: 'Item not found' };
      }

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch item',
        error: error.message,
      };
    }
  }

  async updateItem(itemcode: string, updateItemDto: UpdateItemDto) {
    try {
      const existingItem = await this.prisma.item.findUnique({
        where: { itemcode },
      });

      if (!existingItem) {
        return { success: false, message: 'Item not found' };
      }

      // Remove undefined/null values from the DTO
      const cleanData = Object.fromEntries(
        Object.entries(updateItemDto).filter(
          ([_, value]) => value !== undefined && value !== null,
        ),
      ) as any;

      const item = await this.prisma.item.update({
        where: { itemcode },
        data: cleanData,
      });

      return {
        success: true,
        message: 'Item updated successfully',
        data: item,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update item',
        error: error.message,
      };
    }
  }

  async removeItem(itemcode: string) {
    try {
      const existingItem = await this.prisma.item.findUnique({
        where: { itemcode },
      });

      if (!existingItem) {
        return { success: false, message: 'Item not found' };
      }

      await this.prisma.item.delete({
        where: { itemcode },
      });

      return {
        success: true,
        message: 'Item deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete item',
        error: error.message,
      };
    }
  }

  async findItemsByUser(user_id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const items = await this.prisma.item.findMany({
        where: { item_status: 0 },
        orderBy: { CreateDate: 'desc' },
      });

      return {
        success: true,
        data: items,
        count: items.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch user items',
        error: error.message,
      };
    }
  }

  async updateItemMinMax(
    itemcode: string,
    updateMinMaxDto: UpdateItemMinMaxDto,
  ) {
    try {
      // Check if item exists
      const existingItem = await this.prisma.item.findUnique({
        where: { itemcode },
      });

      if (!existingItem) {
        return { success: false, message: 'Item not found' };
      }

      // Validate: stock_max should be >= stock_min
      if (
        updateMinMaxDto.stock_max !== undefined &&
        updateMinMaxDto.stock_min !== undefined
      ) {
        if (updateMinMaxDto.stock_max < updateMinMaxDto.stock_min) {
          return {
            success: false,
            message: 'Stock Max must be greater than or equal to Stock Min',
          };
        }
      }

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateMinMaxDto).filter(
          ([_, value]) => value !== undefined,
        ),
      ) as any;

      // Add ModiflyDate
      cleanData.ModiflyDate = new Date();

      const updatedItem = await this.prisma.item.update({
        where: { itemcode },
        data: cleanData,
      });

      return {
        success: true,
        message: 'Item min/max updated successfully',
        data: updatedItem,
      };
    } catch (error) {
      console.error('❌ Update min/max error:', error.message);
      return {
        success: false,
        message: 'Failed to update item min/max',
        error: error.message,
      };
    }
  }


  // ====================================== Item Stock API ======================================
  async findAllItemStock(
    page: number = 1,
    limit: number = 10,
    keyword?: string,
    sort_by: string = 'ItemCode',
    sort_order: string = 'asc',
  ) {
    try {
      const where: any = {};
      const skip = (page - 1) * limit;

      // Search in item relation (itemcode and itemname)
      if (keyword) {
        where.item = {
          OR: [
            { itemcode: { contains: keyword } },
            { itemname: { contains: keyword } },
          ],
        };
      }

      // Count total matching records
      const total = await this.prisma.itemStock.count({
        where,
      });

      // Get paginated data
      const itemStocks = await this.prisma.itemStock.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sort_by]: sort_order === 'asc' ? 'asc' : 'desc',
        },
        include: {
          item: {
            select: {
              itemcode: true,
              itemname: true,
            },
          },
        },
      });

      return {
        success: true,
        data: itemStocks,
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch item stocks',
        error: error.message,
      };
    }
  }

  // ====================================== Item Stock IN Cabinet API ======================================

  async findAllItemStockInCabinet(
    page: number = 1,
    limit: number = 10,
    keyword?: string,
    cabinet_id?: number,
  ) {
    try {
      const where: any = {};
      const skip = (page - 1) * limit;

      // แสดงเฉพาะสต็อกปัจจุบันในตู้ (IsStock = 1)
      where.IsStock = true;

      if (cabinet_id) {
        // Get stock_id from cabinet table
        const cabinet = await this.prisma.cabinet.findUnique({
          where: { id: cabinet_id },
          select: { stock_id: true },
        });
        if (cabinet?.stock_id) {
          where.StockID = cabinet.stock_id;
        }
      }

      if (keyword) {
        where.item = {
          OR: [
            { itemcode: { contains: keyword } },
            { itemname: { contains: keyword } },
          ],
        };
      }
      const total = await this.prisma.itemStock.count({
        where,
      });

      const itemStocks = await this.prisma.itemStock.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          LastCabinetModify: 'desc',
        },
        select: {
          StockID: true,
          RfidCode: true,
          LastCabinetModify: true,
          Qty: true,
          ItemCode: true,
          CabinetUserID: true,
          CreateDate: true,
          ReturnDate: true,
          InsertDate: true,
          cabinet: {
            select: {
              cabinet_name: true,
              cabinet_code: true,
            },
          },
          item: {
            select: {
              itemcode: true,
              itemname: true,
            },
          },
        },
      });

      // สรุปจำนวนอุปกรณ์แต่ละชนิดในตู้ (A กี่ชิ้น, B กี่ชิ้น, ...)
      const itemCountsRaw = await this.prisma.itemStock.groupBy({
        by: ['ItemCode'],
        where,
        _sum: { Qty: true },
        _count: { RowID: true },
      });
      const itemCodes = itemCountsRaw.map((x) => x.ItemCode).filter(Boolean) as string[];
      const itemsInfo =
        itemCodes.length > 0
          ? await this.prisma.item.findMany({
            where: { itemcode: { in: itemCodes } },
            select: { itemcode: true, itemname: true },
          })
          : [];
      const itemNameMap = Object.fromEntries(itemsInfo.map((i) => [i.itemcode, i.itemname ?? i.itemcode]));
      const item_counts = itemCountsRaw.map((row) => ({
        itemcode: row.ItemCode,
        itemname: itemNameMap[row.ItemCode ?? ''] ?? row.ItemCode ?? '-',
        total_qty: row._sum.Qty ?? 0,
        count_rows: row._count.RowID,
      }));

      return {
        success: true,
        data: itemStocks,
        item_counts,
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch item stocks in cabinet',
        error: error.message,
      };
    }
  }


  // ====================================== Item Stock Return API ======================================
  /**
   * สรุปตาม ItemCode: ถอนวันนี้ - ใช้วันนี้ - คืนวันนี้ = max_available_qty
   * ใช้ item_code จาก supply_item_return_records (อ้างอิงตามรหัสสินค้า)
   */
  async findAllItemStockWillReturn() {
    try {
      type Row = {
        ItemCode: string;
        itemname: string | null;
        withdraw_qty: number;
        used_qty: number;
        return_qty: number;
        max_available_qty: number;
      };
      const result = await this.prisma.$queryRaw<Row[]>`
    SELECT *
        FROM (
            SELECT
                w.ItemCode,
                i.itemname,
                w.withdraw_qty,
                COALESCE(u.used_qty, 0) AS used_qty,
                COALESCE(r.return_qty, 0) AS return_qty,
                (w.withdraw_qty
                    - COALESCE(u.used_qty, 0)
                    - COALESCE(r.return_qty, 0)) AS max_available_qty
            FROM (
                SELECT
                    ist.ItemCode,
                    COUNT(*) AS withdraw_qty
                FROM itemstock ist
                WHERE ist.IsStock = 0
                  AND DATE(ist.LastCabinetModify) = DATE(NOW())
                GROUP BY ist.ItemCode
            ) w
            LEFT JOIN (
                SELECT
                    sui.order_item_code AS ItemCode,
                    SUM(sui.qty) AS used_qty
                FROM app_microservice_supply_usage_items sui
                WHERE DATE(sui.created_at) = DATE(NOW()) 
                  AND sui.order_item_status != 'Discontinue'
                GROUP BY sui.order_item_code
            ) u ON u.ItemCode = w.ItemCode
            LEFT JOIN (
                SELECT
                    srr.item_code AS ItemCode,
                    SUM(srr.qty_returned) AS return_qty
                FROM app_microservice_supply_item_return_records srr
                WHERE DATE(srr.return_datetime) = DATE(NOW())
                GROUP BY srr.item_code
            ) r ON r.ItemCode = w.ItemCode
            LEFT JOIN item i ON i.itemcode = w.ItemCode
        ) x
        WHERE x.max_available_qty > 0
        ORDER BY x.ItemCode; `;

      // แปลง BigInt เป็น Number เพื่อให้ serialize ผ่าน TCP ได้ (JSON.stringify ไม่รองรับ BigInt)
      const data = result.map((row) => ({
        ItemCode: row.ItemCode,
        itemname: row.itemname,
        withdraw_qty: Number(row.withdraw_qty),
        used_qty: Number(row.used_qty),
        return_qty: Number(row.return_qty),
        max_available_qty: Number(row.max_available_qty),
      }));

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch itemstock will return count',
        error: (error as any)?.message ?? String(error),
      };
    }
  }
}
