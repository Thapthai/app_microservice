import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { resolveReportLogoPath } from '../config/report.config';

/** แถวรายงานสต๊อกอุปกรณ์ในตู้ */
export interface CabinetStockRow {
  seq: number;
  department_name: string;
  item_code: string;
  item_name: string;
  balance_qty: number;
  stock_max: number | null;
  stock_min: number | null;
  refill_qty: number;
}

export interface CabinetStockReportData {
  filters?: { cabinetId?: number; cabinetCode?: string };
  summary: { total_rows: number; total_qty: number; total_refill_qty: number };
  data: CabinetStockRow[];
}

@Injectable()
export class CabinetStockReportExcelService {
  async generateReport(data: CabinetStockReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Report Service';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('รายงานสต๊อกอุปกรณ์ในตู้', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
      properties: { defaultRowHeight: 20 },
    });

    const reportDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Bangkok',
    });

    // ---- แถว 1-2: โลโก้แคบ (A1:A2) + ชื่อรายงาน (B1:H2) ----
    worksheet.mergeCells('A1:A2');
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' },
    };
    worksheet.getCell('A1').border = {
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    const logoPath = resolveReportLogoPath();
    if (logoPath && fs.existsSync(logoPath)) {
      try {
        const imageId = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        worksheet.addImage(imageId, 'A1:A2');
      } catch {
        // ถ้าใส่รูปไม่ได้ ไม่ต้องแสดงอะไร
      }
    }
    worksheet.getRow(1).height = 20;
    worksheet.getRow(2).height = 20;
    worksheet.getColumn(1).width = 12;

    worksheet.mergeCells('B1:H2');
    const headerCell = worksheet.getCell('B1');
    headerCell.value = 'รายงานสต๊อกอุปกรณ์ในตู้\nCabinet Stock Report';
    headerCell.font = { name: 'Tahoma', size: 14, bold: true, color: { argb: 'FF1A365D' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' },
    };
    headerCell.border = {
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // แถว 3: วันที่รายงาน
    worksheet.mergeCells('A3:H3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `วันที่รายงาน: ${reportDate}`;
    dateCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF6C757D' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getRow(3).height = 20;
    worksheet.addRow([]);

    // ---- ตารางข้อมูล (แสดงก่อน สรุปผล/เงื่อนไข) ----
    const tableStartRow = 5;
    const headers = ['ลำดับ', 'แผนก', 'รหัสอุปกรณ์', 'อุปกรณ์', 'คงเหลือ', 'Stock Max', 'Stock Min', 'จำนวนที่ต้องเติม'];
    const headerRow = worksheet.getRow(tableStartRow);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    headerRow.height = 26;

    const LIGHT_RED = 'FFF8D7D7';
    let dataRowIndex = tableStartRow + 1;
    data.data.forEach((row, idx) => {
      const excelRow = worksheet.getRow(dataRowIndex);
      const hasRefill = (row.refill_qty ?? 0) > 0;
      const bg = hasRefill ? LIGHT_RED : (idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA');
      [
        row.seq,
        row.department_name ?? '-',
        row.item_code,
        row.item_name ?? '-',
        row.balance_qty,
        row.stock_max ?? '-',
        row.stock_min ?? '-',
        row.refill_qty,
      ].forEach((val, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = val;
        cell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF212529' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = {
          horizontal: colIndex === 1 || colIndex === 2 || colIndex === 3 ? 'left' : 'center',
          vertical: 'middle',
        };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      excelRow.height = 22;
      dataRowIndex++;
    });

    worksheet.addRow([]);

    // ---- สรุปผล (หลังตารางข้อมูล) ----
    // const summaryStartRow = dataRowIndex + 1;
    // worksheet.mergeCells(`A${summaryStartRow}:H${summaryStartRow}`);
    // worksheet.getCell(`A${summaryStartRow}`).value = 'สรุปผล';
    // worksheet.getCell(`A${summaryStartRow}`).font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FF1A365D' } };
    // worksheet.getCell(`A${summaryStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
    // worksheet.getCell(`A${summaryStartRow}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    // worksheet.getRow(summaryStartRow).height = 22;

    // worksheet.getCell(`A${summaryStartRow + 1}`).value = 'จำนวนรายการ';
    // worksheet.getCell(`A${summaryStartRow + 1}`).font = { name: 'Tahoma', size: 10, bold: true };
    // worksheet.getCell(`B${summaryStartRow + 1}`).value = data.summary.total_rows;
    // worksheet.getCell(`A${summaryStartRow + 2}`).value = 'จำนวนรวม (ชิ้น)';
    // worksheet.getCell(`A${summaryStartRow + 2}`).font = { name: 'Tahoma', size: 10, bold: true };
    // worksheet.getCell(`B${summaryStartRow + 2}`).value = data.summary.total_qty;
    // worksheet.getCell(`A${summaryStartRow + 3}`).value = 'จำนวนรวมที่ต้องเติม';
    // worksheet.getCell(`A${summaryStartRow + 3}`).font = { name: 'Tahoma', size: 10, bold: true };
    // worksheet.getCell(`B${summaryStartRow + 3}`).value = data.summary.total_refill_qty;
    // worksheet.getRow(summaryStartRow + 1).height = 18;
    // worksheet.getRow(summaryStartRow + 2).height = 18;
    // worksheet.getRow(summaryStartRow + 3).height = 18;
    // worksheet.addRow([]);

    // ---- เงื่อนไขการค้นหา (หลังตารางข้อมูล) ----
    // const filters = data.filters || {};
    // const filterStartRow = summaryStartRow + 5;
    // worksheet.mergeCells(`A${filterStartRow}:H${filterStartRow}`);
    // worksheet.getCell(`A${filterStartRow}`).value = 'เงื่อนไขการค้นหา';
    // worksheet.getCell(`A${filterStartRow}`).font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FF1A365D' } };
    // worksheet.getCell(`A${filterStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
    // worksheet.getCell(`A${filterStartRow}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    // worksheet.getRow(filterStartRow).height = 22;
    // worksheet.getCell(`A${filterStartRow + 1}`).value = 'ตู้ที่เลือก';
    // worksheet.getCell(`A${filterStartRow + 1}`).font = { name: 'Tahoma', size: 10, bold: true };
    // worksheet.getCell(`B${filterStartRow + 1}`).value = filters.cabinetId ? `ID: ${filters.cabinetId}` : filters.cabinetCode || 'ทั้งหมด';
    // worksheet.getCell(`B${filterStartRow + 1}`).font = { name: 'Tahoma', size: 10 };
    // worksheet.getRow(filterStartRow + 1).height = 18;

    // Footer
    // const footerRow = filterStartRow + 2;
    const footerRow = dataRowIndex + 1;
    worksheet.mergeCells(`A${footerRow}:H${footerRow}`);
    const footerCell = worksheet.getCell(`A${footerRow}`);
    footerCell.value = 'เอกสารนี้สร้างจากระบบรายงานอัตโนมัติ';
    footerCell.font = { name: 'Tahoma', size: 9, color: { argb: 'FFADB5BD' } };
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(footerRow).height = 18;

    worksheet.getColumn(1).width = 12;
    worksheet.getColumn(2).width = 22;
    worksheet.getColumn(3).width = 18;
    worksheet.getColumn(4).width = 36;
    worksheet.getColumn(5).width = 12;
    worksheet.getColumn(6).width = 12;
    worksheet.getColumn(7).width = 12;
    worksheet.getColumn(8).width = 18;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
