import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ReturnToCabinetReportData {
  filters?: {
    itemCode?: string;
    itemTypeId?: number;
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
    itemType: string;
    itemCategory: string;
    itemtypeID: number;
    RfidCode: string;
    StockID: number;
    Istatus_rfid?: number;
  }>;
}

@Injectable()
export class ReturnToCabinetReportExcelService {
  async generateReport(data: ReturnToCabinetReportData): Promise<Buffer> {
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data structure: data.data must be an array');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานคืนอุปกรณ์เข้าตู้');

    // Title
    const titleRow = worksheet.addRow(['รายงานคืนอุปกรณ์เข้าตู้']);
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { name: 'Tahoma', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titleRow.height = 30;

    // Filters
    worksheet.addRow([]);
    const filterRow = worksheet.addRow(['เงื่อนไขการค้นหา']);
    worksheet.mergeCells('A2:I2');
    filterRow.height = 20;
    const filterCell = worksheet.getCell('A2');
    filterCell.font = { name: 'Tahoma', size: 12, bold: true };
    filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };

    const filters = data.filters || {};
    worksheet.addRow(['รหัสอุปกรณ์', filters.itemCode || 'ทั้งหมด']);
    worksheet.addRow(['ประเภทอุปกรณ์', filters.itemTypeId ? `ID: ${filters.itemTypeId}` : 'ทั้งหมด']);
    worksheet.addRow(['วันที่เริ่มต้น', filters.startDate || 'ทั้งหมด']);
    worksheet.addRow(['วันที่สิ้นสุด', filters.endDate || 'ทั้งหมด']);

    // Summary
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow(['สรุปผล']);
    worksheet.mergeCells('A7:I7');
    summaryRow.height = 20;
    const summaryCell = worksheet.getCell('A7');
    summaryCell.font = { name: 'Tahoma', size: 12, bold: true };
    summaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };

    worksheet.addRow(['จำนวนรายการทั้งหมด', data.summary.total_records]);
    worksheet.addRow(['จำนวนรวม', data.summary.total_qty]);

    worksheet.addRow([]);

    // Headers
    const headerRow = worksheet.addRow([
      'RowID',
      'รหัสอุปกรณ์',
      'ชื่ออุปกรณ์',
      'วันที่แก้ไขล่าสุด',
      'จำนวน',
      'ประเภท',
      'RFID Code',
      'StockID',
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
    data.data.forEach((item) => {
      const row = worksheet.addRow([
        item.RowID,
        item.itemcode,
        item.itemname,
        item.modifyDate ? new Date(item.modifyDate) : '-',
        item.qty,
        item.itemType || '-',
        item.RfidCode || '-',
        item.StockID,
        item.Istatus_rfid || '-',
      ]);
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Tahoma', size: 11 };
        cell.alignment = {
          horizontal: colNumber === 3 ? 'left' : 'center',
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
    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 10;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 10;
    worksheet.getColumn(9).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
