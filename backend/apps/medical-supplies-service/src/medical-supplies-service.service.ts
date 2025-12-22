import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateMedicalSupplyUsageDto,
  UpdateMedicalSupplyUsageDto,
  GetMedicalSupplyUsagesQueryDto,
  MedicalSupplyUsageResponse,
  RecordItemUsedWithPatientDto,
  RecordItemReturnDto,
  GetPendingItemsQueryDto,
  GetReturnHistoryQueryDto,
  ItemStatus,
  ReturnReason,
} from './dto';

@Injectable()
export class MedicalSuppliesServiceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // Create Log - เก็บ log ทุกกรณี รวม error
  private async createLog(usageId: number | null, actionData: any) {
    try {
      await this.prisma.medicalSupplyUsageLog.create({
        data: {
          usage_id: usageId,
          action: actionData,
        },
      });
    } catch (error) {
      console.error('Failed to create log:', error);
    }
  }

  // Validate single ItemCode - ตรวจสอบว่า ItemCode มีในระบบหรือไม่
  async validateItemCode(itemCode: string): Promise<{ exists: boolean; item?: any }> {
    try {
      if (!itemCode) {
        return { exists: false };
      }

      const item = await this.prisma.item.findFirst({
        where: {
          itemcode: itemCode,
        },
      });

      return {
        exists: !!item,
        item: item || null,
      };
    } catch (error) {
      console.error('Error validating ItemCode:', error);
      throw new BadRequestException(`Failed to validate ItemCode: ${itemCode}`);
    }
  }

  // Validate multiple ItemCodes - ตรวจสอบ ItemCode หลายตัวพร้อมกัน
  async validateItemCodes(itemCodes: string[]): Promise<{
    valid: string[];
    invalid: string[];
    items: any[];
  }> {
    try {
      if (!itemCodes || itemCodes.length === 0) {
        return { valid: [], invalid: [], items: [] };
      }

      // Remove duplicates
      const uniqueCodes = [...new Set(itemCodes)];

      const items = await this.prisma.item.findMany({
        where: {
          itemcode: {
            in: uniqueCodes,
          },
        },
      });

      const foundCodes = items.map(item => item.itemcode);
      const invalidCodes = uniqueCodes.filter(code => !foundCodes.includes(code));

      return {
        valid: foundCodes,
        invalid: invalidCodes,
        items: items,
      };
    } catch (error) {
      console.error('Error validating ItemCodes:', error);
      throw new BadRequestException('Failed to validate ItemCodes');
    }
  }

  // Create - รับ JSON format ใหม่: Hospital, EN, HN, FirstName, Lastname, Order
  async create(data: CreateMedicalSupplyUsageDto): Promise<MedicalSupplyUsageResponse> {
    try {
      // Support both new format (EN, HN, FirstName, Lastname, Order) and legacy format
      const patientHn = data.HN || data.patient_hn || '';
      const episodeNumber = data.EN || '';
      const firstName = data.FirstName || '';
      const lastname = data.Lastname || '';
      const hospital = data.Hospital || null;

      // Determine if using new format (Order) or legacy format (supplies)
      const orderItems = data.Order || [];
      const legacySupplies = data.supplies || [];

      // Validate ItemCodes ก่อนสร้าง usage
      const allItemCodes = [
        ...orderItems.map(item => item.ItemCode),
        ...legacySupplies.map(item => item.supply_code),
      ].filter(code => code); // Remove empty codes

      if (allItemCodes.length > 0) {
        const validation = await this.validateItemCodes(allItemCodes);
        
        if (validation.invalid.length > 0) {
          // Log validation error
          await this.createLog(null, {
            type: 'CREATE',
            status: 'ERROR',
            action: 'create_medical_supply_usage',
            error_message: `Invalid ItemCodes found: ${validation.invalid.join(', ')}`,
            invalid_item_codes: validation.invalid,
            input_data: data,
          });

          throw new BadRequestException({
            message: 'Invalid ItemCodes found',
            invalidCodes: validation.invalid,
            validCodes: validation.valid,
          });
        }

        // Log successful validation
        console.log(`✅ All ItemCodes validated successfully: ${validation.valid.length} items`);
      }

      const usage = await this.prisma.medicalSupplyUsage.create({
        data: {
          hospital: hospital,
          en: episodeNumber,
          patient_hn: patientHn,
          first_name: firstName,
          lastname: lastname,
          // Legacy fields for backward compatibility
          patient_name_th: data.patient_name_th || `${firstName} ${lastname}`,
          patient_name_en: data.patient_name_en || `${firstName} ${lastname}`,
          usage_datetime: data.usage_datetime,
          usage_type: data.usage_type,
          purpose: data.purpose,
          department_code: data.department_code,
          recorded_by_user_id: data.recorded_by_user_id,
          billing_status: data.billing_status,
          billing_subtotal: data.billing_subtotal,
          billing_tax: data.billing_tax,
          billing_total: data.billing_total,
          billing_currency: data.billing_currency || 'THB',
          
          // Create supply items
          supply_items: {
            create: [
              // New format: Order items
              ...orderItems.map(item => ({
                order_item_code: item.ItemCode,
                order_item_description: item.ItemDescription,
                assession_no: item.AssessionNo,
                order_item_status: item.ItemStatus || '',
                qty: typeof item.QTY === 'string' ? parseInt(item.QTY) || 0 : item.QTY,
                uom: item.UOM,
                // Keep legacy fields as null for new format
                supply_code: item.ItemCode,
                supply_name: item.ItemDescription,
                supply_category: null,
                unit: item.UOM,
                quantity: typeof item.QTY === 'string' ? parseInt(item.QTY) || 0 : item.QTY,
                unit_price: null,
                total_price: null,
                expiry_date: null,
              })),
              // Legacy format: supplies
              ...legacySupplies.map(item => ({
                order_item_code: item.supply_code,
                order_item_description: item.supply_name,
                assession_no: '',
                order_item_status: '',
                qty: item.quantity,
                uom: item.unit,
                // Legacy fields
                supply_code: item.supply_code,
                supply_name: item.supply_name,
                supply_category: item.supply_category,
                unit: item.unit,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                expiry_date: item.expiry_date,
              })),
            ],
          },
        },
        include: {
          supply_items: true,
        },
      });

      // Create success log
      await this.createLog(usage.id, {
        type: 'CREATE',
        status: 'SUCCESS',
        hospital: hospital,
        en: episodeNumber,
        patient_hn: patientHn,
        first_name: firstName,
        lastname: lastname,
        user_id: data.recorded_by_user_id,
        order_items_count: orderItems.length,
        supplies_count: legacySupplies.length,
        total_amount: data.billing_total,
      });

      return usage as unknown as MedicalSupplyUsageResponse;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'CREATE',
        status: 'ERROR',
        hospital: data.Hospital,
        en: data.EN,
        patient_hn: data.HN || data.patient_hn,
        first_name: data.FirstName,
        lastname: data.Lastname,
        user_id: data.recorded_by_user_id,
        error_message: error.message,
        error_code: error.code,
        input_data: data,
      });
      throw error;
    }
  }

  // Get All with Pagination
  async findAll(query: GetMedicalSupplyUsagesQueryDto): Promise<{
    data: MedicalSupplyUsageResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause - support both HN and patient_hn
      const where: any = {};
      if (query.patient_hn || query.HN) {
        where.patient_hn = query.patient_hn || query.HN;
      }
      if (query.EN) {
        where.en = query.EN;
      }
      if (query.department_code) {
        where.department_code = query.department_code;
      }
      if (query.billing_status) {
        where.billing_status = query.billing_status;
      }
      if (query.usage_type) {
        where.usage_type = query.usage_type;
      }

      const [data, total] = await Promise.all([
        this.prisma.medicalSupplyUsage.findMany({
          where,
          include: {
            supply_items: {
              include: {
                return_items: true, // รวม return records ด้วย
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.medicalSupplyUsage.count({ where }),
      ]);

      // Add qty_pending to each item
      const dataWithPending = data.map(usage => ({
        ...usage,
        supply_items: usage.supply_items.map(item => ({
          ...item,
          qty_pending: (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0),
        })),
      }));

      // Create query log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findAll',
        filters: where,
        results_count: dataWithPending.length,
        total: total,
        page: page,
        limit: limit,
      });

      return {
        data: dataWithPending as unknown as MedicalSupplyUsageResponse[],
        total,
        page,
        limit,
      };
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'findAll',
        filters: query,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Get by ID
  async findOne(id: number): Promise<MedicalSupplyUsageResponse> {
    try {
      const usage = await this.prisma.medicalSupplyUsage.findUnique({
        where: { id },
        include: {
          supply_items: {
            include: {
              return_items: true, // รวม return records ด้วย
            },
          },
        },
      });

      if (!usage) {
        throw new NotFoundException(`Medical supply usage with ID ${id} not found`);
      }

      // Add qty_pending to each item
      const usageWithPending = {
        ...usage,
        supply_items: usage.supply_items.map(item => ({
          ...item,
          qty_pending: (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0),
        })),
      };

      // Create query log
      await this.createLog(usage.id, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findOne',
        usage_id: id,
      });

      return usageWithPending as unknown as MedicalSupplyUsageResponse;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'findOne',
        usage_id: id,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Get by HN
  async findByHN(hn: string): Promise<MedicalSupplyUsageResponse[]> {
    try {
      const usages = await this.prisma.medicalSupplyUsage.findMany({
        where: {
          patient_hn: hn,
        },
        include: {
          supply_items: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Create query log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findByHN',
        patient_hn: hn,
        results_count: usages.length,
      });

      return usages as unknown as MedicalSupplyUsageResponse[];
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'findByHN',
        patient_hn: hn,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Update
  async update(
    id: number,
    data: UpdateMedicalSupplyUsageDto,
  ): Promise<MedicalSupplyUsageResponse> {
    try {
      // Check if exists
      const existing = await this.prisma.medicalSupplyUsage.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Medical supply usage with ID ${id} not found`);
      }

      // Prepare update data
      const updateData: any = {
        hospital: data.Hospital,
        en: data.EN,
        first_name: data.FirstName,
        lastname: data.Lastname,
        patient_name_th: data.patient_name_th,
        patient_name_en: data.patient_name_en,
        usage_datetime: data.usage_datetime,
        usage_type: data.usage_type,
        purpose: data.purpose,
        department_code: data.department_code,
        recorded_by_user_id: data.recorded_by_user_id,
        billing_status: data.billing_status,
        billing_subtotal: data.billing_subtotal,
        billing_tax: data.billing_tax,
        billing_total: data.billing_total,
        billing_currency: data.billing_currency,
      };

      // Handle supply items update if provided
      if (data.Order && data.Order.length > 0) {
        // Delete existing items
        await this.prisma.supplyUsageItem.deleteMany({
          where: { medical_supply_usage_id: id },
        });

        // Create new items
        updateData.supply_items = {
          create: data.Order.map(item => ({
            order_item_code: item.ItemCode,
            order_item_description: item.ItemDescription,
            assession_no: item.AssessionNo,
            order_item_status: item.ItemStatus || '',
            qty: typeof item.QTY === 'string' ? parseInt(item.QTY) || 0 : item.QTY,
            uom: item.UOM,
            supply_code: item.ItemCode,
            supply_name: item.ItemDescription,
            supply_category: null,
            unit: item.UOM,
            quantity: typeof item.QTY === 'string' ? parseInt(item.QTY) || 0 : item.QTY,
            unit_price: null,
            total_price: null,
            expiry_date: null,
          })),
        };
      } else if (data.supplies && data.supplies.length > 0) {
        // Legacy format
        await this.prisma.supplyUsageItem.deleteMany({
          where: { medical_supply_usage_id: id },
        });

        updateData.supply_items = {
          create: data.supplies.map(item => ({
            order_item_code: item.supply_code,
            order_item_description: item.supply_name,
            assession_no: '',
            order_item_status: '',
            qty: item.quantity,
            uom: item.unit,
            supply_code: item.supply_code,
            supply_name: item.supply_name,
            supply_category: item.supply_category,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            expiry_date: item.expiry_date,
          })),
        };
      }

      const updated = await this.prisma.medicalSupplyUsage.update({
        where: { id },
        data: updateData,
        include: {
          supply_items: true,
        },
      });

      // Create update log
      await this.createLog(updated.id, {
        type: 'UPDATE',
        status: 'SUCCESS',
        usage_id: id,
        updated_fields: Object.keys(data),
        order_items_count: data.Order?.length || 0,
        supplies_count: data.supplies?.length || 0,
      });

      return updated as unknown as MedicalSupplyUsageResponse;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'UPDATE',
        status: 'ERROR',
        usage_id: id,
        error_message: error.message,
        error_code: error.code,
        input_data: data,
      });
      throw error;
    }
  }

  // Delete
  async remove(id: number): Promise<{ message: string }> {
    try {
      const existing = await this.prisma.medicalSupplyUsage.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Medical supply usage with ID ${id} not found`);
      }

      // Create delete log before deleting
      await this.createLog(id, {
        type: 'DELETE',
        status: 'SUCCESS',
        usage_id: id,
        patient_hn: existing.patient_hn,
        en: existing.en,
      });

      await this.prisma.medicalSupplyUsage.delete({
        where: { id },
      });

      return { message: `Medical supply usage with ID ${id} has been deleted` };
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'DELETE',
        status: 'ERROR',
        usage_id: id,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Update Print Information (อัพเดตข้อมูล Print ใน medical_supply_usages)
  async updatePrintInfo(
    usageId: number,
    printData: {
      Twu?: string;
      PrintLocation?: string;
      PrintDate?: string;
      TimePrintDate?: string;
      update?: string;
    },
  ): Promise<MedicalSupplyUsageResponse> {
    try {
      // Check if usage exists
      const existing = await this.prisma.medicalSupplyUsage.findUnique({
        where: { id: usageId },
        include: {
          supply_items: true,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Medical supply usage with ID ${usageId} not found`);
      }

      // Prepare update data for medical_supply_usages table
      const updateData: any = {};
      
      // Update all print information in medical_supply_usages (ทุกฟิลด์อยู่ที่ usage level)
      if (printData.Twu !== undefined) {
        updateData.twu = printData.Twu;
      }
      if (printData.PrintLocation !== undefined) {
        updateData.print_location = printData.PrintLocation;
      }
      if (printData.PrintDate !== undefined) {
        updateData.print_date = printData.PrintDate;
      }
      if (printData.TimePrintDate !== undefined) {
        updateData.time_print_date = printData.TimePrintDate;
      }
      if (printData.update !== undefined) {
        updateData.update = printData.update;
      }

      // Update medical_supply_usages record
      const updated = await this.prisma.medicalSupplyUsage.update({
        where: { id: usageId },
        data: updateData,
        include: {
          supply_items: true,
        },
      });

      // Create update log
      await this.createLog(usageId, {
        type: 'UPDATE_PRINT_INFO',
        status: 'SUCCESS',
        usage_id: usageId,
        patient_hn: existing.patient_hn,
        en: existing.en,
        updated_fields: printData,
        supply_items_count: existing.supply_items.length,
      });

      return updated as unknown as MedicalSupplyUsageResponse;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'UPDATE_PRINT_INFO',
        status: 'ERROR',
        usage_id: usageId,
        error_message: error.message,
        error_code: error.code,
        input_data: printData,
      });
      throw error;
    }
  }

  // Get by Department
  async findByDepartment(departmentCode: string): Promise<MedicalSupplyUsageResponse[]> {
    try {
      const usages = await this.prisma.medicalSupplyUsage.findMany({
        where: {
          department_code: departmentCode,
        },
        include: {
          supply_items: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Create query log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findByDepartment',
        department_code: departmentCode,
        results_count: usages.length,
      });

      return usages as unknown as MedicalSupplyUsageResponse[];
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'findByDepartment',
        department_code: departmentCode,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Get Statistics
  async getStatistics(): Promise<any> {
    try {
      const [totalUsages, totalByStatus, totalByType] = await Promise.all([
        this.prisma.medicalSupplyUsage.count(),
        this.prisma.medicalSupplyUsage.groupBy({
          by: ['billing_status'],
          _count: true,
        }),
        this.prisma.medicalSupplyUsage.groupBy({
          by: ['usage_type'],
          _count: true,
        }),
      ]);

      const stats = {
        total_usages: totalUsages,
        by_billing_status: totalByStatus,
        by_usage_type: totalByType,
      };

      // Create query log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'getStatistics',
        stats: stats,
      });

      return stats;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'getStatistics',
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Update Billing Status
  async updateBillingStatus(
    id: number,
    status: string,
  ): Promise<MedicalSupplyUsageResponse> {
    try {
      const existing = await this.prisma.medicalSupplyUsage.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Medical supply usage with ID ${id} not found`);
      }

      const updated = await this.prisma.medicalSupplyUsage.update({
        where: { id },
        data: { billing_status: status },
        include: {
          supply_items: true,
        },
      });

      // Create update log
      await this.createLog(updated.id, {
        type: 'UPDATE',
        status: 'SUCCESS',
        action: 'updateBillingStatus',
        usage_id: id,
        old_status: existing.billing_status,
        new_status: status,
      });

      return updated as unknown as MedicalSupplyUsageResponse;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'UPDATE',
        status: 'ERROR',
        action: 'updateBillingStatus',
        usage_id: id,
        new_status: status,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // ===============================================
  // Quantity Management & Return System
  // ===============================================

  // Get Supply Item by ID (with quantity breakdown and return records)
  async getSupplyItemById(itemId: number): Promise<any> {
    try {
      const item = await this.prisma.supplyUsageItem.findUnique({
        where: { id: itemId },
        include: {
          usage: true,
          return_items: {
            orderBy: {
              return_datetime: 'desc',
            },
          },
        },
      });

      if (!item) {
        throw new NotFoundException(`Supply usage item with ID ${itemId} not found`);
      }

      // Calculate qty_pending
      const qty_pending = (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0);

      const result = {
        ...item,
        qty_pending,
      };

      // Create log
      await this.createLog(item.medical_supply_usage_id, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'getSupplyItemById',
        item_id: itemId,
      });

      return result;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'getSupplyItemById',
        item_id: itemId,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Get Supply Items by Usage ID (with quantity breakdown)
  async getSupplyItemsByUsageId(usageId: number): Promise<any[]> {
    try {
      const items = await this.prisma.supplyUsageItem.findMany({
        where: { medical_supply_usage_id: usageId },
        include: {
          return_items: {
            orderBy: {
              return_datetime: 'desc',
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      // Add qty_pending to each item
      const itemsWithPending = items.map(item => ({
        ...item,
        qty_pending: (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0),
      }));

      // Create log
      await this.createLog(usageId, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'getSupplyItemsByUsageId',
        usage_id: usageId,
        items_count: items.length,
      });

      return itemsWithPending;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'getSupplyItemsByUsageId',
        usage_id: usageId,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Helper: Calculate item status based on quantities
  private calculateItemStatus(qty: number, qtyUsed: number, qtyReturned: number): ItemStatus {
    const qtyPending = qty - qtyUsed - qtyReturned;
    
    if (qtyPending === qty) {
      return ItemStatus.PENDING;
    } else if (qtyPending === 0) {
      return ItemStatus.COMPLETED;
    } else {
      return ItemStatus.PARTIAL;
    }
  }

  // Helper: Validate quantity
  private validateQuantity(item: any, additionalQty: number, type: 'used' | 'returned'): void {
    const currentQtyUsed = item.qty_used_with_patient || 0;
    const currentQtyReturned = item.qty_returned_to_cabinet || 0;
    const totalQty = item.qty || 0;

    let newQtyUsed = currentQtyUsed;
    let newQtyReturned = currentQtyReturned;

    if (type === 'used') {
      newQtyUsed += additionalQty;
    } else {
      newQtyReturned += additionalQty;
    }

    const total = newQtyUsed + newQtyReturned;

    if (total > totalQty) {
      throw new BadRequestException({
        message: 'จำนวนรวมเกินกว่าที่อนุมัติ',
        error: 'QUANTITY_EXCEEDED',
        details: {
          approved: totalQty,
          used: newQtyUsed,
          returned: newQtyReturned,
          total: total,
        },
      });
    }

    if (additionalQty <= 0) {
      throw new BadRequestException('จำนวนต้องมากกว่า 0');
    }
  }

  // บันทึกการใช้อุปกรณ์กับคนไข้
  async recordItemUsedWithPatient(data: RecordItemUsedWithPatientDto): Promise<any> {
    try {
      // Check if item exists
      const item = await this.prisma.supplyUsageItem.findUnique({
        where: { id: data.item_id },
        include: {
          usage: true,
        },
      });

      if (!item) {
        throw new NotFoundException(`Supply usage item with ID ${data.item_id} not found`);
      }

      // Validate quantity
      this.validateQuantity(item, data.qty_used, 'used');

      // Update item
      const newQtyUsed = (item.qty_used_with_patient || 0) + data.qty_used;
      const newStatus = this.calculateItemStatus(
        item.qty || 0,
        newQtyUsed,
        item.qty_returned_to_cabinet || 0
      );

      const updated = await this.prisma.supplyUsageItem.update({
        where: { id: data.item_id },
        data: {
          qty_used_with_patient: newQtyUsed,
          item_status: newStatus,
        },
        include: {
          return_items: true,
        },
      });

      // Create log
      await this.createLog(item.medical_supply_usage_id, {
        type: 'RECORD_USED_WITH_PATIENT',
        status: 'SUCCESS',
        item_id: data.item_id,
        qty_used: data.qty_used,
        total_qty_used: newQtyUsed,
        item_status: newStatus,
        order_item_code: item.order_item_code,
        patient_hn: item.usage.patient_hn,
        recorded_by_user_id: data.recorded_by_user_id,
      });

      return updated;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'RECORD_USED_WITH_PATIENT',
        status: 'ERROR',
        item_id: data.item_id,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // บันทึกการคืนอุปกรณ์เข้าตู้
  async recordItemReturn(data: RecordItemReturnDto): Promise<any> {
    try {
      // Check if item exists
      const item = await this.prisma.supplyUsageItem.findUnique({
        where: { id: data.item_id },
        include: {
          usage: true,
          return_items: true,
        },
      });

      if (!item) {
        throw new NotFoundException(`Supply usage item with ID ${data.item_id} not found`);
      }

      // Validate quantity
      this.validateQuantity(item, data.qty_returned, 'returned');

      // Create return record and update item in transaction
      const [returnRecord, updatedItem] = await this.prisma.$transaction(async (tx) => {
        // Create return record
        const record = await tx.supplyItemReturnRecord.create({
          data: {
            supply_usage_item_id: data.item_id,
            qty_returned: data.qty_returned,
            return_reason: data.return_reason,
            return_by_user_id: data.return_by_user_id,
            return_note: data.return_note,
          },
        });

        // Update item quantities and status
        const newQtyReturned = (item.qty_returned_to_cabinet || 0) + data.qty_returned;
        const newStatus = this.calculateItemStatus(
          item.qty || 0,
          item.qty_used_with_patient || 0,
          newQtyReturned
        );

        const updated = await tx.supplyUsageItem.update({
          where: { id: data.item_id },
          data: {
            qty_returned_to_cabinet: newQtyReturned,
            item_status: newStatus,
          },
          include: {
            return_items: true,
          },
        });

        return [record, updated];
      });

      // Create log
      await this.createLog(item.medical_supply_usage_id, {
        type: 'RECORD_RETURN',
        status: 'SUCCESS',
        item_id: data.item_id,
        return_record_id: returnRecord.id,
        qty_returned: data.qty_returned,
        return_reason: data.return_reason,
        total_qty_returned: updatedItem.qty_returned_to_cabinet,
        item_status: updatedItem.item_status,
        order_item_code: item.order_item_code,
        patient_hn: item.usage.patient_hn,
        return_by_user_id: data.return_by_user_id,
      });

      return {
        return_record: returnRecord,
        updated_item: updatedItem,
      };
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'RECORD_RETURN',
        status: 'ERROR',
        item_id: data.item_id,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // ดึงรายการที่รอดำเนินการ
  async getPendingItems(query: GetPendingItemsQueryDto): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (query.item_status) {
        where.item_status = query.item_status;
      } else {
        // Default: show PENDING and PARTIAL
        where.item_status = {
          in: [ItemStatus.PENDING, ItemStatus.PARTIAL],
        };
      }

      // Add usage filters
      if (query.department_code || query.patient_hn) {
        where.usage = {};
        if (query.department_code) {
          where.usage.department_code = query.department_code;
        }
        if (query.patient_hn) {
          where.usage.patient_hn = query.patient_hn;
        }
      }

      const [data, total] = await Promise.all([
        this.prisma.supplyUsageItem.findMany({
          where,
          include: {
            usage: true,
            return_items: true,
          },
          skip,
          take: limit,
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.supplyUsageItem.count({ where }),
      ]);

      // Add calculated qty_pending to each item
      const dataWithPending = data.map(item => ({
        ...item,
        qty_pending: (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0),
      }));

      // Create log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'getPendingItems',
        filters: query,
        results_count: data.length,
        total: total,
      });

      return {
        data: dataWithPending,
        total,
        page,
        limit,
      };
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'getPendingItems',
        filters: query,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // ดึงประวัติการคืนอุปกรณ์
  async getReturnHistory(query: GetReturnHistoryQueryDto): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (query.return_reason) {
        where.return_reason = query.return_reason;
      }

      // Date range filter
      if (query.date_from || query.date_to) {
        where.return_datetime = {};
        if (query.date_from) {
          where.return_datetime.gte = new Date(query.date_from);
        }
        if (query.date_to) {
          const endDate = new Date(query.date_to);
          endDate.setDate(endDate.getDate() + 1);
          where.return_datetime.lt = endDate;
        }
      }

      // Usage filters (via supply_item relation)
      if (query.department_code || query.patient_hn) {
        where.supply_item = {
          usage: {},
        };
        if (query.department_code) {
          where.supply_item.usage.department_code = query.department_code;
        }
        if (query.patient_hn) {
          where.supply_item.usage.patient_hn = query.patient_hn;
        }
      }

      const [data, total] = await Promise.all([
        this.prisma.supplyItemReturnRecord.findMany({
          where,
          include: {
            supply_item: {
              include: {
                usage: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            return_datetime: 'desc',
          },
        }),
        this.prisma.supplyItemReturnRecord.count({ where }),
      ]);

      // Create log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'getReturnHistory',
        filters: query,
        results_count: data.length,
        total: total,
      });

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'getReturnHistory',
        filters: query,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // สถิติการจัดการอุปกรณ์
  async getQuantityStatistics(departmentCode?: string): Promise<any> {
    try {
      const where: any = {};

      if (departmentCode) {
        where.usage = {
          department_code: departmentCode,
        };
      }

      // Get all items
      const items = await this.prisma.supplyUsageItem.findMany({
        where,
        select: {
          qty: true,
          qty_used_with_patient: true,
          qty_returned_to_cabinet: true,
          item_status: true,
        },
      });

      // Calculate totals
      let totalQty = 0;
      let totalQtyUsed = 0;
      let totalQtyReturned = 0;
      let totalQtyPending = 0;

      items.forEach(item => {
        const qty = item.qty || 0;
        const qtyUsed = item.qty_used_with_patient || 0;
        const qtyReturned = item.qty_returned_to_cabinet || 0;
        const qtyPending = qty - qtyUsed - qtyReturned;

        totalQty += qty;
        totalQtyUsed += qtyUsed;
        totalQtyReturned += qtyReturned;
        totalQtyPending += qtyPending;
      });

      // Get status counts
      const statusCounts = await this.prisma.supplyUsageItem.groupBy({
        by: ['item_status'],
        where,
        _count: true,
      });

      // Get return reason counts
      const returnReasonCounts = await this.prisma.supplyItemReturnRecord.groupBy({
        by: ['return_reason'],
        where: departmentCode ? {
          supply_item: {
            usage: {
              department_code: departmentCode,
            },
          },
        } : {},
        _count: true,
        _sum: {
          qty_returned: true,
        },
      });

      const stats = {
        total_qty: totalQty,
        total_qty_used_with_patient: totalQtyUsed,
        total_qty_returned_to_cabinet: totalQtyReturned,
        total_qty_pending: totalQtyPending,
        percentage_used: totalQty > 0 ? ((totalQtyUsed / totalQty) * 100).toFixed(2) : 0,
        percentage_returned: totalQty > 0 ? ((totalQtyReturned / totalQty) * 100).toFixed(2) : 0,
        percentage_pending: totalQty > 0 ? ((totalQtyPending / totalQty) * 100).toFixed(2) : 0,
        by_status: statusCounts,
        by_return_reason: returnReasonCounts,
      };

      // Create log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'getQuantityStatistics',
        department_code: departmentCode,
        stats: stats,
      });

      return stats;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'getQuantityStatistics',
        department_code: departmentCode,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Get Dispensed Items (RFID Stock)
  async getDispensedItems(filters?: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const offset = (page - 1) * limit;

      // Build WHERE conditions for raw SQL
      const sqlConditions: Prisma.Sql[] = [
        Prisma.sql`ist.StockID = 0`,
        Prisma.sql`ist.RfidCode <> ''`,
      ];

      if (filters?.itemCode) {
        sqlConditions.push(Prisma.sql`ist.ItemCode = ${filters.itemCode}`);
      }
      if (filters?.itemTypeId) {
        sqlConditions.push(Prisma.sql`i.itemtypeID = ${filters.itemTypeId}`);
      }
      if (filters?.startDate) {
        sqlConditions.push(Prisma.sql`ist.LastCabinetModify >= ${new Date(filters.startDate)}`);
      }
      if (filters?.endDate) {
        sqlConditions.push(Prisma.sql`ist.LastCabinetModify <= ${new Date(filters.endDate)}`);
      }

      // Combine WHERE conditions with AND
      const whereClause = Prisma.join(sqlConditions, ' AND ');

      // Get total count first
      const countResult: any[] = await this.prisma.$queryRaw`
        SELECT COUNT(DISTINCT CONCAT(i.itemcode, '-', ist.LastCabinetModify)) as total
        FROM itemstock ist
        INNER JOIN item i ON ist.ItemCode = i.itemcode
        INNER JOIN itemtype it ON i.itemtypeID = it.ID
        WHERE ${whereClause}
      `;
      const totalCount = Number(countResult[0]?.total || 0);

      // Get data from itemstock with relations using raw query
      const dispensedItems: any[] = await this.prisma.$queryRaw`
        SELECT
          ist.RowID,
          i.itemcode,
          i.itemname,
          ist.LastCabinetModify AS modifyDate,
          ist.Qty AS qty,
          it.TypeName AS itemType,
          'RFID' AS itemCategory,
          i.itemtypeID,
          ist.RfidCode,
          ist.StockID,
          ist.CabinetCode,
          ist.Istatus_rfid
        FROM itemstock ist
        INNER JOIN item i ON ist.ItemCode = i.itemcode
        INNER JOIN itemtype it ON i.itemtypeID = it.ID
        WHERE ${whereClause}
        ORDER BY ist.LastCabinetModify DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      // Convert BigInt to Number for JSON serialization
      const result = dispensedItems.map(item => ({
        ...item,
        RowID: item.RowID ? Number(item.RowID) : null,
        qty: Number(item.qty),
        itemtypeID: item.itemtypeID ? Number(item.itemtypeID) : null,
        StockID: item.StockID ? Number(item.StockID) : null,
      }));

      const totalPages = Math.ceil(totalCount / limit);

      // Create success log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'getDispensedItems',
        filters: filters || {},
        result_count: result.length,
      });

      return {
        success: true,
        data: result,
        total: totalCount,
        page,
        limit,
        totalPages,
        filters: filters || {},
      };
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'getDispensedItems',
        filters: filters || {},
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Get Usage Records by Item Code (Who used this item)
  async getUsageByItemCode(filters?: {
    itemCode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions: any = {
        supply_items: {
          some: {
            supply_code: filters?.itemCode,
          }
        }
      };

      if (filters?.startDate || filters?.endDate) {
        whereConditions.usage_datetime = {};
        if (filters?.startDate) {
          whereConditions.usage_datetime.gte = new Date(filters.startDate);
        }
        if (filters?.endDate) {
          whereConditions.usage_datetime.lte = new Date(filters.endDate);
        }
      }

      // Get total count
      const totalCount = await this.prisma.medicalSupplyUsage.count({
        where: whereConditions,
      });

      // Get usage records
      const usageRecords = await this.prisma.medicalSupplyUsage.findMany({
        where: whereConditions,
        include: {
          supply_items: {
            where: {
              supply_code: filters?.itemCode,
            },
          },
        },
        orderBy: {
          usage_datetime: 'desc',
        },
        skip: offset,
        take: limit,
      });

      // Format result
      const result = usageRecords.map(usage => {
        const supplyItem = usage.supply_items[0]; // Get the first matching supply item
        return {
          usage_id: usage.id,
          patient_hn: usage.patient_hn,
          patient_name: `${usage.first_name || ''} ${usage.lastname || ''}`.trim(),
          patient_en: usage.en,
          department_code: usage.department_code,
          usage_datetime: usage.usage_datetime,
          itemcode: supplyItem?.supply_code,
          itemname: supplyItem?.supply_name,
          qty_used: supplyItem?.qty,
          qty_returned: supplyItem?.qty_returned_to_cabinet,
          created_at: usage.created_at,
          updated_at: usage.updated_at,
        };
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: result,
        total: totalCount,
        page,
        limit,
        totalPages,
        filters: filters || {},
      };
    } catch (error) {
      throw error;
    }
  }
  // ==============================================================
  // ============ Compare Dispensed vs Usage Records ==============
    // ============================================================
  async compareDispensedVsUsage(filters?: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      // 1. Get Dispensed Items (from itemstock)
      const sqlConditionsDispensed: Prisma.Sql[] = [
        Prisma.sql`ist.StockID = 0`,
        Prisma.sql`ist.RfidCode <> ''`,
      ];

      if (filters?.itemCode) {
        sqlConditionsDispensed.push(Prisma.sql`ist.ItemCode = ${filters.itemCode}`);
      }
      if (filters?.itemTypeId) {
        sqlConditionsDispensed.push(Prisma.sql`i.itemtypeID = ${filters.itemTypeId}`);
      }
      if (filters?.startDate) {
        sqlConditionsDispensed.push(Prisma.sql`ist.LastCabinetModify >= ${new Date(filters.startDate)}`);
      }
      if (filters?.endDate) {
        sqlConditionsDispensed.push(Prisma.sql`ist.LastCabinetModify <= ${new Date(filters.endDate)}`);
      }

      const whereClauseDispensed = Prisma.join(sqlConditionsDispensed, ' AND ');

      const dispensedItems: any[] = await this.prisma.$queryRaw`
        SELECT
          i.itemcode,
          i.itemname,
          SUM(ist.Qty) AS total_dispensed,
          COUNT(DISTINCT ist.RfidCode) AS dispensed_records,
          MIN(ist.LastCabinetModify) AS first_dispensed,
          MAX(ist.LastCabinetModify) AS last_dispensed,
          it.TypeName AS itemType,
          i.itemtypeID
        FROM itemstock ist
        INNER JOIN item i ON ist.ItemCode = i.itemcode
        INNER JOIN itemtype it ON i.itemtypeID = it.ID
        WHERE ${whereClauseDispensed}
        GROUP BY i.itemcode, i.itemname, it.TypeName, i.itemtypeID
        ORDER BY i.itemcode
      `;

      // 2. Get Usage Records (from medical_supply_usage)
      const whereConditionsUsage: any = {};

      if (filters?.departmentCode) {
        whereConditionsUsage.department_code = filters.departmentCode;
      }
      if (filters?.startDate || filters?.endDate) {
        whereConditionsUsage.usage_datetime = {};
        if (filters.startDate) {
          whereConditionsUsage.usage_datetime.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          whereConditionsUsage.usage_datetime.lte = new Date(filters.endDate);
        }
      }

      const usageRecords = await this.prisma.medicalSupplyUsage.findMany({
        where: whereConditionsUsage,
        include: {
          supply_items: {
            where: filters?.itemCode ? { supply_code: filters.itemCode } : {},
          },
        },
      });

      // Aggregate usage data by itemcode
      const usageByItem = new Map<string, any>();

      for (const usage of usageRecords) {
        for (const item of usage.supply_items) {
          const itemCode = item.supply_code;
          if (!itemCode) continue; // Skip if no supply_code
          
          // Filter by itemTypeId if specified
          if (filters?.itemTypeId) {
            const itemInfo = await this.prisma.item.findUnique({
              where: { itemcode: itemCode },
              select: { itemtypeID: true },
            });
            if (itemInfo?.itemtypeID !== filters.itemTypeId) {
              continue;
            }
          }

          if (!usageByItem.has(itemCode)) {
            usageByItem.set(itemCode, {
              itemcode: itemCode,
              total_used: 0,
              usage_records: 0,
              first_used: item.created_at,
              last_used: item.created_at,
            });
          }

          const existing = usageByItem.get(itemCode)!;
          existing.total_used += item.qty;
          existing.usage_records += 1;
          if (item.created_at < existing.first_used) {
            existing.first_used = item.created_at;
          }
          if (item.created_at > existing.last_used) {
            existing.last_used = item.created_at;
          }
        }
      }

      // 3. Compare and create comparison data
      const comparison: any[] = [];
      const dispensedMap = new Map(dispensedItems.map(item => [item.itemcode, item]));
      const allItemCodes = new Set([
        ...dispensedItems.map(d => d.itemcode),
        ...Array.from(usageByItem.keys()),
      ]);

      for (const itemCode of allItemCodes) {
        const dispensed = dispensedMap.get(itemCode);
        const usage = usageByItem.get(itemCode);

        const totalDispensed = dispensed ? Number(dispensed.total_dispensed) : 0;
        const totalUsed = usage ? usage.total_used : 0;
        const difference = totalDispensed - totalUsed;

        let status: string;
        if (totalDispensed === 0 && totalUsed > 0) {
          status = 'USED_WITHOUT_DISPENSE'; // ใช้แล้วแต่ไม่มีการเบิก
        } else if (totalDispensed > 0 && totalUsed === 0) {
          status = 'DISPENSED_NOT_USED'; // เบิกแล้วแต่ยังไม่ใช้
        } else if (difference > 0) {
          status = 'DISPENSE_EXCEEDS_USAGE'; // เบิกมากกว่าใช้
        } else if (difference < 0) {
          status = 'USAGE_EXCEEDS_DISPENSE'; // ใช้มากกว่าเบิก
        } else {
          status = 'MATCHED'; // ตรงกัน
        }

        comparison.push({
          itemcode: itemCode,
          itemname: dispensed?.itemname || null,
          itemType: dispensed?.itemType || null,
          itemtypeID: dispensed?.itemtypeID ? Number(dispensed.itemtypeID) : null,
          
          // Dispensed data
          total_dispensed: totalDispensed,
          dispensed_records: dispensed ? Number(dispensed.dispensed_records) : 0,
          first_dispensed: dispensed?.first_dispensed || null,
          last_dispensed: dispensed?.last_dispensed || null,
          
          // Usage data
          total_used: totalUsed,
          usage_records: usage?.usage_records || 0,
          first_used: usage?.first_used || null,
          last_used: usage?.last_used || null,
          
          // Comparison
          difference: difference,
          status: status,
        });
      }

      // Sort by status priority and difference
      const statusPriority: any = {
        'USAGE_EXCEEDS_DISPENSE': 1,
        'USED_WITHOUT_DISPENSE': 2,
        'DISPENSE_EXCEEDS_USAGE': 3,
        'DISPENSED_NOT_USED': 4,
        'MATCHED': 5,
      };

      comparison.sort((a, b) => {
        const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
        if (priorityDiff !== 0) return priorityDiff;
        return Math.abs(b.difference) - Math.abs(a.difference);
      });

      // Calculate summary
      const summary = {
        total_items: comparison.length,
        matched: comparison.filter(c => c.status === 'MATCHED').length,
        dispensed_not_used: comparison.filter(c => c.status === 'DISPENSED_NOT_USED').length,
        used_without_dispense: comparison.filter(c => c.status === 'USED_WITHOUT_DISPENSE').length,
        dispense_exceeds_usage: comparison.filter(c => c.status === 'DISPENSE_EXCEEDS_USAGE').length,
        usage_exceeds_dispense: comparison.filter(c => c.status === 'USAGE_EXCEEDS_DISPENSE').length,
        total_dispensed: comparison.reduce((sum, c) => sum + c.total_dispensed, 0),
        total_used: comparison.reduce((sum, c) => sum + c.total_used, 0),
        total_difference: comparison.reduce((sum, c) => sum + Math.abs(c.difference), 0),
      };

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const totalItems = comparison.length;
      const totalPages = Math.ceil(totalItems / limit);
      const offset = (page - 1) * limit;
      const paginatedComparison = comparison.slice(offset, offset + limit);

      // Create success log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'compareDispensedVsUsage',
        filters: filters || {},
        summary: summary,
      });

      return {
        success: true,
        summary: summary,
        comparison: paginatedComparison,
        pagination: {
          page,
          limit,
          total: totalItems,
          totalPages,
        },
        filters: filters || {},
      };
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'compareDispensedVsUsage',
        filters: filters || {},
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }
}
