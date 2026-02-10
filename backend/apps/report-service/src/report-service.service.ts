import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaClient, Prisma } from '@prisma/client';
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
import { ReturnReportExcelService, ReturnReportData } from './services/return-report-excel.service';
import { ReturnReportPdfService } from './services/return-report-pdf.service';
import { CancelBillReportExcelService, CancelBillReportData } from './services/cancel-bill-report-excel.service';
import { CancelBillReportPdfService } from './services/cancel-bill-report-pdf.service';
import { ReturnToCabinetReportExcelService, ReturnToCabinetReportData } from './services/return-to-cabinet-report-excel.service';
import { ReturnToCabinetReportPdfService } from './services/return-to-cabinet-report-pdf.service';
import { DispensedItemsExcelService, DispensedItemsReportData } from './services/dispensed-items-excel.service';
import { DispensedItemsPdfService } from './services/dispensed-items-pdf.service';
import {
  CabinetStockReportExcelService,
  CabinetStockReportData,
} from './services/cabinet-stock-report-excel.service';
import { CabinetStockReportPdfService } from './services/cabinet-stock-report-pdf.service';
import {
  DispensedItemsForPatientsExcelService,
  DispensedItemsForPatientsReportData,
} from './services/dispensed-items-for-patients-excel.service';
import { DispensedItemsForPatientsPdfService } from './services/dispensed-items-for-patients-pdf.service';
import { ComparisonReportData } from './types/comparison-report.types';
import { EquipmentUsageReportData } from './types/equipment-usage-report.types';
import { EquipmentDisbursementReportData } from './types/equipment-disbursement-report.types';
import { ItemComparisonReportData } from './types/item-comparison-report.types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReportServiceService {
  private prisma: PrismaClient;

  constructor(
    @Inject('MEDICAL_SUPPLIES_SERVICE')
    private readonly medicalSuppliesClient: ClientProxy,
    private readonly comparisonReportExcelService: ComparisonReportExcelService,
    private readonly comparisonReportPdfService: ComparisonReportPdfService,
    private readonly equipmentUsageExcelService: EquipmentUsageExcelService,
    private readonly equipmentUsagePdfService: EquipmentUsagePdfService,
    private readonly equipmentDisbursementExcelService: EquipmentDisbursementExcelService,
    private readonly equipmentDisbursementPdfService: EquipmentDisbursementPdfService,
    private readonly itemComparisonExcelService: ItemComparisonExcelService,
    private readonly itemComparisonPdfService: ItemComparisonPdfService,
    private readonly vendingMappingReportExcelService: VendingMappingReportExcelService,
    private readonly vendingMappingReportPdfService: VendingMappingReportPdfService,
    private readonly unmappedDispensedReportExcelService: UnmappedDispensedReportExcelService,
    private readonly unusedDispensedReportExcelService: UnusedDispensedReportExcelService,
    private readonly returnReportExcelService: ReturnReportExcelService,
    private readonly returnReportPdfService: ReturnReportPdfService,
    private readonly cancelBillReportExcelService: CancelBillReportExcelService,
    private readonly cancelBillReportPdfService: CancelBillReportPdfService,
    private readonly returnToCabinetReportExcelService: ReturnToCabinetReportExcelService,
    private readonly returnToCabinetReportPdfService: ReturnToCabinetReportPdfService,
    private readonly dispensedItemsExcelService: DispensedItemsExcelService,
    private readonly dispensedItemsPdfService: DispensedItemsPdfService,
    private readonly cabinetStockReportExcelService: CabinetStockReportExcelService,
    private readonly cabinetStockReportPdfService: CabinetStockReportPdfService,
    private readonly dispensedItemsForPatientsExcelService: DispensedItemsForPatientsExcelService,
    private readonly dispensedItemsForPatientsPdfService: DispensedItemsForPatientsPdfService,
  ) {
    this.prisma = new PrismaClient();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  /**
   * Generate comparison report in Excel format
   */
  async generateComparisonExcel(usageId: number): Promise<{ buffer: Buffer; filename: string }> {
    try {

      // Fetch usage data from medical-supplies-service
      const usageResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findOne' }, { id: usageId })
      );


      if (!usageResponse || !usageResponse.success) {
        throw new Error(`Usage not found for ID: ${usageId}`);
      }

      if (!usageResponse.data) {
        throw new Error(`Usage data is empty for ID: ${usageId}`);
      }

      // Fetch items data
      const itemsResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usageId })
      );


      if (!itemsResponse || !itemsResponse.success) {
        throw new Error(`Items not found for Usage ID: ${usageId}`);
      }

      if (!itemsResponse.data || itemsResponse.data.length === 0) {
        throw new Error(`No items found for Usage ID: ${usageId}`);
      }

      // Prepare data for export
      const reportData: ComparisonReportData = {
        usage: {
          id: usageResponse.data.id,
          patient_hn: usageResponse.data.patient_hn,
          first_name: usageResponse.data.first_name,
          lastname: usageResponse.data.lastname,
          en: usageResponse.data.en,
          department_code: usageResponse.data.department_code,
          usage_datetime: usageResponse.data.usage_datetime,
        },
        items: itemsResponse.data,
      };

      // Generate Excel
      const buffer = await this.comparisonReportExcelService.generateReport(reportData);
      const filename = `comparison_report_${usageId}_${new Date().toISOString().split('T')[0]}.xlsx`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Excel report: ${errorMessage}`);
    }
  }

  /**
   * Generate comparison report in PDF format
   */
  async generateComparisonPDF(usageId: number): Promise<{ buffer: Buffer; filename: string }> {
    try {
      // Fetch usage data from medical-supplies-service
      const usageResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findOne' }, { id: usageId })
      );

      if (!usageResponse || !usageResponse.success) {
        throw new Error(`Usage not found for ID: ${usageId}`);
      }

      if (!usageResponse.data) {
        throw new Error(`Usage data is empty for ID: ${usageId}`);
      }

      // Fetch items data
      const itemsResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usageId })
      );

      if (!itemsResponse || !itemsResponse.success) {
        throw new Error(`Items not found for Usage ID: ${usageId}`);
      }

      if (!itemsResponse.data || itemsResponse.data.length === 0) {
        throw new Error(`No items found for Usage ID: ${usageId}`);
      }

      // Prepare data for export
      const reportData: ComparisonReportData = {
        usage: {
          id: usageResponse.data.id,
          patient_hn: usageResponse.data.patient_hn,
          first_name: usageResponse.data.first_name,
          lastname: usageResponse.data.lastname,
          en: usageResponse.data.en,
          department_code: usageResponse.data.department_code,
          usage_datetime: usageResponse.data.usage_datetime,
        },
        items: itemsResponse.data,
      };

      // Generate PDF
      const buffer = await this.comparisonReportPdfService.generateReport(reportData);
      const filename = `comparison_report_${usageId}_${new Date().toISOString().split('T')[0]}.pdf`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate PDF report: ${errorMessage}`);
    }
  }

  /**
   * Generate equipment usage report in Excel format
   */
  async generateEquipmentUsageExcel(params: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
    usageIds?: number[];
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      let items: any[] = [];

      // If usageIds provided, fetch those specific usages
      if (params.usageIds && params.usageIds.length > 0) {
        for (const usageId of params.usageIds) {
          const itemsResponse: any = await firstValueFrom(
            this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usageId })
          );

          if (itemsResponse && itemsResponse.success && itemsResponse.data) {
            const usageResponse: any = await firstValueFrom(
              this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findOne' }, { id: usageId })
            );

            if (usageResponse && usageResponse.success && usageResponse.data) {
              itemsResponse.data.forEach((item: any) => {
                items.push({
                  en: usageResponse.data.en,
                  hn: usageResponse.data.patient_hn,
                  code: item.order_item_code || item.supply_code || '-',
                  description: item.order_item_description || item.supply_name || '-',
                  assessionNo: item.assession_no || '-',
                  status: item.order_item_status || '-',
                  qty: item.qty || 0,
                  uom: item.uom || '-',
                });
              });
            }
          }
        }
      } else {
        // Fetch by date range or filters
        const queryParams: any = {};
        if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
        if (params.dateTo) queryParams.dateTo = params.dateTo;
        if (params.hospital) queryParams.hospital = params.hospital;
        if (params.department) queryParams.department = params.department;

        const usagesResponse: any = await firstValueFrom(
          this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findMany' }, queryParams)
        );

        if (usagesResponse && usagesResponse.success && usagesResponse.data) {
          for (const usage of usagesResponse.data) {
            const itemsResponse: any = await firstValueFrom(
              this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usage.id })
            );

            if (itemsResponse && itemsResponse.success && itemsResponse.data) {
              itemsResponse.data.forEach((item: any) => {
                items.push({
                  en: usage.en,
                  hn: usage.patient_hn,
                  code: item.order_item_code || item.supply_code || '-',
                  description: item.order_item_description || item.supply_name || '-',
                  assessionNo: item.assession_no || '-',
                  status: item.order_item_status || '-',
                  qty: item.qty || 0,
                  uom: item.uom || '-',
                });
              });
            }
          }
        }
      }

      if (items.length === 0) {
        throw new Error('No items found for the specified criteria');
      }

      // Prepare report data
      const reportData: EquipmentUsageReportData = {
        hospital: params.hospital,
        department: params.department,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        items: items,
      };

      // Generate Excel
      const buffer = await this.equipmentUsageExcelService.generateReport(reportData);
      const dateStr = params.dateFrom ? params.dateFrom.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const filename = `equipment_usage_report_${dateStr}.xlsx`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Equipment Usage Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Equipment Usage Excel report: ${errorMessage}`);
    }
  }

  /**
   * Generate equipment usage report in PDF format
   */
  async generateEquipmentUsagePDF(params: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
    usageIds?: number[];
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      let items: any[] = [];

      // If usageIds provided, fetch those specific usages
      if (params.usageIds && params.usageIds.length > 0) {
        for (const usageId of params.usageIds) {
          const itemsResponse: any = await firstValueFrom(
            this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usageId })
          );

          if (itemsResponse && itemsResponse.success && itemsResponse.data) {
            const usageResponse: any = await firstValueFrom(
              this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findOne' }, { id: usageId })
            );

            if (usageResponse && usageResponse.success && usageResponse.data) {
              itemsResponse.data.forEach((item: any) => {
                items.push({
                  en: usageResponse.data.en,
                  hn: usageResponse.data.patient_hn,
                  code: item.order_item_code || item.supply_code || '-',
                  description: item.order_item_description || item.supply_name || '-',
                  assessionNo: item.assession_no || '-',
                  status: item.order_item_status || '-',
                  qty: item.qty || 0,
                  uom: item.uom || '-',
                });
              });
            }
          }
        }
      } else {
        // Fetch by date range or filters
        const queryParams: any = {};
        if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
        if (params.dateTo) queryParams.dateTo = params.dateTo;
        if (params.hospital) queryParams.hospital = params.hospital;
        if (params.department) queryParams.department = params.department;

        const usagesResponse: any = await firstValueFrom(
          this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findMany' }, queryParams)
        );

        if (usagesResponse && usagesResponse.success && usagesResponse.data) {
          for (const usage of usagesResponse.data) {
            const itemsResponse: any = await firstValueFrom(
              this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usage.id })
            );

            if (itemsResponse && itemsResponse.success && itemsResponse.data) {
              itemsResponse.data.forEach((item: any) => {
                items.push({
                  en: usage.en,
                  hn: usage.patient_hn,
                  code: item.order_item_code || item.supply_code || '-',
                  description: item.order_item_description || item.supply_name || '-',
                  assessionNo: item.assession_no || '-',
                  status: item.order_item_status || '-',
                  qty: item.qty || 0,
                  uom: item.uom || '-',
                });
              });
            }
          }
        }
      }

      if (items.length === 0) {
        throw new Error('No items found for the specified criteria');
      }

      // Prepare report data
      const reportData: EquipmentUsageReportData = {
        hospital: params.hospital,
        department: params.department,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        items: items,
      };

      // Generate PDF
      const buffer = await this.equipmentUsagePdfService.generateReport(reportData);
      const dateStr = params.dateFrom ? params.dateFrom.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const filename = `equipment_usage_report_${dateStr}.pdf`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Equipment Usage PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Equipment Usage PDF report: ${errorMessage}`);
    }
  }

  /**
   * Generate equipment disbursement report in Excel format
   */
  async generateEquipmentDisbursementExcel(params: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const queryParams: any = {};
      if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
      if (params.dateTo) queryParams.dateTo = params.dateTo;
      if (params.hospital) queryParams.hospital = params.hospital;
      if (params.department) queryParams.department = params.department;

      const usagesResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findAll' }, queryParams)
      );

      if (!usagesResponse || !usagesResponse.success || !usagesResponse.data) {
        throw new Error('Failed to fetch usage data');
      }

      const records: any[] = [];
      const summaryMap = new Map<string, { code: string; description: string; totalQty: number }>();

      for (const usage of usagesResponse.data) {
        const itemsResponse: any = await firstValueFrom(
          this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usage.id })
        );

        if (itemsResponse && itemsResponse.success && itemsResponse.data) {
          itemsResponse.data.forEach((item: any) => {
            const code = item.order_item_code || item.supply_code || '-';
            const description = item.order_item_description || item.supply_name || '-';
            const qty = item.qty || 0;

            // Parse usage_datetime
            let date = '';
            let time = '';
            if (usage.usage_datetime) {
              try {
                const dateTime = new Date(usage.usage_datetime);
                date = dateTime.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
                time = dateTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              } catch (e) {
                // If parsing fails, try to split string format
                const parts = usage.usage_datetime.split(' ');
                if (parts.length >= 2) {
                  date = parts[0];
                  time = parts[1];
                } else {
                  date = usage.usage_datetime;
                  time = '';
                }
              }
            }

            records.push({
              code,
              description,
              date,
              time,
              recordedBy: usage.recorded_by_user_id || '-',
              qty,
            });

            // Update summary
            const key = code;
            if (summaryMap.has(key)) {
              const existing = summaryMap.get(key)!;
              existing.totalQty += qty;
            } else {
              summaryMap.set(key, {
                code,
                description,
                totalQty: qty,
              });
            }
          });
        }
      }

      if (records.length === 0) {
        throw new Error('No records found for the specified criteria');
      }

      const reportData: EquipmentDisbursementReportData = {
        hospital: params.hospital,
        department: params.department,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        records,
        summary: Array.from(summaryMap.values()),
      };

      const buffer = await this.equipmentDisbursementExcelService.generateReport(reportData);
      const dateStr = params.dateFrom ? params.dateFrom.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const filename = `equipment_disbursement_report_${dateStr}.xlsx`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Equipment Disbursement Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Equipment Disbursement Excel report: ${errorMessage}`);
    }
  }

  /**
   * Generate equipment disbursement report in PDF format
   */
  async generateEquipmentDisbursementPDF(params: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const queryParams: any = {};
      if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
      if (params.dateTo) queryParams.dateTo = params.dateTo;
      if (params.hospital) queryParams.hospital = params.hospital;
      if (params.department) queryParams.department = params.department;

      const usagesResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply_usage.findAll' }, queryParams)
      );

      if (!usagesResponse || !usagesResponse.success || !usagesResponse.data) {
        throw new Error('Failed to fetch usage data');
      }

      const records: any[] = [];
      const summaryMap = new Map<string, { code: string; description: string; totalQty: number }>();

      for (const usage of usagesResponse.data) {
        const itemsResponse: any = await firstValueFrom(
          this.medicalSuppliesClient.send({ cmd: 'medical_supply_item.getByUsageId' }, { usage_id: usage.id })
        );

        if (itemsResponse && itemsResponse.success && itemsResponse.data) {
          itemsResponse.data.forEach((item: any) => {
            const code = item.order_item_code || item.supply_code || '-';
            const description = item.order_item_description || item.supply_name || '-';
            const qty = item.qty || 0;

            // Parse usage_datetime
            let date = '';
            let time = '';
            if (usage.usage_datetime) {
              try {
                const dateTime = new Date(usage.usage_datetime);
                date = dateTime.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
                time = dateTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              } catch (e) {
                const parts = usage.usage_datetime.split(' ');
                if (parts.length >= 2) {
                  date = parts[0];
                  time = parts[1];
                } else {
                  date = usage.usage_datetime;
                  time = '';
                }
              }
            }

            records.push({
              code,
              description,
              date,
              time,
              recordedBy: usage.recorded_by_user_id || '-',
              qty,
            });

            // Update summary
            const key = code;
            if (summaryMap.has(key)) {
              const existing = summaryMap.get(key)!;
              existing.totalQty += qty;
            } else {
              summaryMap.set(key, {
                code,
                description,
                totalQty: qty,
              });
            }
          });
        }
      }

      if (records.length === 0) {
        throw new Error('No records found for the specified criteria');
      }

      const reportData: EquipmentDisbursementReportData = {
        hospital: params.hospital,
        department: params.department,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        records,
        summary: Array.from(summaryMap.values()),
      };

      const buffer = await this.equipmentDisbursementPdfService.generateReport(reportData);
      const dateStr = params.dateFrom ? params.dateFrom.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const filename = `equipment_disbursement_report_${dateStr}.pdf`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Equipment Disbursement PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Equipment Disbursement PDF report: ${errorMessage}`);
    }
  }

  /**
   * Generate item comparison report in Excel format
   */
  async generateItemComparisonExcel(params: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    includeUsageDetails?: boolean;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const queryParams: any = {};
      // Use keyword instead of itemCode to match frontend API call
      if (params.itemCode) queryParams.keyword = params.itemCode;
      if (params.itemTypeId) queryParams.itemTypeId = params.itemTypeId;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.departmentCode) queryParams.departmentCode = params.departmentCode;

      // Fetch comparison data from medical-supplies-service
      const comparisonResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply.compareDispensedVsUsage' }, queryParams)
      );

      if (!comparisonResponse || !comparisonResponse.success || !comparisonResponse.data) {
        throw new Error('Failed to fetch comparison data');
      }

      // Response structure from controller: { success: true, data: { data: [...], pagination: {...}, filters: {...} } }
      // Service returns: { data: result, pagination: {...}, filters: {...} }
      // So we need to access comparisonResponse.data.data to get the array
      let comparisonData: any[] = [];

      if (comparisonResponse.data && comparisonResponse.data.data) {
        // Standard structure: { success: true, data: { data: [...], pagination: {...}, filters: {...} } }
        comparisonData = Array.isArray(comparisonResponse.data.data)
          ? comparisonResponse.data.data
          : [];
      } else if (Array.isArray(comparisonResponse.data)) {
        // Fallback: direct array
        comparisonData = comparisonResponse.data;
      } else if (Array.isArray(comparisonResponse)) {
        // Fallback: response is array directly
        comparisonData = comparisonResponse;
      }

      if (!Array.isArray(comparisonData)) {
        console.error('Invalid comparison data structure:', JSON.stringify(comparisonResponse, null, 2));
        comparisonData = [];
      }

      const reportData: ItemComparisonReportData = {
        filters: {
          itemCode: params.itemCode,
          itemTypeId: params.itemTypeId,
          startDate: params.startDate,
          endDate: params.endDate,
          departmentCode: params.departmentCode,
        },
        summary: comparisonResponse.summary || {
          total_items: 0,
          total_dispensed: 0,
          total_used: 0,
          matched_count: 0,
          discrepancy_count: 0,
        },
        comparison: comparisonData.map((item: any) => ({
          ...item,
          usageItems: [],
        })),
      };

      // Fetch usage details for each item to include in excel
      const comparisonWithUsage = await Promise.all(
        comparisonData.map(async (item: any) => {
          try {
            const usageResponse: any = await firstValueFrom(
              this.medicalSuppliesClient.send({ cmd: 'medical_supply.getUsageByItemCodeFromItemTable' }, {
                itemCode: item.itemcode,
                startDate: params.startDate,
                endDate: params.endDate,
                page: 1,
                limit: 100,
              })
            );

            if (usageResponse && usageResponse.success && usageResponse.data) {
              return {
                ...item,
                usageItems: usageResponse.data,
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch usage details for ${item.itemcode}:`, error);
          }

          return item;
        })
      );

      reportData.comparison = comparisonWithUsage;

      // Generate Excel
      const buffer = await this.itemComparisonExcelService.generateReport(reportData);
      const dateStr = params.startDate ? params.startDate.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const itemCodeStr = params.itemCode ? `_${params.itemCode}` : '';
      const filename = `item_comparison_report${itemCodeStr}_${dateStr}.xlsx`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Item Comparison Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Item Comparison Excel report: ${errorMessage}`);
    }
  }

  /**
   * Generate item comparison report in PDF format
   */
  async generateItemComparisonPDF(params: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    includeUsageDetails?: boolean;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const queryParams: any = {};
      // Use keyword instead of itemCode to match frontend API call
      if (params.itemCode) queryParams.keyword = params.itemCode;
      if (params.itemTypeId) queryParams.itemTypeId = params.itemTypeId;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.departmentCode) queryParams.departmentCode = params.departmentCode;

      // Fetch comparison data from medical-supplies-service
      const comparisonResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply.compareDispensedVsUsage' }, queryParams)
      );

      if (!comparisonResponse || !comparisonResponse.success || !comparisonResponse.data) {
        throw new Error('Failed to fetch comparison data');
      }

      // Response structure from controller: { success: true, data: { data: [...], pagination: {...}, filters: {...} } }
      // Service returns: { data: result, pagination: {...}, filters: {...} }
      // So we need to access comparisonResponse.data.data to get the array
      let comparisonData: any[] = [];

      if (comparisonResponse.data && comparisonResponse.data.data) {
        // Standard structure: { success: true, data: { data: [...], pagination: {...}, filters: {...} } }
        comparisonData = Array.isArray(comparisonResponse.data.data)
          ? comparisonResponse.data.data
          : [];
      } else if (Array.isArray(comparisonResponse.data)) {
        // Fallback: direct array
        comparisonData = comparisonResponse.data;
      } else if (Array.isArray(comparisonResponse)) {
        // Fallback: response is array directly
        comparisonData = comparisonResponse;
      }

      if (!Array.isArray(comparisonData)) {
        console.error('Invalid comparison data structure:', JSON.stringify(comparisonResponse, null, 2));
        comparisonData = [];
      }

      const reportData: ItemComparisonReportData = {
        filters: {
          itemCode: params.itemCode,
          itemTypeId: params.itemTypeId,
          startDate: params.startDate,
          endDate: params.endDate,
          departmentCode: params.departmentCode,
        },
        summary: comparisonResponse.summary || {
          total_items: 0,
          total_dispensed: 0,
          total_used: 0,
          matched_count: 0,
          discrepancy_count: 0,
        },
        comparison: comparisonData.map((item: any) => ({
          ...item,
          usageItems: [],
        })),
      };

      // Fetch usage details for each item to include in PDF
      const comparisonWithUsage = await Promise.all(
        comparisonData.map(async (item: any) => {
          try {
            const usageResponse: any = await firstValueFrom(
              this.medicalSuppliesClient.send({ cmd: 'medical_supply.getUsageByItemCodeFromItemTable' }, {
                itemCode: item.itemcode,
                startDate: params.startDate,
                endDate: params.endDate,
                page: 1,
                limit: 100,
              })
            );

            if (usageResponse && usageResponse.success && usageResponse.data) {
              return {
                ...item,
                usageItems: usageResponse.data,
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch usage details for ${item.itemcode}:`, error);
          }

          return item;
        })
      );

      reportData.comparison = comparisonWithUsage;

      // Generate PDF
      const buffer = await this.itemComparisonPdfService.generateReport(reportData);
      const dateStr = params.startDate ? params.startDate.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const itemCodeStr = params.itemCode ? `_${params.itemCode}` : '';
      const filename = `item_comparison_report${itemCodeStr}_${dateStr}.pdf`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Item Comparison PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Item Comparison PDF report: ${errorMessage}`);
    }
  }

  /**
   * Report 1: Generate Vending Mapping Report (Excel)
   * ดึงข้อมูลจาก database โดยตรงใน report-service
   */
  async generateVendingMappingExcel(params: {
    startDate?: string;
    endDate?: string;
    printDate?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const whereConditions: any = {
        print_date: { not: null },
      };

      if (params?.printDate) {
        whereConditions.print_date = params.printDate;
      } else if (params?.startDate || params?.endDate) {
        whereConditions.print_date = {
          not: null,
        };
        if (params?.startDate) {
          whereConditions.print_date.gte = params.startDate;
        }
        if (params?.endDate) {
          whereConditions.print_date.lte = params.endDate;
        }
      }

      const usageRecords = await this.prisma.medicalSupplyUsage.findMany({
        where: whereConditions,
        include: {
          supply_items: true,
        },
        orderBy: {
          print_date: 'desc',
        },
      });

      const reportByDate = new Map<string, any>();

      for (const usage of usageRecords) {
        const printDate = usage.print_date || usage.update || '';
        if (!printDate) continue;

        if (!reportByDate.has(printDate)) {
          reportByDate.set(printDate, {
            print_date: printDate,
            total_episodes: 0,
            total_patients: new Set<string>(),
            total_items: 0,
            mapped_items: [],
            unmapped_items: [],
          });
        }

        const report = reportByDate.get(printDate);
        report.total_episodes += 1;
        report.total_patients.add(usage.patient_hn);

        for (const item of usage.supply_items) {
          const itemCode = item.order_item_code || item.supply_code;
          if (!itemCode) continue;

          report.total_items += item.qty || 0;

          const dispensedItem = await this.prisma.$queryRaw<any[]>`
            SELECT 
              ist.RowID,
              ist.ItemCode,
              i.itemname,
              ist.LastCabinetModify,
              ist.Qty,
              ist.RfidCode
            FROM itemstock ist
            INNER JOIN item i ON ist.ItemCode = i.itemcode
            WHERE ist.ItemCode = ${itemCode}
              AND ist.StockID = 0
              AND DATE(ist.LastCabinetModify) = DATE(${new Date(printDate)})
            LIMIT 1
          `;

          if (dispensedItem && dispensedItem.length > 0) {
            report.mapped_items.push({
              item_code: itemCode,
              item_name: item.order_item_description || item.supply_name,
              patient_hn: usage.patient_hn,
              patient_name: `${usage.first_name || ''} ${usage.lastname || ''}`.trim(),
              en: usage.en,
              qty: item.qty,
              assession_no: item.assession_no,
              dispensed_date: dispensedItem[0].LastCabinetModify,
              rfid_code: dispensedItem[0].RfidCode,
            });
          } else {
            report.unmapped_items.push({
              item_code: itemCode,
              item_name: item.order_item_description || item.supply_name,
              patient_hn: usage.patient_hn,
              patient_name: `${usage.first_name || ''} ${usage.lastname || ''}`.trim(),
              en: usage.en,
              qty: item.qty,
              assession_no: item.assession_no,
            });
          }
        }
      }

      const result = Array.from(reportByDate.values()).map(report => ({
        ...report,
        total_patients: report.total_patients.size,
      }));

      const reportData = {
        filters: params,
        summary: {
          total_days: result.length,
          total_episodes: result.reduce((sum, r) => sum + r.total_episodes, 0),
          total_patients: result.reduce((sum, r) => sum + r.total_patients, 0),
          total_items: result.reduce((sum, r) => sum + r.total_items, 0),
          total_mapped: result.reduce((sum, r) => sum + r.mapped_items.length, 0),
          total_unmapped: result.reduce((sum, r) => sum + r.unmapped_items.length, 0),
        },
        data: result,
      };

      const buffer = await this.vendingMappingReportExcelService.generateReport(reportData);
      const dateStr = params.printDate || params.startDate || new Date().toISOString().split('T')[0];
      const filename = `vending_mapping_report_${dateStr}.xlsx`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Vending Mapping Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Vending Mapping Excel report: ${errorMessage}`);
    }
  }

  /**
   * Report 1: Generate Vending Mapping Report (PDF)
   * ดึงข้อมูลจาก database โดยตรงใน report-service
   */
  async generateVendingMappingPDF(params: {
    startDate?: string;
    endDate?: string;
    printDate?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const whereConditions: any = {
        print_date: { not: null },
      };

      if (params?.printDate) {
        whereConditions.print_date = params.printDate;
      } else if (params?.startDate || params?.endDate) {
        whereConditions.print_date = {
          not: null,
        };
        if (params?.startDate) {
          whereConditions.print_date.gte = params.startDate;
        }
        if (params?.endDate) {
          whereConditions.print_date.lte = params.endDate;
        }
      }

      const usageRecords = await this.prisma.medicalSupplyUsage.findMany({
        where: whereConditions,
        include: {
          supply_items: true,
        },
        orderBy: {
          print_date: 'desc',
        },
      });

      const reportByDate = new Map<string, any>();

      for (const usage of usageRecords) {
        const printDate = usage.print_date || usage.update || '';
        if (!printDate) continue;

        if (!reportByDate.has(printDate)) {
          reportByDate.set(printDate, {
            print_date: printDate,
            total_episodes: 0,
            total_patients: new Set<string>(),
            total_items: 0,
            mapped_items: [],
            unmapped_items: [],
          });
        }

        const report = reportByDate.get(printDate);
        report.total_episodes += 1;
        report.total_patients.add(usage.patient_hn);

        for (const item of usage.supply_items) {
          const itemCode = item.order_item_code || item.supply_code;
          if (!itemCode) continue;

          report.total_items += item.qty || 0;

          const dispensedItem = await this.prisma.$queryRaw<any[]>`
            SELECT 
              ist.RowID,
              ist.ItemCode,
              i.itemname,
              ist.LastCabinetModify,
              ist.Qty,
              ist.RfidCode
            FROM itemstock ist
            INNER JOIN item i ON ist.ItemCode = i.itemcode
            WHERE ist.ItemCode = ${itemCode}
              AND ist.StockID = 0
              AND DATE(ist.LastCabinetModify) = DATE(${new Date(printDate)})
            LIMIT 1
          `;

          if (dispensedItem && dispensedItem.length > 0) {
            report.mapped_items.push({
              item_code: itemCode,
              item_name: item.order_item_description || item.supply_name,
              patient_hn: usage.patient_hn,
              patient_name: `${usage.first_name || ''} ${usage.lastname || ''}`.trim(),
              en: usage.en,
              qty: item.qty,
              assession_no: item.assession_no,
              dispensed_date: dispensedItem[0].LastCabinetModify,
              rfid_code: dispensedItem[0].RfidCode,
            });
          } else {
            report.unmapped_items.push({
              item_code: itemCode,
              item_name: item.order_item_description || item.supply_name,
              patient_hn: usage.patient_hn,
              patient_name: `${usage.first_name || ''} ${usage.lastname || ''}`.trim(),
              en: usage.en,
              qty: item.qty,
              assession_no: item.assession_no,
            });
          }
        }
      }

      const result = Array.from(reportByDate.values()).map(report => ({
        ...report,
        total_patients: report.total_patients.size,
      }));

      const reportData = {
        filters: params,
        summary: {
          total_days: result.length,
          total_episodes: result.reduce((sum, r) => sum + r.total_episodes, 0),
          total_patients: result.reduce((sum, r) => sum + r.total_patients, 0),
          total_items: result.reduce((sum, r) => sum + r.total_items, 0),
          total_mapped: result.reduce((sum, r) => sum + r.mapped_items.length, 0),
          total_unmapped: result.reduce((sum, r) => sum + r.unmapped_items.length, 0),
        },
        data: result,
      };

      const buffer = await this.vendingMappingReportPdfService.generateReport(reportData);
      const dateStr = params.printDate || params.startDate || new Date().toISOString().split('T')[0];
      const filename = `vending_mapping_report_${dateStr}.pdf`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Vending Mapping PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Vending Mapping PDF report: ${errorMessage}`);
    }
  }

  /**
   * Report 2: Generate Unmapped Dispensed Report (Excel)
   * ดึงข้อมูลจาก database โดยตรงใน report-service
   */
  async generateUnmappedDispensedExcel(params: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'month';
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const groupBy = params.groupBy || 'day';

      let whereClause = Prisma.sql`ist.StockID = 0 AND ist.RfidCode <> ''`;

      if (params?.startDate) {
        whereClause = Prisma.sql`${whereClause} AND DATE(ist.LastCabinetModify) >= DATE(${new Date(params.startDate)})`;
      }
      if (params?.endDate) {
        whereClause = Prisma.sql`${whereClause} AND DATE(ist.LastCabinetModify) <= DATE(${new Date(params.endDate)})`;
      }

      const dateFormat = groupBy === 'day'
        ? Prisma.sql`DATE(ist.LastCabinetModify)`
        : Prisma.sql`DATE_FORMAT(ist.LastCabinetModify, '%Y-%m')`;

      const dispensedItems: any[] = await this.prisma.$queryRaw`
        SELECT
          ist.RowID,
          ist.ItemCode,
          i.itemname,
          ist.LastCabinetModify,
          ist.Qty,
          ist.RfidCode,
          ${dateFormat} as group_date
        FROM itemstock ist
        INNER JOIN item i ON ist.ItemCode = i.itemcode
        WHERE ${whereClause}
        ORDER BY ist.LastCabinetModify DESC
      `;

      const reportByDate = new Map<string, any>();

      for (const dispensed of dispensedItems) {
        const itemCode = dispensed.ItemCode;
        const dispensedDate = dispensed.LastCabinetModify;
        const groupDate = dispensed.group_date;

        const usageRecord = await this.prisma.medicalSupplyUsage.findFirst({
          where: {
            supply_items: {
              some: {
                OR: [
                  { order_item_code: itemCode },
                  { supply_code: itemCode },
                ],
              },
            },
            created_at: {
              gte: new Date(new Date(dispensedDate).setHours(0, 0, 0, 0)),
              lte: new Date(new Date(dispensedDate).setHours(23, 59, 59, 999)),
            },
          },
        });

        if (!usageRecord) {
          if (!reportByDate.has(groupDate)) {
            reportByDate.set(groupDate, {
              date: groupDate,
              items: [],
              total_qty: 0,
            });
          }

          const report = reportByDate.get(groupDate);
          report.items.push({
            item_code: itemCode,
            item_name: dispensed.itemname,
            dispensed_date: dispensedDate,
            qty: Number(dispensed.Qty),
            rfid_code: dispensed.RfidCode,
          });
          report.total_qty += Number(dispensed.Qty);
        }
      }

      const result = Array.from(reportByDate.values());

      const reportData = {
        filters: params,
        summary: {
          total_periods: result.length,
          total_unmapped_items: result.reduce((sum, r) => sum + r.items.length, 0),
          total_unmapped_qty: result.reduce((sum, r) => sum + r.total_qty, 0),
        },
        groupBy,
        data: result,
      };

      const buffer = await this.unmappedDispensedReportExcelService.generateReport(reportData);
      const dateStr = params.startDate || new Date().toISOString().split('T')[0];
      const groupByStr = params.groupBy || 'day';
      const filename = `unmapped_dispensed_report_${groupByStr}_${dateStr}.xlsx`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Unmapped Dispensed Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Unmapped Dispensed Excel report: ${errorMessage}`);
    }
  }

  /**
   * Report 3: Generate Unused Dispensed Report (Excel)
   * ดึงข้อมูลจาก database โดยตรงใน report-service
   */
  async generateUnusedDispensedExcel(params: {
    date?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const targetDate = params?.date
        ? new Date(params.date)
        : new Date();

      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const dispensedItems: any[] = await this.prisma.$queryRaw`
        SELECT
          ist.RowID,
          ist.ItemCode,
          i.itemname,
          ist.LastCabinetModify,
          ist.Qty,
          ist.RfidCode
        FROM itemstock ist
        INNER JOIN item i ON ist.ItemCode = i.itemcode
        WHERE ist.StockID = 0
          AND ist.RfidCode <> ''
          AND DATE(ist.LastCabinetModify) = DATE(${startOfDay})
        ORDER BY ist.LastCabinetModify DESC
      `;

      const unusedItems: any[] = [];

      for (const dispensed of dispensedItems) {
        const itemCode = dispensed.ItemCode;

        const usageRecord = await this.prisma.medicalSupplyUsage.findFirst({
          where: {
            supply_items: {
              some: {
                OR: [
                  { order_item_code: itemCode },
                  { supply_code: itemCode },
                ],
              },
            },
            created_at: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        if (!usageRecord) {
          unusedItems.push({
            item_code: itemCode,
            item_name: dispensed.itemname,
            dispensed_date: dispensed.LastCabinetModify,
            qty: Number(dispensed.Qty),
            rfid_code: dispensed.RfidCode,
            hours_since_dispense: Math.floor(
              (new Date().getTime() - new Date(dispensed.LastCabinetModify).getTime()) / (1000 * 60 * 60)
            ),
          });
        }
      }

      const reportData = {
        summary: {
          date: targetDate.toISOString().split('T')[0],
          total_unused_items: unusedItems.length,
          total_unused_qty: unusedItems.reduce((sum, item) => sum + item.qty, 0),
        },
        data: unusedItems,
      };

      const buffer = await this.unusedDispensedReportExcelService.generateReport(reportData);
      const dateStr = params.date || new Date().toISOString().split('T')[0];
      const filename = `unused_dispensed_report_${dateStr}.xlsx`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Unused Dispensed Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Unused Dispensed Excel report: ${errorMessage}`);
    }
  }

  /**
   * Get Vending Mapping Report Data (JSON)
   * ดึงข้อมูลจาก database โดยตรงใน report-service
   */
  async getVendingMappingData(params: {
    startDate?: string;
    endDate?: string;
    printDate?: string;
  }): Promise<any> {
    try {
      const whereConditions: any = {};

      if (params?.printDate) {
        // whereConditions.print_date = params.printDate;
        whereConditions.print_date = params.startDate
      }

      if (params?.startDate && params?.endDate) {
        whereConditions.created_at = {
          gte: new Date(params.startDate + 'T00:00:00.000Z'),
          lte: new Date(params.endDate + 'T23:59:59.999Z'),
        };
      }

      const usageRecords = await this.prisma.medicalSupplyUsage.findMany({
        where: whereConditions,
        include: {
          supply_items: true,
        },
        orderBy: {
          print_date: 'desc',
        },
      });

      const reportByDate = new Map<string, any>();

      for (const usage of usageRecords) {
        const printDate = usage.print_date || usage.update || '';
        if (!printDate) continue;

        if (!reportByDate.has(printDate)) {
          reportByDate.set(printDate, {
            print_date: printDate,
            total_episodes: 0,
            total_patients: new Set<string>(),
            total_items: 0,
            mapped_items: [],
            unmapped_items: [],
          });
        }

        const report = reportByDate.get(printDate);
        report.total_episodes += 1;
        report.total_patients.add(usage.patient_hn);

        for (const item of usage.supply_items) {
          const itemCode = item.order_item_code || item.supply_code;
          if (!itemCode) continue;

          report.total_items += item.qty || 0;

          const dispensedItem = await this.prisma.$queryRaw<any[]>`
            SELECT 
              ist.RowID,
              ist.ItemCode,
              i.itemname,
              ist.LastCabinetModify,
              ist.Qty,
              ist.RfidCode
            FROM itemstock ist
            INNER JOIN item i ON ist.ItemCode = i.itemcode
            WHERE ist.ItemCode = ${itemCode}
              AND ist.StockID = 0
           
            LIMIT 1
          `;

          if (dispensedItem && dispensedItem.length > 0) {
            report.mapped_items.push({
              item_code: itemCode,
              item_name: item.order_item_description || item.supply_name,
              patient_hn: usage.patient_hn,
              patient_name: `${usage.first_name || ''} ${usage.lastname || ''}`.trim(),
              en: usage.en,
              qty: item.qty,
              assession_no: item.assession_no,
              dispensed_date: dispensedItem[0].LastCabinetModify,
              rfid_code: dispensedItem[0].RfidCode,
            });
          } else {
            report.unmapped_items.push({
              item_code: itemCode,
              item_name: item.order_item_description || item.supply_name,
              patient_hn: usage.patient_hn,
              patient_name: `${usage.first_name || ''} ${usage.lastname || ''}`.trim(),
              en: usage.en,
              qty: item.qty,
              assession_no: item.assession_no,
            });
          }
        }
      }

      const result = Array.from(reportByDate.values()).map(report => ({
        ...report,
        total_patients: report.total_patients.size,
      }));

      return {
        filters: params,
        summary: {
          total_days: result.length,
          total_episodes: result.reduce((sum, r) => sum + r.total_episodes, 0),
          total_patients: result.reduce((sum, r) => sum + r.total_patients, 0),
          total_items: result.reduce((sum, r) => sum + r.total_items, 0),
          total_mapped: result.reduce((sum, r) => sum + r.mapped_items.length, 0),
          total_unmapped: result.reduce((sum, r) => sum + r.unmapped_items.length, 0),
        },
        data: result,
      };
    } catch (error) {
      console.error('[Report Service] Error getting Vending Mapping data:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to get Vending Mapping data: ${errorMessage}`);
    }
  }

  /**
   * Get Unmapped Dispensed Report Data (JSON)
   * ดึงข้อมูลจาก database โดยตรงใน report-service
   */
  async getUnmappedDispensedData(params: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'month';
  }): Promise<any> {
    try {
      const groupBy = params.groupBy || 'day';

      let whereClause = Prisma.sql`ist.StockID = 0 AND ist.RfidCode <> ''`;

      if (params?.startDate) {
        whereClause = Prisma.sql`${whereClause} AND DATE(ist.LastCabinetModify) >= DATE(${new Date(params.startDate)})`;
      }
      if (params?.endDate) {
        whereClause = Prisma.sql`${whereClause} AND DATE(ist.LastCabinetModify) <= DATE(${new Date(params.endDate)})`;
      }

      const dateFormat = groupBy === 'day'
        ? Prisma.sql`DATE(ist.LastCabinetModify)`
        : Prisma.sql`DATE_FORMAT(ist.LastCabinetModify, '%Y-%m')`;

      const dispensedItems: any[] = await this.prisma.$queryRaw`
        SELECT
          ist.RowID,
          ist.ItemCode,
          i.itemname,
          ist.LastCabinetModify,
          ist.Qty,
          ist.RfidCode,
          ${dateFormat} as group_date
        FROM itemstock ist
        INNER JOIN item i ON ist.ItemCode = i.itemcode
        WHERE ${whereClause}
        ORDER BY ist.LastCabinetModify DESC
      `;

      const reportByDate = new Map<string, any>();

      for (const dispensed of dispensedItems) {
        const itemCode = dispensed.ItemCode;
        const dispensedDate = dispensed.LastCabinetModify;
        const groupDate = dispensed.group_date;

        const usageRecord = await this.prisma.medicalSupplyUsage.findFirst({
          where: {
            supply_items: {
              some: {
                OR: [
                  { order_item_code: itemCode },
                  { supply_code: itemCode },
                ],
              },
            },
            created_at: {
              gte: new Date(new Date(dispensedDate).setHours(0, 0, 0, 0)),
              lte: new Date(new Date(dispensedDate).setHours(23, 59, 59, 999)),
            },
          },
        });

        if (!usageRecord) {
          if (!reportByDate.has(groupDate)) {
            reportByDate.set(groupDate, {
              date: groupDate,
              items: [],
              total_qty: 0,
            });
          }

          const report = reportByDate.get(groupDate);
          report.items.push({
            item_code: itemCode,
            item_name: dispensed.itemname,
            dispensed_date: dispensedDate,
            qty: Number(dispensed.Qty),
            rfid_code: dispensed.RfidCode,
          });
          report.total_qty += Number(dispensed.Qty);
        }
      }

      const result = Array.from(reportByDate.values());

      return {
        filters: params,
        summary: {
          total_periods: result.length,
          total_unmapped_items: result.reduce((sum, r) => sum + r.items.length, 0),
          total_unmapped_qty: result.reduce((sum, r) => sum + r.total_qty, 0),
        },
        groupBy,
        data: result,
      };
    } catch (error) {
      console.error('[Report Service] Error getting Unmapped Dispensed data:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to get Unmapped Dispensed data: ${errorMessage}`);
    }
  }

  /**
   * Get Unused Dispensed Report Data (JSON)
   * ดึงข้อมูลจาก database โดยตรงใน report-service
   */
  async getUnusedDispensedData(params: {
    date?: string;
  }): Promise<any> {
    try {
      const targetDate = params?.date
        ? new Date(params.date)
        : new Date();

      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const dispensedItems: any[] = await this.prisma.$queryRaw`
        SELECT
          ist.RowID,
          ist.ItemCode,
          i.itemname,
          ist.LastCabinetModify,
          ist.Qty,
          ist.RfidCode
        FROM itemstock ist
        INNER JOIN item i ON ist.ItemCode = i.itemcode
        WHERE ist.StockID = 0
          AND ist.RfidCode <> ''
          AND DATE(ist.LastCabinetModify) = DATE(${startOfDay})
        ORDER BY ist.LastCabinetModify DESC
      `;

      const unusedItems: any[] = [];

      for (const dispensed of dispensedItems) {
        const itemCode = dispensed.ItemCode;

        const usageRecord = await this.prisma.medicalSupplyUsage.findFirst({
          where: {
            supply_items: {
              some: {
                OR: [
                  { order_item_code: itemCode },
                  { supply_code: itemCode },
                ],
              },
            },
            created_at: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            supply_items: {
              where: {
                OR: [
                  { order_item_code: itemCode },
                  { supply_code: itemCode },
                ],
              },
            },
          },
        });

        if (!usageRecord) {
          unusedItems.push({
            item_code: itemCode,
            item_name: dispensed.itemname,
            dispensed_date: dispensed.LastCabinetModify,
            qty: Number(dispensed.Qty),
            rfid_code: dispensed.RfidCode,
            hours_since_dispense: Math.floor(
              (new Date().getTime() - new Date(dispensed.LastCabinetModify).getTime()) / (1000 * 60 * 60)
            ),
            supply_usage_item_id: null,
          });
        } else {
          // Find matching supply item that can be returned
          const matchingItem = usageRecord.supply_items.find((item: any) => {
            const availableQty = item.qty - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0);
            return availableQty > 0;
          });

          if (matchingItem) {
            const availableQty = matchingItem.qty || 0 - (matchingItem.qty_used_with_patient || 0) - (matchingItem.qty_returned_to_cabinet || 0);
            unusedItems.push({
              item_code: itemCode,
              item_name: dispensed.itemname,
              dispensed_date: dispensed.LastCabinetModify,
              qty: Number(dispensed.Qty),
              rfid_code: dispensed.RfidCode,
              hours_since_dispense: Math.floor(
                (new Date().getTime() - new Date(dispensed.LastCabinetModify).getTime()) / (1000 * 60 * 60)
              ),
              supply_usage_item_id: matchingItem.id,
              available_qty: availableQty,
            });
          }
        }
      }

      return {
        summary: {
          date: targetDate.toISOString().split('T')[0],
          total_unused_items: unusedItems.length,
          total_unused_qty: unusedItems.reduce((sum, item) => sum + item.qty, 0),
        },
        data: unusedItems,
      };
    } catch (error) {
      console.error('[Report Service] Error getting Unused Dispensed data:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to get Unused Dispensed data: ${errorMessage}`);
    }
  }

  /**
   * Get Cancel Bill Report Data (JSON)
   * ดึงข้อมูลรายการที่ยกเลิก Bill จาก MedicalSupplyUsage
   */
  async getCancelBillReportData(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      const whereConditions: any = {
        billing_status: 'CANCELLED',
      };

      if (params?.startDate || params?.endDate) {
        whereConditions.created_at = {};
        if (params?.startDate) {
          whereConditions.created_at.gte = new Date(params.startDate);
        }
        if (params?.endDate) {
          whereConditions.created_at.lte = new Date(params.endDate);
        }
      }

      const cancelledRecords = await this.prisma.medicalSupplyUsage.findMany({
        where: whereConditions,
        include: {
          supply_items: {
            where: {
              order_item_status: 'Discontinue',
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      const result = cancelledRecords.map(record => ({
        id: record.id,
        en: record.en,
        patient_hn: record.patient_hn,
        patient_name: `${record.first_name || ''} ${record.lastname || ''}`.trim() || record.patient_name_th || '-',
        print_date: record.print_date,
        created_at: record.created_at,
        billing_status: record.billing_status,
        cancelled_items: record.supply_items.map(item => ({
          item_code: item.order_item_code || item.supply_code,
          item_name: item.order_item_description || item.supply_name,
          assession_no: item.assession_no,
          qty: item.qty,
          qty_used_with_patient: item.qty_used_with_patient,
          order_item_status: item.order_item_status,
        })),
      }));

      return {
        filters: params,
        summary: {
          total_cancelled_bills: result.length,
          total_cancelled_items: result.reduce((sum, r) => sum + r.cancelled_items.length, 0),
        },
        data: result,
      };
    } catch (error) {
      console.error('[Report Service] Error getting Cancel Bill data:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to get Cancel Bill data: ${errorMessage}`);
    }
  }

  /**
   * Get Return Report Data (JSON)
   * ดึงข้อมูลการคืนเวชภัณฑ์จาก medical-supplies-service
   */
  async getReturnReportData(params: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const response: any = await firstValueFrom(
        this.medicalSuppliesClient.send(
          { cmd: 'medical_supply_item.getReturnHistory' },
          params
        )
      );

      if (!response || !response.success) {
        throw new Error('Failed to get return history data');
      }

      // Response structure: { success: true, data: [...], total: ..., page: ..., limit: ... }
      // Return the data object with data and total
      return {
        data: response.data || [],
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 10,
      };
    } catch (error) {
      console.error('[Report Service] Error getting Return Report data:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to get Return Report data: ${errorMessage}`);
    }
  }

  /**
   * Generate Return Report in Excel format
   */
  async generateReturnReportExcel(params: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
  }): Promise<Buffer> {
    try {
      // Get return history data from medical-supplies-service
      const returnData = await this.getReturnReportData({
        ...params,
        page: 1,
        limit: 10000, // Get all records for report
      });

      // Prepare report data
      const reportData: ReturnReportData = {
        filters: {
          date_from: params.date_from,
          date_to: params.date_to,
          return_reason: params.return_reason,
          department_code: params.department_code,
          patient_hn: params.patient_hn,
        },
        summary: {
          total_records: returnData.total || returnData.data?.length || 0,
          total_qty_returned: returnData.data?.reduce(
            (sum: number, record: any) => sum + (record.qty_returned || 0),
            0
          ) || 0,
        },
        data: returnData.data || [],
      };

      // Generate Excel report
      const buffer = await this.returnReportExcelService.generateReport(reportData);
      return buffer;
    } catch (error) {
      console.error('[Report Service] Error generating Return Report Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Return Report Excel: ${errorMessage}`);
    }
  }

  /**
   * Generate Return Report in PDF format
   */
  async generateReturnReportPdf(params: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
  }): Promise<Buffer> {
    try {
      // Get return history data from medical-supplies-service
      const returnData = await this.getReturnReportData({
        ...params,
        page: 1,
        limit: 10000, // Get all records for report
      });

      // Prepare report data
      const reportData: ReturnReportData = {
        filters: {
          date_from: params.date_from,
          date_to: params.date_to,
          return_reason: params.return_reason,
          department_code: params.department_code,
          patient_hn: params.patient_hn,
        },
        summary: {
          total_records: returnData.total || returnData.data?.length || 0,
          total_qty_returned: returnData.data?.reduce(
            (sum: number, record: any) => sum + (record.qty_returned || 0),
            0
          ) || 0,
        },
        data: returnData.data || [],
      };

      // Generate PDF report
      const buffer = await this.returnReportPdfService.generateReport(reportData);
      return buffer;
    } catch (error) {
      console.error('[Report Service] Error generating Return Report PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Return Report PDF: ${errorMessage}`);
    }
  }

  /**
   * Generate Cancel Bill Report in Excel format
   */
  async generateCancelBillReportExcel(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<Buffer> {
    try {
      // Get cancel bill data
      const cancelBillData = await this.getCancelBillReportData(params);

      // Prepare report data
      const reportData: CancelBillReportData = {
        filters: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
        summary: {
          total_cancelled_bills: cancelBillData.summary?.total_cancelled_bills || 0,
          total_cancelled_items: cancelBillData.summary?.total_cancelled_items || 0,
        },
        data: cancelBillData.data || [],
      };

      // Generate Excel report
      const buffer = await this.cancelBillReportExcelService.generateReport(reportData);
      return buffer;
    } catch (error) {
      console.error('[Report Service] Error generating Cancel Bill Report Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Cancel Bill Report Excel: ${errorMessage}`);
    }
  }

  /**
   * Generate Cancel Bill Report in PDF format
   */
  async generateCancelBillReportPdf(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<Buffer> {
    try {
      // Get cancel bill data
      const cancelBillData = await this.getCancelBillReportData(params);

      // Prepare report data
      const reportData: CancelBillReportData = {
        filters: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
        summary: {
          total_cancelled_bills: cancelBillData.summary?.total_cancelled_bills || 0,
          total_cancelled_items: cancelBillData.summary?.total_cancelled_items || 0,
        },
        data: cancelBillData.data || [],
      };

      // Generate PDF report
      const buffer = await this.cancelBillReportPdfService.generateReport(reportData);
      return buffer;
    } catch (error) {
      console.error('[Report Service] Error generating Cancel Bill Report PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Cancel Bill Report PDF: ${errorMessage}`);
    }
  }

  /**
   * Get Returned Items Data (StockID = 1) for report
   */
  async getReturnToCabinetReportData(params: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<any> {
    try {
      const response: any = await firstValueFrom(
        this.medicalSuppliesClient.send(
          { cmd: 'medical_supply.getReturnedItems' },
          params
        )
      );

      if (!response || !response.success) {
        throw new Error('Failed to get returned items data');
      }

      return {
        data: response.data || [],
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 10,
      };
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to get Return To Cabinet Report data: ${errorMessage}`);
    }
  }

  /**
   * Generate Return To Cabinet Report in Excel format
   */
  async generateReturnToCabinetReportExcel(params: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<Buffer> {
    try {
      const returnedData = await this.getReturnToCabinetReportData({
        ...params,
        page: 1,
        limit: 10000,
      });

      const reportData: ReturnToCabinetReportData = {
        filters: {
          keyword: params.keyword,
          itemTypeId: params.itemTypeId,
          startDate: params.startDate,
          endDate: params.endDate,
          departmentId: params.departmentId,
          cabinetId: params.cabinetId,
        },
        summary: {
          total_records: returnedData.total || returnedData.data?.length || 0,
          total_qty: returnedData.data?.reduce(
            (sum: number, record: any) => sum + (record.qty || 0),
            0
          ) || 0,
        },
        data: returnedData.data || [],
      };

      const buffer = await this.returnToCabinetReportExcelService.generateReport(reportData);
      return buffer;
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Return To Cabinet Report Excel: ${errorMessage}`);
    }
  }

  /**
   * Generate Return To Cabinet Report in PDF format
   */
  async generateReturnToCabinetReportPdf(params: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<Buffer> {
    try {
      const returnedData = await this.getReturnToCabinetReportData({
        ...params,
        page: 1,
        limit: 10000,
      });

      const reportData: ReturnToCabinetReportData = {
        filters: {
          keyword: params.keyword,
          itemTypeId: params.itemTypeId,
          startDate: params.startDate,
          endDate: params.endDate,
          departmentId: params.departmentId,
          cabinetId: params.cabinetId,
        },
        summary: {
          total_records: returnedData.total || returnedData.data?.length || 0,
          total_qty: returnedData.data?.reduce(
            (sum: number, record: any) => sum + (record.qty || 0),
            0
          ) || 0,
        },
        data: returnedData.data || [],
      };

      const buffer = await this.returnToCabinetReportPdfService.generateReport(reportData);
      return buffer;
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Return To Cabinet Report PDF: ${errorMessage}`);
    }
  }

  /**
   * Generate Dispensed Items Report in Excel format
   */
  async generateDispensedItemsExcel(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      // Get dispensed items data from medical-supplies-service
      const response: any = await firstValueFrom(
        this.medicalSuppliesClient.send(
          { cmd: 'medical_supply.getDispensedItems' },
          {
            keyword: params.keyword,
            startDate: params.startDate,
            endDate: params.endDate,
            page: params.page || 1,
            limit: params.limit || 10000, // Get all records for report
          }
        )
      );

      if (!response || !response.success || !response.data) {
        throw new Error('Failed to fetch dispensed items data');
      }

      const dispensedItems = Array.isArray(response.data) ? response.data : [];

      // Prepare report data
      const reportData: DispensedItemsReportData = {
        filters: {
          keyword: params.keyword,
          startDate: params.startDate,
          endDate: params.endDate,
        },
        summary: {
          total_records: response.total || dispensedItems.length,
          total_qty: dispensedItems.reduce((sum: number, item: any) => sum + (item.qty || 0), 0),
        },
        data: dispensedItems,
      };

      // Generate Excel report
      const buffer = await this.dispensedItemsExcelService.generateReport(reportData);
      const dateStr = params.startDate ? params.startDate.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const filename = `dispensed_items_report_${dateStr}.xlsx`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Dispensed Items Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Dispensed Items Excel report: ${errorMessage}`);
    }
  }

  /**
   * Generate Dispensed Items Report in PDF format
   */
  async generateDispensedItemsPDF(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      // Get dispensed items data from medical-supplies-service
      const response: any = await firstValueFrom(
        this.medicalSuppliesClient.send(
          { cmd: 'medical_supply.getDispensedItems' },
          {
            keyword: params.keyword,
            startDate: params.startDate,
            endDate: params.endDate,
            page: params.page || 1,
            limit: params.limit || 10000, // Get all records for report
          }
        )
      );

      if (!response || !response.success || !response.data) {
        throw new Error('Failed to fetch dispensed items data');
      }

      const dispensedItems = Array.isArray(response.data) ? response.data : [];

      // Prepare report data
      const reportData: DispensedItemsReportData = {
        filters: {
          keyword: params.keyword,
          startDate: params.startDate,
          endDate: params.endDate,
        },
        summary: {
          total_records: response.total || dispensedItems.length,
          total_qty: dispensedItems.reduce((sum: number, item: any) => sum + (item.qty || 0), 0),
        },
        data: dispensedItems,
      };

      // Generate PDF report
      const buffer = await this.dispensedItemsPdfService.generateReport(reportData);
      const dateStr = params.startDate ? params.startDate.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const filename = `dispensed_items_report_${dateStr}.pdf`;

      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Dispensed Items PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Dispensed Items PDF report: ${errorMessage}`);
    }
  }

  /**
   * Get Cabinet Stock Report Data (สต๊อกอุปกรณ์ในตู้)
   * คอลัมน์: ลำดับ, แผนก, รหัสอุปกรณ์, อุปกรณ์, คงเหลือ, Stock Max, Stock Min, จำนวนที่ต้องเติม
   * จำนวนที่ต้องเติม = Max - (Min - คงเหลือ) (แสดงเป็น 0 ถ้าเป็นลบ)
   */
  async getCabinetStockData(params: {
    cabinetId?: number;
    cabinetCode?: string;
  }): Promise<CabinetStockReportData> {
    try {
      let whereClause = Prisma.sql`ist.StockID > 0 AND ist.StockID = c.stock_id`;
      if (params?.cabinetId != null) {
        whereClause = Prisma.sql`${whereClause} AND c.id = ${params.cabinetId}`;
      }
      if (params?.cabinetCode) {
        whereClause = Prisma.sql`${whereClause} AND c.cabinet_code = ${params.cabinetCode}`;
      }

      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT
          c.id AS cabinet_id,
          c.cabinet_name,
          c.cabinet_code,
          dept.DepName AS department_name,
          ist.ItemCode AS item_code,
          i.itemname AS item_name,
          SUM(ist.Qty) AS balance_qty,
          i.stock_max,
          i.stock_min
        FROM itemstock ist
        INNER JOIN item i ON ist.ItemCode = i.itemcode
        INNER JOIN app_microservice_cabinets c ON ist.StockID = c.stock_id
        LEFT JOIN (
          SELECT cd.cabinet_id, MIN(d.DepName) AS DepName
          FROM app_microservice_cabinet_departments cd
          INNER JOIN department d ON d.ID = cd.department_id
          GROUP BY cd.cabinet_id
        ) dept ON dept.cabinet_id = c.id
        WHERE ${whereClause}
        GROUP BY c.id, c.cabinet_name, c.cabinet_code, dept.DepName, ist.ItemCode, i.itemname, i.stock_max, i.stock_min
        ORDER BY dept.DepName, c.cabinet_name, ist.ItemCode
      `;

      const data: CabinetStockReportData['data'] = [];
      let seq = 1;
      let totalQty = 0;
      let totalRefillQty = 0;
      for (const row of rows) {
        const balanceQty = Number(row.balance_qty ?? 0);
        const stockMax = row.stock_max != null ? Number(row.stock_max) : null;
        const stockMin = row.stock_min != null ? Number(row.stock_min) : null;
        const refillQty =
          stockMax != null ? Math.max(0, stockMax - balanceQty) : 0;
        totalQty += balanceQty;
        totalRefillQty += refillQty;
        data.push({
          seq,
          department_name: row.department_name ?? '-',
          item_code: row.item_code,
          item_name: row.item_name,
          balance_qty: balanceQty,
          stock_max: row.stock_max != null ? Number(row.stock_max) : null,
          stock_min: stockMin,
          refill_qty: refillQty,
        });
        seq++;
      }

      data.sort((a, b) => (b.refill_qty || 0) - (a.refill_qty || 0));
      data.forEach((row, i) => {
        row.seq = i + 1;
      });

      return {
        filters: { cabinetId: params?.cabinetId, cabinetCode: params?.cabinetCode },
        summary: {
          total_rows: data.length,
          total_qty: totalQty,
          total_refill_qty: totalRefillQty,
        },
        data,
      };
    } catch (error) {
      console.error('[Report Service] Error getting Cabinet Stock data:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to get Cabinet Stock report data: ${errorMessage}`);
    }
  }

  /**
   * Generate Cabinet Stock Report (สต๊อกอุปกรณ์ในตู้) - Excel
   */
  async generateCabinetStockExcel(params: {
    cabinetId?: number;
    cabinetCode?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const reportData = await this.getCabinetStockData(params);
      const buffer = await this.cabinetStockReportExcelService.generateReport(reportData);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `cabinet_stock_report_${dateStr}.xlsx`;
      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Cabinet Stock Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Cabinet Stock Excel report: ${errorMessage}`);
    }
  }

  /**
   * Generate Cabinet Stock Report (สต๊อกอุปกรณ์ในตู้) - PDF
   */
  async generateCabinetStockPdf(params: {
    cabinetId?: number;
    cabinetCode?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const reportData = await this.getCabinetStockData(params);
      const buffer = await this.cabinetStockReportPdfService.generateReport(reportData);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `cabinet_stock_report_${dateStr}.pdf`;
      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Cabinet Stock PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Cabinet Stock PDF report: ${errorMessage}`);
    }
  }

  /**
   * Get Dispensed Items for Patients Report Data (รายการเบิกอุปกรณ์ใช้กับคนไข้)
   * ดึงข้อมูลจาก medical supply usage ที่มี supply_items และเชื่อมโยงกับ dispensed items
   */
  async getDispensedItemsForPatientsData(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
  }): Promise<DispensedItemsForPatientsReportData> {
    try {
      const baseWhere: any = {};
      if (params.startDate || params.endDate) {
        baseWhere.created_at = {};
        if (params.startDate) {
          baseWhere.created_at.gte = new Date(params.startDate + 'T00:00:00.000Z');
        }
        if (params.endDate) {
          baseWhere.created_at.lte = new Date(params.endDate + 'T23:59:59.999Z');
        }
      }
      if (params?.patientHn) {
        baseWhere.patient_hn = params.patientHn;
      }
      if (params?.departmentCode) {
        baseWhere.department_code = params.departmentCode;
      }
      if (params?.keyword?.trim()) {
        const keyword = params.keyword.trim();
        baseWhere.OR = [
          { first_name: { contains: keyword } },
          { lastname: { contains: keyword } },
          { patient_name_th: { contains: keyword } },
          { patient_name_en: { contains: keyword } },
          { en: { contains: keyword } },
          {
            supply_items: {
              some: {
                OR: [
                  { order_item_description: { contains: keyword } },
                  { supply_name: { contains: keyword } },
                  { order_item_code: { contains: keyword } },
                ],
              },
            },
          },
        ];
      }
      const [data, total] = await Promise.all([
        this.prisma.medicalSupplyUsage.findMany({
          where: baseWhere,
          include: {
            supply_items: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.medicalSupplyUsage.count({ where: baseWhere }),
      ]);


      const reportData: DispensedItemsForPatientsReportData['data'] = data.map((usage, index) => {
        const supplyItems = (usage as { supply_items?: Array<{ order_item_code?: string; supply_code?: string; order_item_description?: string; supply_name?: string; qty?: number; quantity?: number }> }).supply_items ?? [];
        const supply_items: DispensedItemsForPatientsReportData['data'][0]['supply_items'] = supplyItems.map((item) => ({
          itemcode: item?.order_item_code ?? item?.supply_code ?? '-',
          itemname: item?.order_item_description ?? item?.supply_name ?? '-',
          qty: Number(item?.qty ?? item?.quantity ?? 0),
        }));
        return {
          usage_id: usage.id,
          seq: index + 1,
          patient_hn: usage.patient_hn ?? '-',
          patient_name: usage.first_name ?? usage.lastname ?? usage.patient_name_th ?? usage.patient_name_en ?? '-',
          en: usage.en ?? undefined,
          department_code: usage.department_code ?? undefined,
          dispensed_date: usage.usage_datetime ?? usage.created_at?.toISOString() ?? '',
          supply_items,
        };
      });

      const totalQty = reportData.reduce((sum, u) => sum + u.supply_items.reduce((s, i) => s + i.qty, 0), 0);

      return {
        filters: {
          keyword: params.keyword,
          startDate: params.startDate,
          endDate: params.endDate,
          patientHn: params.patientHn,
          departmentCode: params.departmentCode,
        },
        summary: {
          total_records: total,
          total_qty: totalQty,
          total_patients: data.length,
        },
        data: reportData,
      };
    } catch (error) {
      console.error('[Report Service] Error getting Dispensed Items for Patients data:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to get Dispensed Items for Patients report data: ${errorMessage}`);
    }
  }

  /**
   * Generate Dispensed Items for Patients Report (รายการเบิกอุปกรณ์ใช้กับคนไข้) - Excel
   */
  async generateDispensedItemsForPatientsExcel(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const reportData = await this.getDispensedItemsForPatientsData(params);
      const buffer = await this.dispensedItemsForPatientsExcelService.generateReport(reportData);
      const dateStr = params.startDate ? params.startDate.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const filename = `dispensed_items_for_patients_report_${dateStr}.xlsx`;
      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Dispensed Items for Patients Excel:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Dispensed Items for Patients Excel report: ${errorMessage}`);
    }
  }

  /**
   * Generate Dispensed Items for Patients Report (รายการเบิกอุปกรณ์ใช้กับคนไข้) - PDF
   */
  async generateDispensedItemsForPatientsPdf(params: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
  }): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const reportData = await this.getDispensedItemsForPatientsData(params);
      const buffer = await this.dispensedItemsForPatientsPdfService.generateReport(reportData);
      const dateStr = params.startDate ? params.startDate.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
      const filename = `dispensed_items_for_patients_report_${dateStr}.pdf`;
      return { buffer, filename };
    } catch (error) {
      console.error('[Report Service] Error generating Dispensed Items for Patients PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to generate Dispensed Items for Patients PDF report: ${errorMessage}`);
    }
  }
}
