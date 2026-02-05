import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { VendingMappingReportExcelService } from './services/vending-mapping-report-excel.service';
import { VendingMappingReportPdfService } from './services/vending-mapping-report-pdf.service';
import { UnmappedDispensedReportExcelService } from './services/unmapped-dispensed-report-excel.service';
import { UnusedDispensedReportExcelService } from './services/unused-dispensed-report-excel.service';
import { ReturnReportExcelService } from './services/return-report-excel.service';
import { ReturnReportPdfService } from './services/return-report-pdf.service';
import { CancelBillReportExcelService } from './services/cancel-bill-report-excel.service';
import { CancelBillReportPdfService } from './services/cancel-bill-report-pdf.service';
import { ReturnToCabinetReportExcelService } from './services/return-to-cabinet-report-excel.service';
import { ReturnToCabinetReportPdfService } from './services/return-to-cabinet-report-pdf.service';
import { DispensedItemsExcelService } from './services/dispensed-items-excel.service';
import { DispensedItemsPdfService } from './services/dispensed-items-pdf.service';
import { CabinetStockReportExcelService } from './services/cabinet-stock-report-excel.service';
import { CabinetStockReportPdfService } from './services/cabinet-stock-report-pdf.service';
import { DispensedItemsForPatientsExcelService } from './services/dispensed-items-for-patients-excel.service';
import { DispensedItemsForPatientsPdfService } from './services/dispensed-items-for-patients-pdf.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ClientsModule.registerAsync([
      {
        name: 'MEDICAL_SUPPLIES_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('MEDICAL_SUPPLIES_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('MEDICAL_SUPPLIES_SERVICE_PORT', 3008),
          },
        }),
        inject: [ConfigService],
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
    VendingMappingReportExcelService,
    VendingMappingReportPdfService,
    UnmappedDispensedReportExcelService,
    UnusedDispensedReportExcelService,
    ReturnReportExcelService,
    ReturnReportPdfService,
    CancelBillReportExcelService,
    CancelBillReportPdfService,
    ReturnToCabinetReportExcelService,
    ReturnToCabinetReportPdfService,
    DispensedItemsExcelService,
    DispensedItemsPdfService,
    CabinetStockReportExcelService,
    CabinetStockReportPdfService,
    DispensedItemsForPatientsExcelService,
    DispensedItemsForPatientsPdfService,
  ],
})
export class ReportServiceModule {}
