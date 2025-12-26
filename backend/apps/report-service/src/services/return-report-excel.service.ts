import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ReturnReportData {
  filters?: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
  };
  summary: {
    total_records: number;
    total_qty_returned: number;
  };
  data: Array<{
    id: number;
    qty_returned: number;
    return_reason: string;
    return_datetime: Date;
    return_by_user_id: string;
    return_note?: string;
    supply_item: {
      order_item_code?: string;
      order_item_description?: string;
      supply_code?: string;
      supply_name?: string;
      usage: {
        patient_hn: string;
        en: string;
        first_name?: string;
        lastname?: string;
        department_code?: string;
      };
    };
  }>;
}

@Injectable()
export class ReturnReportExcelService {
  async generateReport(data: ReturnReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานการคืนเวชภัณฑ์');

    // Title
    const titleRow = worksheet.addRow(['รายงานการคืนเวชภัณฑ์']);
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { name: 'Tahoma', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
    titleRow.height = 30;

    // Filters
    worksheet.addRow([]);
    if (data.filters) {
      worksheet.addRow(['เงื่อนไขการค้นหา']);
      if (data.filters.date_from || data.filters.date_to) {
        worksheet.addRow(['วันที่', `${data.filters.date_from || ''} ถึง ${data.filters.date_to || ''}`]);
      }
      if (data.filters.return_reason) {
        worksheet.addRow(['สาเหตุการคืน', data.filters.return_reason]);
      }
      if (data.filters.department_code) {
        worksheet.addRow(['แผนก', data.filters.department_code]);
      }
      if (data.filters.patient_hn) {
        worksheet.addRow(['HN', data.filters.patient_hn]);
      }
      worksheet.addRow([]);
    }

    // Summary
    worksheet.addRow(['สรุปผล (Summary)']);
    worksheet.addRow(['จำนวนรายการที่คืน', data.summary.total_records]);
    worksheet.addRow(['จำนวนรวมที่คืน', data.summary.total_qty_returned]);
    worksheet.addRow([]);

    // Headers
    const headerRow = worksheet.addRow([
      'ลำดับ',
      'รหัสอุปกรณ์',
      'ชื่ออุปกรณ์',
      'HN',
      'EN',
      'จำนวนที่คืน',
      'สาเหตุการคืน',
      'วันที่คืน',
      'หมายเหตุ',
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Tahoma', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 25;

    // Data rows
    data.data.forEach((record, index) => {
      const row = worksheet.addRow([
        index + 1,
        record.supply_item?.order_item_code || record.supply_item?.supply_code || '-',
        record.supply_item?.order_item_description || record.supply_item?.supply_name || '-',
        record.supply_item?.usage?.patient_hn || '-',
        record.supply_item?.usage?.en || '-',
        record.qty_returned,
        this.getReturnReasonLabel(record.return_reason),
        record.return_datetime,
        record.return_note || '-',
      ]);
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Tahoma', size: 11 };
        cell.alignment = { 
          horizontal: colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 9 ? 'left' : 'center', 
          vertical: 'middle' 
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Set column widths
    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 35;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 30;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 30;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getReturnReasonLabel(reason: string): string {
    const labels: { [key: string]: string } = {
      'UNWRAPPED_UNUSED': 'ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิม',
      'EXPIRED': 'อุปกรณ์หมดอายุ',
      'CONTAMINATED': 'อุปกรณ์มีการปนเปื้อน',
      'DAMAGED': 'อุปกรณ์ชำรุด',
    };
    return labels[reason] || reason;
  }
}

