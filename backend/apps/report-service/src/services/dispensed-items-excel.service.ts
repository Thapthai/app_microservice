import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReportConfig } from '../config/report.config';

function formatReportDateTime(value?: string) {
  if (!value) return '-';

  // If backend serializes a Bangkok-local DATETIME as UTC (ending with 'Z'),
  // compensate by shifting back 7 hours, then format in ReportConfig.timezone.
  const base = new Date(value);
  const corrected =
    typeof value === 'string' && value.endsWith('Z')
      ? new Date(base.getTime() - 7 * 60 * 60 * 1000)
      : base;

  return corrected.toLocaleString(ReportConfig.locale, {
    timeZone: ReportConfig.timezone,
    ...ReportConfig.dateFormat.datetime,
  });
}

export interface DispensedItemsReportData {
  filters?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
  };
  summary: {
    total_records: number;
    total_qty: number;
  };
  data: Array<{
    RowID: number;
    itemcode: string;
    itemname: string;
    modifyDate: string;
    qty: number;
    itemCategory: string;
    itemtypeID: number;
    RfidCode: string;
    StockID: number;
    Istatus_rfid?: number;
    CabinetUserID?: number;
    cabinetUserName?: string;
  }>;
}

@Injectable()
export class DispensedItemsExcelService {
  async generateReport(data: DispensedItemsReportData): Promise<Buffer> {
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data structure: data.data must be an array');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานการเบิกอุปกรณ์');

    // Title
    const titleRow = worksheet.addRow(['รายงานการเบิกอุปกรณ์']);
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { name: 'Tahoma', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titleRow.height = 30;

    // Filters
    worksheet.addRow([]);
    const filterRow = worksheet.addRow(['เงื่อนไขการค้นหา']);
    worksheet.mergeCells('A3:I3');
    filterRow.height = 22;
    const filterCell = worksheet.getCell('A3');
    filterCell.font = { name: 'Tahoma', size: 12, bold: true };
    filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
    filterCell.alignment = { horizontal: 'left', vertical: 'middle' };

    const filters = data.filters || {};
    const filterRow1 = worksheet.addRow(['คำค้นหา', filters.keyword || 'ทั้งหมด']);
    filterRow1.height = 18;
    worksheet.getCell('A4').font = { name: 'Tahoma', size: 10, bold: true };
    worksheet.getCell('B4').font = { name: 'Tahoma', size: 10 };
    
    const filterRow2 = worksheet.addRow(['วันที่เริ่มต้น', filters.startDate || 'ทั้งหมด']);
    filterRow2.height = 18;
    worksheet.getCell('A5').font = { name: 'Tahoma', size: 10, bold: true };
    worksheet.getCell('B5').font = { name: 'Tahoma', size: 10 };
    
    const filterRow3 = worksheet.addRow(['วันที่สิ้นสุด', filters.endDate || 'ทั้งหมด']);
    filterRow3.height = 18;
    worksheet.getCell('A6').font = { name: 'Tahoma', size: 10, bold: true };
    worksheet.getCell('B6').font = { name: 'Tahoma', size: 10 };

    // Summary
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow(['สรุปผล']);
    worksheet.mergeCells('A8:I8');
    summaryRow.height = 22;
    const summaryCell = worksheet.getCell('A8');
    summaryCell.font = { name: 'Tahoma', size: 12, bold: true };
    summaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
    summaryCell.alignment = { horizontal: 'left', vertical: 'middle' };

    const summaryRow1 = worksheet.addRow(['จำนวนรายการทั้งหมด', data.summary.total_records]);
    summaryRow1.height = 18;
    worksheet.getCell('A9').font = { name: 'Tahoma', size: 10, bold: true };
    worksheet.getCell('B9').font = { name: 'Tahoma', size: 10 };
    
    const summaryRow2 = worksheet.addRow(['จำนวนรวม', data.summary.total_qty]);
    summaryRow2.height = 18;
    worksheet.getCell('A10').font = { name: 'Tahoma', size: 10, bold: true };
    worksheet.getCell('B10').font = { name: 'Tahoma', size: 10 };

    worksheet.addRow([]);

    // Headers
    const headerRow = worksheet.addRow([
      'ลำดับ',
      'รหัสอุปกรณ์',
      'ชื่ออุปกรณ์',
      'วันที่เบิก',
      'จำนวน',
      'ประเภท',
      'RFID Code',
      'ชื่อผู้เบิก',
      'สถานะ RFID',
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
    data.data.forEach((item, index) => {
      const row = worksheet.addRow([
        index + 1,
        item.itemcode,
        item.itemname,
        formatReportDateTime(item.modifyDate),
        item.qty,
        item.itemCategory || '-',
        item.RfidCode || '-',
        item.cabinetUserName || 'ไม่ระบุ',
        item.Istatus_rfid !== undefined ? item.Istatus_rfid : '-',
      ]);
      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Tahoma', size: 11 };
        cell.alignment = {
          horizontal: colNumber === 3 || colNumber === 8 ? 'left' : 'center',
          vertical: 'middle',
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
    worksheet.getColumn(1).width = 12;  // ลำดับ
    worksheet.getColumn(2).width = 18;  // รหัสอุปกรณ์
    worksheet.getColumn(3).width = 35;  // ชื่ออุปกรณ์
    worksheet.getColumn(4).width = 22;  // วันที่เบิก
    worksheet.getColumn(5).width = 15;  // จำนวน
    worksheet.getColumn(6).width = 15;  // ประเภท
    worksheet.getColumn(7).width = 22;  // RFID Code
    worksheet.getColumn(8).width = 22;  // ชื่อผู้เบิก
    worksheet.getColumn(9).width = 18;  // สถานะ RFID

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
