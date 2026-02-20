import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReportServiceService } from './report-service.service';

@Controller()
export class ReportServiceController {
  constructor(private readonly reportServiceService: ReportServiceService) {}

  @MessagePattern({ cmd: 'report.comparison.excel' })
  async generateComparisonExcel(@Payload() data: { usageId: number }) {
    try {
      const result = await this.reportServiceService.generateComparisonExcel(data.usageId);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.comparison.pdf' })
  async generateComparisonPDF(@Payload() data: { usageId: number }) {
    try {
      const result = await this.reportServiceService.generateComparisonPDF(data.usageId);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/pdf',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.equipment_usage.excel' })
  async generateEquipmentUsageExcel(@Payload() data: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
    usageIds?: number[];
  }) {
    try {
      const result = await this.reportServiceService.generateEquipmentUsageExcel(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.equipment_usage.pdf' })
  async generateEquipmentUsagePDF(@Payload() data: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
    usageIds?: number[];
  }) {
    try {
      const result = await this.reportServiceService.generateEquipmentUsagePDF(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/pdf',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.equipment_disbursement.excel' })
  async generateEquipmentDisbursementExcel(@Payload() data: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
  }) {
    try {
      const result = await this.reportServiceService.generateEquipmentDisbursementExcel(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      console.error('[Report Service Controller] Error generating equipment disbursement Excel:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.equipment_disbursement.pdf' })
  async generateEquipmentDisbursementPDF(@Payload() data: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
  }) {
    try {
      const result = await this.reportServiceService.generateEquipmentDisbursementPDF(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/pdf',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.dispensed_items.excel' })
  async generateDispensedItemsExcel(@Payload() data: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }) {
    try {
      const result = await this.reportServiceService.generateDispensedItemsExcel(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      console.error('[Report Service Controller] Error generating dispensed items Excel:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.dispensed_items.pdf' })
  async generateDispensedItemsPDF(@Payload() data: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }) {
    try {
      const result = await this.reportServiceService.generateDispensedItemsPDF(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/pdf',
        },
      };
    } catch (error) {
      console.error('[Report Service Controller] Error generating dispensed items PDF:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.item_comparison.excel' })
  async generateItemComparisonExcel(@Payload() data: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    includeUsageDetails?: boolean;
  }) {
    try {
      const result = await this.reportServiceService.generateItemComparisonExcel(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      console.error('[Report Service Controller] Error generating item comparison Excel:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.item_comparison.pdf' })
  async generateItemComparisonPDF(@Payload() data: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    includeUsageDetails?: boolean;
  }) {
    try {
      const result = await this.reportServiceService.generateItemComparisonPDF(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/pdf',
        },
      };
    } catch (error) {
      console.error('[Report Service Controller] Error generating item comparison PDF:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Report 1: Vending Mapping Report
  @MessagePattern({ cmd: 'report.vending_mapping.excel' })
  async generateVendingMappingExcel(@Payload() data: {
    startDate?: string;
    endDate?: string;
    printDate?: string;
  }) {
    try {
      const result = await this.reportServiceService.generateVendingMappingExcel(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.vending_mapping.pdf' })
  async generateVendingMappingPDF(@Payload() data: {
    startDate?: string;
    endDate?: string;
    printDate?: string;
  }) {
    try {
      const result = await this.reportServiceService.generateVendingMappingPDF(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/pdf',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Report 2: Unmapped Dispensed Report
  @MessagePattern({ cmd: 'report.unmapped_dispensed.excel' })
  async generateUnmappedDispensedExcel(@Payload() data: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'month';
  }) {
    try {
      const result = await this.reportServiceService.generateUnmappedDispensedExcel(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Report 3: Unused Dispensed Report
  @MessagePattern({ cmd: 'report.unused_dispensed.excel' })
  async generateUnusedDispensedExcel(@Payload() data: {
    date?: string;
  }) {
    try {
      const result = await this.reportServiceService.generateUnusedDispensedExcel(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get Vending Mapping Report Data (JSON)
  @MessagePattern({ cmd: 'report.vending_mapping.data' })
  async getVendingMappingData(@Payload() data: {
    startDate?: string;
    endDate?: string;
    printDate?: string;
  }) {
    try {
      const result = await this.reportServiceService.getVendingMappingData(data);
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

  // Get Unmapped Dispensed Report Data (JSON)
  @MessagePattern({ cmd: 'report.unmapped_dispensed.data' })
  async getUnmappedDispensedData(@Payload() data: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'month';
  }) {
    try {
      const result = await this.reportServiceService.getUnmappedDispensedData(data);
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

  // Get Unused Dispensed Report Data (JSON)
  @MessagePattern({ cmd: 'report.unused_dispensed.data' })
  async getUnusedDispensedData(@Payload() data: {
    date?: string;
  }) {
    try {
      const result = await this.reportServiceService.getUnusedDispensedData(data);
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

  // Get Cancel Bill Report Data (JSON)
  @MessagePattern({ cmd: 'report.cancel_bill.data' })
  async getCancelBillReportData(@Payload() data: {
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const result = await this.reportServiceService.getCancelBillReportData(data);
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

  // Generate Return Report Excel
  @MessagePattern({ cmd: 'report.return.excel' })
  async generateReturnReportExcel(@Payload() data: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
  }) {
    try {
      const buffer = await this.reportServiceService.generateReturnReportExcel(data);
      return {
        success: true,
        buffer: buffer.toString('base64'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `return_report_${new Date().toISOString().split('T')[0]}.xlsx`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate Return Report PDF
  @MessagePattern({ cmd: 'report.return.pdf' })
  async generateReturnReportPdf(@Payload() data: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
  }) {
    try {
      const buffer = await this.reportServiceService.generateReturnReportPdf(data);
      return {
        success: true,
        buffer: buffer.toString('base64'),
        contentType: 'application/pdf',
        filename: `return_report_${new Date().toISOString().split('T')[0]}.pdf`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate Cancel Bill Report Excel
  @MessagePattern({ cmd: 'report.cancel_bill.excel' })
  async generateCancelBillReportExcel(@Payload() data: {
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const buffer = await this.reportServiceService.generateCancelBillReportExcel(data);
      return {
        success: true,
        buffer: buffer.toString('base64'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `cancel_bill_report_${new Date().toISOString().split('T')[0]}.xlsx`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate Cancel Bill Report PDF
  @MessagePattern({ cmd: 'report.cancel_bill.pdf' })
  async generateCancelBillReportPdf(@Payload() data: {
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const buffer = await this.reportServiceService.generateCancelBillReportPdf(data);
      return {
        success: true,
        buffer: buffer.toString('base64'),
        contentType: 'application/pdf',
        filename: `cancel_bill_report_${new Date().toISOString().split('T')[0]}.pdf`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate Return To Cabinet Report Excel
  @MessagePattern({ cmd: 'report.return_to_cabinet.excel' })
  async generateReturnToCabinetReportExcel(@Payload() data: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }) {
    try {
      const buffer = await this.reportServiceService.generateReturnToCabinetReportExcel(data);
      return {
        success: true,
        buffer: buffer.toString('base64'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `return_to_cabinet_report_${new Date().toISOString().split('T')[0]}.xlsx`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate Return To Cabinet Report PDF
  @MessagePattern({ cmd: 'report.return_to_cabinet.pdf' })
  async generateReturnToCabinetReportPdf(@Payload() data: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }) {
    try {
      const buffer = await this.reportServiceService.generateReturnToCabinetReportPdf(data);
      return {
        success: true,
        buffer: buffer.toString('base64'),
        contentType: 'application/pdf',
        filename: `return_to_cabinet_report_${new Date().toISOString().split('T')[0]}.pdf`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Cabinet Stock Report (สต๊อกอุปกรณ์ในตู้)
  @MessagePattern({ cmd: 'report.cabinet_stock.excel' })
  async generateCabinetStockExcel(@Payload() data: { cabinetId?: number; cabinetCode?: string; departmentId?: number }) {
    try {
      const result = await this.reportServiceService.generateCabinetStockExcel(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.cabinet_stock.pdf' })
  async generateCabinetStockPdf(@Payload() data: { cabinetId?: number; cabinetCode?: string; departmentId?: number }) {
    try {
      const result = await this.reportServiceService.generateCabinetStockPdf(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/pdf',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.cabinet_stock.data' })
  async getCabinetStockData(@Payload() data: { cabinetId?: number; cabinetCode?: string; departmentId?: number }) {
    try {
      const result = await this.reportServiceService.getCabinetStockData(data);
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

  // Dispensed Items for Patients Report (รายการเบิกอุปกรณ์ใช้กับคนไข้)
  @MessagePattern({ cmd: 'report.dispensed_items_for_patients.excel' })
  async generateDispensedItemsForPatientsExcel(@Payload() data: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
    usageType?: string;
  }) {
    try {
      const result = await this.reportServiceService.generateDispensedItemsForPatientsExcel(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.dispensed_items_for_patients.pdf' })
  async generateDispensedItemsForPatientsPdf(@Payload() data: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
    usageType?: string;
  }) {
    try {
      const result = await this.reportServiceService.generateDispensedItemsForPatientsPdf(data);
      return {
        success: true,
        data: {
          buffer: result.buffer,
          filename: result.filename,
          contentType: 'application/pdf',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'report.dispensed_items_for_patients.data' })
  async getDispensedItemsForPatientsData(@Payload() data: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
    usageType?: string;
  }) {
    try {
      const result = await this.reportServiceService.getDispensedItemsForPatientsData(data);
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
}
