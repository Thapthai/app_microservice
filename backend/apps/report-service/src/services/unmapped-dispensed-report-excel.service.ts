import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface UnmappedDispensedReportData {
  filters?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'month';
  };
  summary: {
    total_periods: number;
    total_unmapped_items: number;
    total_unmapped_qty: number;
  };
  groupBy: 'day' | 'month';
  data: Array<{
    date: string;
    items: Array<{
      item_code: string;
      item_name: string;
      dispensed_date: Date;
      qty: number;
      rfid_code: string;
    }>;
    total_qty: number;
  }>;
}

@Injectable()
export class UnmappedDispensedReportExcelService {
  async generateReport(data: UnmappedDispensedReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานการเบิกที่ Mapping ไม่ได้');

    // Title
    const titleRow = worksheet.addRow(['รายงานสรุปการเบิกที่ Mapping ไม่ได้']);
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { name: 'Tahoma', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titleRow.height = 30;

    // Summary
    worksheet.addRow([]);
    worksheet.addRow(['สรุปผล (Summary)']);
    worksheet.addRow(['จำนวนช่วงเวลา', data.summary.total_periods]);
    worksheet.addRow(['จำนวนรายการที่ Mapping ไม่ได้', data.summary.total_unmapped_items]);
    worksheet.addRow(['จำนวนรวม', data.summary.total_unmapped_qty]);
    worksheet.addRow(['รูปแบบ', data.groupBy === 'day' ? 'รายวัน' : 'รายเดือน']);

    worksheet.addRow([]);

    // Headers
    const headerRow = worksheet.addRow([
      data.groupBy === 'day' ? 'วันที่' : 'เดือน',
      'รหัสอุปกรณ์',
      'ชื่ออุปกรณ์',
      'วันที่เบิก',
      'จำนวน',
      'RFID Code',
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Tahoma', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203864' } };
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
    data.data.forEach((period) => {
      period.items.forEach((item, index) => {
        const row = worksheet.addRow([
          index === 0 ? period.date : '',
          item.item_code,
          item.item_name,
          item.dispensed_date,
          item.qty,
          item.rfid_code,
        ]);
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Tahoma', size: 11 };
          cell.alignment = { horizontal: colNumber === 1 || colNumber === 3 ? 'left' : 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });
    });

    // Set column widths
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 10;
    worksheet.getColumn(6).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

