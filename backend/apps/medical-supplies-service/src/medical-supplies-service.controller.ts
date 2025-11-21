import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MedicalSuppliesServiceService } from './medical-supplies-service.service';
import {
  CreateMedicalSupplyUsageDto,
  UpdateMedicalSupplyUsageDto,
  GetMedicalSupplyUsagesQueryDto,
} from './dto';

@Controller()
export class MedicalSuppliesServiceController {
  constructor(private readonly medicalSuppliesService: MedicalSuppliesServiceService) {}

  @MessagePattern({ cmd: 'medical_supply_usage.create' })
  async create(@Payload() data: CreateMedicalSupplyUsageDto) {
    try {
      const usage = await this.medicalSuppliesService.create(data);
      return { success: true, data: usage };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_usage.findAll' })
  async findAll(@Payload() query: GetMedicalSupplyUsagesQueryDto) {
    try {
      const result = await this.medicalSuppliesService.findAll(query);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_usage.findOne' })
  async findOne(@Payload() data: { id: number }) {
    try {
      const usage = await this.medicalSuppliesService.findOne(data.id);
      return { success: true, data: usage };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_usage.findByPatientHN' })
  async findByPatientHN(@Payload() data: { patient_hn: string }) {
    try {
      const usages = await this.medicalSuppliesService.findByHN(data.patient_hn);
      return { success: true, data: usages };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_usage.update' })
  async update(@Payload() data: { id: number; updateData: UpdateMedicalSupplyUsageDto }) {
    try {
      const usage = await this.medicalSuppliesService.update(data.id, data.updateData);
      return { success: true, data: usage };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_usage.updatePrintInfo' })
  async updatePrintInfo(@Payload() data: { id: number; printData: any }) {
    try {
      const usage = await this.medicalSuppliesService.updatePrintInfo(data.id, data.printData);
      return { success: true, data: usage };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_usage.remove' })
  async remove(@Payload() data: { id: number }) {
    try {
      const result = await this.medicalSuppliesService.remove(data.id);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_usage.updateBillingStatus' })
  async updateBillingStatus(@Payload() data: { id: number; status: string }) {
    try {
      const usage = await this.medicalSuppliesService.updateBillingStatus(data.id, data.status);
      return { success: true, data: usage };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_usage.findByDepartment' })
  async findByDepartment(@Payload() data: { department_code: string }) {
    try {
      const usages = await this.medicalSuppliesService.findByDepartment(data.department_code);
      return { success: true, data: usages };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_usage.statistics' })
  async getStatistics() {
    try {
      const stats = await this.medicalSuppliesService.getStatistics();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
