import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MedicalSuppliesServiceService } from './medical-supplies-service.service';
import {
  CreateMedicalSupplyUsageDto,
  UpdateMedicalSupplyUsageDto,
  GetMedicalSupplyUsagesQueryDto,
  GetMedicalSupplyUsageLogsQueryDto,
  RecordItemUsedWithPatientDto,
  RecordItemReturnDto,
  RecordStockReturnDto,
  GetPendingItemsQueryDto,
  GetReturnHistoryQueryDto,
} from './dto';

@Controller()
export class MedicalSuppliesServiceController {
  constructor(private readonly medicalSuppliesService: MedicalSuppliesServiceService) { }

  @MessagePattern({ cmd: 'medical_supply_usage.create' })
  async create(@Payload() payload: any) {
    try {
      const { _userContext, ...data } = payload;
      const usage = await this.medicalSuppliesService.create(data, _userContext);
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

  @MessagePattern({ cmd: 'medical_supply_usage_logs.findAll' })
  async findAllLogs(@Payload() query: GetMedicalSupplyUsageLogsQueryDto) {
    try {
      const result = await this.medicalSuppliesService.findAllLogs(query);
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

  // ===============================================
  // Quantity Management & Return System Endpoints
  // ===============================================

  @MessagePattern({ cmd: 'medical_supply_item.recordUsedWithPatient' })
  async recordItemUsedWithPatient(@Payload() data: RecordItemUsedWithPatientDto) {
    try {
      const result = await this.medicalSuppliesService.recordItemUsedWithPatient(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.recordReturn' })
  async recordItemReturn(@Payload() data: RecordItemReturnDto) {
    try {
      const result = await this.medicalSuppliesService.recordItemReturn(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.getPendingItems' })
  async getPendingItems(@Payload() query: GetPendingItemsQueryDto) {
    try {
      const result = await this.medicalSuppliesService.getPendingItems(query);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.getReturnHistory' })
  async getReturnHistory(@Payload() query: GetReturnHistoryQueryDto) {
    try {
      const result = await this.medicalSuppliesService.getReturnHistory(query);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.getQuantityStatistics' })
  async getQuantityStatistics(@Payload() data: { department_code?: string }) {
    try {
      const result = await this.medicalSuppliesService.getQuantityStatistics(data.department_code);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.getById' })
  async getSupplyItemById(@Payload() data: { item_id: number }) {
    try {
      const result = await this.medicalSuppliesService.getSupplyItemById(data.item_id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.getByUsageId' })
  async getSupplyItemsByUsageId(@Payload() data: { usage_id: number }) {
    try {
      const result = await this.medicalSuppliesService.getSupplyItemsByUsageId(data.usage_id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Validate ItemCode
  @MessagePattern({ cmd: 'medical_supply.validateItemCode' })
  async validateItemCode(@Payload() data: { itemCode: string }) {
    try {
      const result = await this.medicalSuppliesService.validateItemCode(data.itemCode);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Validate multiple ItemCodes
  @MessagePattern({ cmd: 'medical_supply.validateItemCodes' })
  async validateItemCodes(@Payload() data: { itemCodes: string[] }) {
    try {
      const result = await this.medicalSuppliesService.validateItemCodes(data.itemCodes);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'medical_supply.getDispensedItems' })
  async getDispensedItems(@Payload() data: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }) {
    try {
      const result = await this.medicalSuppliesService.getDispensedItems(data);
      return {
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        filters: result.filters,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'medical_supply.getDispensedVsUsageSummary' })
  async getDispensedVsUsageSummary(@Payload() data: { startDate?: string; endDate?: string }) {
    return this.medicalSuppliesService.getDispensedVsUsageSummary(data);
  }

  @MessagePattern({ cmd: 'medical_supply.compareDispensedVsUsage' })
  async compareDispensedVsUsage(@Payload() data: {
    itemCode?: string;
    itemTypeId?: number;
    keyword?: string;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const result = await this.medicalSuppliesService.compareDispensedVsUsage(data);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  

  @MessagePattern({ cmd: 'medical_supply.getUsageByItemCode' })
  async getUsageByItemCode(@Payload() data?: any) {
    return this.medicalSuppliesService.getUsageByItemCode(data);
  }

  @MessagePattern({ cmd: 'medical_supply.getUsageByOrderItemCode' })
  async getUsageByOrderItemCode(@Payload() data?: any) {
    return this.medicalSuppliesService.getUsageByOrderItemCode(data);
  }

  @MessagePattern({ cmd: 'medical_supply.getUsageByItemCodeFromItemTable' })
  async getUsageByItemCodeFromItemTable(@Payload() data?: any) {
    return this.medicalSuppliesService.getUsageByItemCodeFromItemTable(data);
  }

  @MessagePattern({ cmd: 'medical_supply.handleCrossDayCancelBill' })
  async handleCrossDayCancelBill(@Payload() data: {
    en: string;
    hn: string;
    oldPrintDate: string;
    newPrintDate: string;
    cancelItems: Array<{
      assession_no: string;
      item_code: string;
      qty: number;
      status?: string;
    }>;
    newItems?: Array<{
      item_code: string;
      item_description: string;
      assession_no: string;
      qty: number;
      uom: string;
      item_status?: string;
    }>;
  }) {
    try {
      const result = await this.medicalSuppliesService.handleCrossDayCancelBill(data);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply.handleCancelBill' })
  async handleCancelBill(data: {
    usageId: number;
    supplyItemIds: number[];
    oldPrintDate: string;
    newPrintDate: string;
    newItems?: Array<{
      item_code: string;
      item_description: string;
      assession_no: string;
      qty: number;
      uom: string;
      item_status?: string;
    }>;
  }) {
    try {
      const result = await this.medicalSuppliesService.handleCancelBill(data);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.getItemStocksForReturnToCabinet' })
  async getItemStocksForReturnToCabinet(@Payload() data: {
    itemCode?: string;
    itemTypeId?: number;
    rfidCode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const result = await this.medicalSuppliesService.getItemStocksForReturnToCabinet(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.recordStockReturns' })
  async recordStockReturns(@Payload() data: RecordStockReturnDto) {
    try {
      const result = await this.medicalSuppliesService.recordStockReturns(data);
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || error,
      };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.returnItemsToCabinet' })
  async returnItemsToCabinet(@Payload() data: { rowIds: number[]; userId: number }) {
    try {
      const result = await this.medicalSuppliesService.returnItemsToCabinet(data.rowIds, data.userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.getItemStocksForDispenseFromCabinet' })
  async getItemStocksForDispenseFromCabinet(@Payload() data: {
    itemCode?: string;
    itemTypeId?: number;
    rfidCode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const result = await this.medicalSuppliesService.getItemStocksForDispenseFromCabinet(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'medical_supply_item.dispenseItemsFromCabinet' })
  async dispenseItemsFromCabinet(@Payload() data: { rowIds: number[]; userId: number }) {
    try {
      const result = await this.medicalSuppliesService.dispenseItemsFromCabinet(data.rowIds, data.userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'medical_supply.getReturnedItems' })
  async getReturnedItems(@Payload() data: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }) {
    try {
      const result = await this.medicalSuppliesService.getReturnedItems(data);
      return {
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        filters: result.filters,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
