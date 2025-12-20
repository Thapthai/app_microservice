import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
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
      throw new BadRequestException(
        `จำนวนเกินที่เบิก: เบิก=${totalQty}, ใช้=${newQtyUsed}, คืน=${newQtyReturned}, รวม=${total}`
      );
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
}
