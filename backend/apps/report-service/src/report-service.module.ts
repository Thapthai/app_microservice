import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ReportServiceController } from './report-service.controller';
import { ReportServiceService } from './report-service.service';
import { ComparisonReportExcelService } from './services/comparison_report_excel.service';
import { ComparisonReportPdfService } from './services/comparison_report_pdf.service';
import { EquipmentUsageExcelService } from './services/equipment_usage_excel.service';
import { EquipmentUsagePdfService } from './services/equipment_usage_pdf.service';
import { EquipmentDisbursementExcelService } from './services/equipment_disbursement_excel.service';
import { EquipmentDisbursementPdfService } from './services/equipment_disbursement_pdf.service';
import { ItemComparisonExcelService } from './services/item-comparison-excel.service';
import { ItemComparisonPdfService } from './services/item-comparison-pdf.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MEDICAL_SUPPLIES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3008, // แก้จาก 3005 เป็น 3008
        },
      },
    ]),
  ],
  controllers: [ReportServiceController],
  providers: [
    ReportServiceService,
    ComparisonReportExcelService,
    ComparisonReportPdfService,
    EquipmentUsageExcelService,
    EquipmentUsagePdfService,
    EquipmentDisbursementExcelService,
    EquipmentDisbursementPdfService,
    ItemComparisonExcelService,
    ItemComparisonPdfService,
  ],
})
export class ReportServiceModule {}
