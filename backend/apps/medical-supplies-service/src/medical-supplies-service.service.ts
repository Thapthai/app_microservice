import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateMedicalSupplyUsageDto,
  UpdateMedicalSupplyUsageDto,
  GetMedicalSupplyUsagesQueryDto,
  MedicalSupplyUsageResponse,
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
            supply_items: true,
          },
          skip,
          take: limit,
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.medicalSupplyUsage.count({ where }),
      ]);

      // Create query log
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findAll',
        filters: where,
        results_count: data.length,
        total: total,
        page: page,
        limit: limit,
      });

      return {
        data: data as unknown as MedicalSupplyUsageResponse[],
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
          supply_items: true,
        },
      });

      if (!usage) {
        throw new NotFoundException(`Medical supply usage with ID ${id} not found`);
      }

      // Create query log
      await this.createLog(usage.id, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findOne',
        usage_id: id,
      });

      return usage as unknown as MedicalSupplyUsageResponse;
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
}
