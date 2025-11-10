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

  // Create - รับ JSON format: patient_hn, patient_name_th, patient_name_en, supplies
  async create(data: CreateMedicalSupplyUsageDto): Promise<MedicalSupplyUsageResponse> {
    try {
      const usage = await this.prisma.medicalSupplyUsage.create({
        data: {
          patient_hn: data.patient_hn,
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
          billing_currency: data.billing_currency || 'THB',
          // Create supply items
          supply_items: {
            create: data.supplies.map(item => ({
              supply_code: item.supply_code,
              supply_name: item.supply_name,
              supply_category: item.supply_category,
              unit: item.unit,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              expiry_date: item.expiry_date,
            })),
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
        patient_hn: data.patient_hn,
        user_id: data.recorded_by_user_id,
        supplies_count: data.supplies.length,
        total_amount: data.billing_total,
      });

      return usage as unknown as MedicalSupplyUsageResponse;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'CREATE',
        status: 'ERROR',
        patient_hn: data.patient_hn,
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

      const where: any = {};

      if (query.patient_hn) {
        where.patient_hn = { contains: query.patient_hn };
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

      const [usages, total] = await Promise.all([
        this.prisma.medicalSupplyUsage.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            supply_items: true,
          },
        }),
        this.prisma.medicalSupplyUsage.count({ where }),
      ]);

      // Log successful query
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findAll',
        query_params: query,
        results_count: usages.length,
      });

      return {
        data: usages as unknown as MedicalSupplyUsageResponse[],
        total,
        page,
        limit,
      };
    } catch (error) {
      // Log error
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'findAll',
        query_params: query,
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
        // Log not found
        await this.createLog(null, {
          type: 'QUERY',
          status: 'NOT_FOUND',
          action: 'findOne',
          usage_id: id,
        });
        throw new NotFoundException(`Medical Supply Usage with ID ${id} not found`);
      }

      // Log success
      await this.createLog(id, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findOne',
      });

      return usage as unknown as MedicalSupplyUsageResponse;
    } catch (error) {
      // Log error (if not NotFoundException)
      if (!(error instanceof NotFoundException)) {
        await this.createLog(null, {
          type: 'QUERY',
          status: 'ERROR',
          action: 'findOne',
          usage_id: id,
          error_message: error.message,
          error_code: error.code,
        });
      }
      throw error;
    }
  }

  // Get by HN
  async findByHN(hn: string): Promise<MedicalSupplyUsageResponse[]> {
    try {
      const usages = await this.prisma.medicalSupplyUsage.findMany({
        where: { patient_hn: { contains: hn } },
        orderBy: { created_at: 'desc' },
        include: {
          supply_items: true,
        },
      });

      // Log success
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findByHN',
        patient_hn: hn,
        results_count: usages.length,
      });

      return usages as unknown as MedicalSupplyUsageResponse[];
    } catch (error) {
      // Log error
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
      // Get old values for logging
      const oldUsage = await this.prisma.medicalSupplyUsage.findUnique({
        where: { id },
      });

      if (!oldUsage) {
        throw new NotFoundException(`Medical Supply Usage with ID ${id} not found`);
      }

      const updateData: any = {};

      if (data.patient_name_th) updateData.patient_name_th = data.patient_name_th;
      if (data.patient_name_en) updateData.patient_name_en = data.patient_name_en;
      if (data.usage_datetime) updateData.usage_datetime = data.usage_datetime;
      if (data.usage_type) updateData.usage_type = data.usage_type;
      if (data.purpose) updateData.purpose = data.purpose;
      if (data.department_code) updateData.department_code = data.department_code;
      if (data.recorded_by_user_id) updateData.recorded_by_user_id = data.recorded_by_user_id;
      if (data.billing_status) updateData.billing_status = data.billing_status;
      if (data.billing_subtotal !== undefined) updateData.billing_subtotal = data.billing_subtotal;
      if (data.billing_tax !== undefined) updateData.billing_tax = data.billing_tax;
      if (data.billing_total !== undefined) updateData.billing_total = data.billing_total;
      if (data.billing_currency) updateData.billing_currency = data.billing_currency;

      // Handle supply items update
      if (data.supplies) {
        // Delete old supply items and create new ones
        updateData.supply_items = {
          deleteMany: {},
          create: data.supplies.map(item => ({
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

      const usage = await this.prisma.medicalSupplyUsage.update({
        where: { id },
        data: updateData,
        include: {
          supply_items: true,
        },
      });

      // Create success log
      await this.createLog(usage.id, {
        type: 'UPDATE',
        status: 'SUCCESS',
        patient_hn: usage.patient_hn,
        user_id: data.recorded_by_user_id,
        updated_fields: Object.keys(updateData),
        old_values: oldUsage,
        new_values: usage,
      });

      return usage as unknown as MedicalSupplyUsageResponse;
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'UPDATE',
        status: 'ERROR',
        usage_id: id,
        user_id: data.recorded_by_user_id,
        error_message: error.message,
        error_code: error.code,
        input_data: data,
      });

      if (error.code === 'P2025') {
        throw new NotFoundException(`Medical Supply Usage with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Delete
  async remove(id: number): Promise<{ success: boolean; message: string }> {
    try {
      // Get usage before deleting for logging
      const usage = await this.prisma.medicalSupplyUsage.findUnique({
        where: { id },
      });

      if (!usage) {
        // Log not found
        await this.createLog(null, {
          type: 'DELETE',
          status: 'NOT_FOUND',
          usage_id: id,
        });
        throw new NotFoundException(`Medical Supply Usage with ID ${id} not found`);
      }

      // Delete record
      await this.prisma.medicalSupplyUsage.delete({
        where: { id },
      });

      // Create success log after deletion
      await this.createLog(null, {
        type: 'DELETE',
        status: 'SUCCESS',
        usage_id: id,
        patient_hn: usage.patient_hn,
        user_id: usage.recorded_by_user_id,
        deleted_data: usage,
      });

      return {
        success: true,
        message: 'Medical Supply Usage deleted successfully',
      };
    } catch (error) {
      // Create error log
      await this.createLog(null, {
        type: 'DELETE',
        status: 'ERROR',
        usage_id: id,
        error_message: error.message,
        error_code: error.code,
      });

      if (error.code === 'P2025') {
        throw new NotFoundException(`Medical Supply Usage with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Update Billing Status
  async updateBillingStatus(
    id: number,
    status: string,
  ): Promise<MedicalSupplyUsageResponse> {
    return await this.update(id, { billing_status: status });
  }

  // Get by Department
  async findByDepartment(department_code: string): Promise<MedicalSupplyUsageResponse[]> {
    try {
      const usages = await this.prisma.medicalSupplyUsage.findMany({
        where: { department_code },
        orderBy: { created_at: 'desc' },
        include: {
          supply_items: true,
        },
      });

      // Log success
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'findByDepartment',
        department_code: department_code,
        results_count: usages.length,
      });

      return usages as unknown as MedicalSupplyUsageResponse[];
    } catch (error) {
      // Log error
      await this.createLog(null, {
        type: 'QUERY',
        status: 'ERROR',
        action: 'findByDepartment',
        department_code: department_code,
        error_message: error.message,
        error_code: error.code,
      });
      throw error;
    }
  }

  // Get Statistics
  async getStatistics(): Promise<any> {
    try {
      const [total, byStatus, byDepartment] = await Promise.all([
        this.prisma.medicalSupplyUsage.count(),
        this.prisma.medicalSupplyUsage.groupBy({
          by: ['billing_status'],
          _count: true,
        }),
        this.prisma.medicalSupplyUsage.groupBy({
          by: ['department_code'],
          _count: true,
        }),
      ]);

      // Log success
      await this.createLog(null, {
        type: 'QUERY',
        status: 'SUCCESS',
        action: 'getStatistics',
        total_records: total,
      });

      return {
        total,
        by_status: byStatus,
        by_department: byDepartment,
      };
    } catch (error) {
      // Log error
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
}
