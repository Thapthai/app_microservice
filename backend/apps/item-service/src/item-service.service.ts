import { Injectable } from '@nestjs/common';
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

      // Build itemStocks where clause
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

      // Add count_itemstock to each item (only count matching itemStocks)
      const itemsWithCount = filteredItems.map((item: any) => {
        // If department_id is provided, only count itemStocks that have cabinet with that department
        let matchingItemStocks = item.itemStocks;
        if (department_id) {
          matchingItemStocks = item.itemStocks.filter((stock: any) =>
            stock.cabinet?.cabinetDepartments &&
            stock.cabinet.cabinetDepartments.length > 0
          );
        }

        return {
          ...item,
          itemStocks: matchingItemStocks, // Replace with filtered itemStocks
          count_itemstock: matchingItemStocks.length,
        };
      });

      // Apply pagination after filtering
      const total = itemsWithCount.length;
      const paginatedItems = itemsWithCount.slice(skip, skip + limit);

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

      // Get all items with itemStocks (รวม ExpireDate สำหรับนับใกล้หมดอายุ)
      const allItemsQuery = await this.prisma.item.findMany({
        where: {
          item_status: 0, // Only active items
        },
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

}
