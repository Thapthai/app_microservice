import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ComparisonReportExcelService } from './services/comparison_report_excel.service';
import { ComparisonReportPdfService } from './services/comparison_report_pdf.service';
import { EquipmentUsageExcelService } from './services/equipment_usage_excel.service';
import { EquipmentUsagePdfService } from './services/equipment_usage_pdf.service';
import { EquipmentDisbursementExcelService } from './services/equipment_disbursement_excel.service';
import { EquipmentDisbursementPdfService } from './services/equipment_disbursement_pdf.service';
import { ItemComparisonExcelService } from './services/item-comparison-excel.service';
import { ItemComparisonPdfService } from './services/item-comparison-pdf.service';
import { ComparisonReportData } from './types/comparison-report.types';
import { EquipmentUsageReportData } from './types/equipment-usage-report.types';
import { EquipmentDisbursementReportData } from './types/equipment-disbursement-report.types';
import { ItemComparisonReportData } from './types/item-comparison-report.types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReportServiceService {
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
  ) { }

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
      if (params.itemCode) queryParams.itemCode = params.itemCode;
      if (params.itemTypeId) queryParams.itemTypeId = params.itemTypeId;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.departmentCode) queryParams.departmentCode = params.departmentCode;

      // Fetch comparison data from medical-supplies-service
      const comparisonResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply.compareDispensedVsUsage' }, queryParams)
      );

      if (!comparisonResponse || !comparisonResponse.success) {
        throw new Error('Failed to fetch comparison data');
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
        comparison: comparisonResponse.comparison || [],
      };

      // If include usage details and itemCode is specified, fetch usage details
      if (params.includeUsageDetails && params.itemCode) {
        try {
          const usageResponse: any = await firstValueFrom(
            this.medicalSuppliesClient.send({ cmd: 'medical_supply.getUsageByItemCode' }, {
              itemCode: params.itemCode,
              startDate: params.startDate,
              endDate: params.endDate,
              departmentCode: params.departmentCode,
            })
          );

          if (usageResponse && usageResponse.success && usageResponse.data) {
            reportData.usageDetails = usageResponse.data;
          }
        } catch (error) {
          console.warn('Failed to fetch usage details:', error);
          // Continue without usage details
        }
      }

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
      if (params.itemCode) queryParams.itemCode = params.itemCode;
      if (params.itemTypeId) queryParams.itemTypeId = params.itemTypeId;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.departmentCode) queryParams.departmentCode = params.departmentCode;

      // Fetch comparison data from medical-supplies-service
      const comparisonResponse: any = await firstValueFrom(
        this.medicalSuppliesClient.send({ cmd: 'medical_supply.compareDispensedVsUsage' }, queryParams)
      );

      if (!comparisonResponse || !comparisonResponse.success) {
        throw new Error('Failed to fetch comparison data');
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
        comparison: comparisonResponse.comparison || [],
      };

      // If include usage details and itemCode is specified, fetch usage details
      if (params.includeUsageDetails && params.itemCode) {
        try {
          const usageResponse: any = await firstValueFrom(
            this.medicalSuppliesClient.send({ cmd: 'medical_supply.getUsageByItemCode' }, {
              itemCode: params.itemCode,
              startDate: params.startDate,
              endDate: params.endDate,
              departmentCode: params.departmentCode,
            })
          );

          if (usageResponse && usageResponse.success && usageResponse.data) {
            reportData.usageDetails = usageResponse.data;
          }
        } catch (error) {
          console.warn('Failed to fetch usage details:', error);
          // Continue without usage details
        }
      }

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
}
