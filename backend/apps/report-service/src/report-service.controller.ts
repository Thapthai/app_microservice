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
    console.log('[Report Service Controller] Received equipment_disbursement.excel request:', JSON.stringify(data));
    try {
      const result = await this.reportServiceService.generateEquipmentDisbursementExcel(data);
      console.log('[Report Service Controller] Equipment disbursement Excel generated successfully');
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
}
