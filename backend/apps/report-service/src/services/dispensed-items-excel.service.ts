import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { resolveReportLogoPath } from '../config/report.config';
import { ReportConfig } from '../config/report.config';

function formatReportDateTime(value?: string) {
  if (!value) return '-';
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

function formatReportDate(value?: string) {
  if (!value) return '-';
  const base = new Date(value);
  const corrected =
    typeof value === 'string' && value.endsWith('Z')
      ? new Date(base.getTime() - 7 * 60 * 60 * 1000)
      : base;
  return corrected.toLocaleDateString(ReportConfig.locale, {
    timeZone: ReportConfig.timezone,
    ...ReportConfig.dateFormat.date,
  });
}

export interface DispensedItemsReportData {
  filters?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
    departmentName?: string;
    cabinetName?: string;
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
    departmentName?: string;
    cabinetName?: string;
    cabinetCode?: string;
  }>;
}

@Injectable()
export class DispensedItemsExcelService {
  async generateReport(data: DispensedItemsReportData): Promise<Buffer> {
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data structure: data.data must be an array');
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Report Service';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('รายงานการเบิกอุปกรณ์', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
      properties: { defaultRowHeight: 20 },
    });

    const reportDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Bangkok',
    });

    // ---- แถว 1-2: โลโก้ (A1:A2) + ชื่อรายงาน (B1:H2) ----
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
        // skip logo on error
      }
    }
    worksheet.getRow(1).height = 20;
    worksheet.getRow(2).height = 20;
    worksheet.getColumn(1).width = 12;

    worksheet.mergeCells('B1:H2');
    const headerCell = worksheet.getCell('B1');
    headerCell.value = 'รายงานการเบิกอุปกรณ์\nDispensed Items Report';
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

    // แถว 3: filter A–E (แผนก, ตู้, วันที่เริ่ม, วันที่สิ้นสุด) | วันที่ F–G
    const filters = data.filters ?? {};
    const deptLabel = filters.departmentName ? `แผนก: ${filters.departmentName}` : (filters.departmentId ? `แผนก: ${filters.departmentId}` : 'แผนก: ทั้งหมด');
    const cabLabel = filters.cabinetName ? `ตู้: ${filters.cabinetName}` : (filters.cabinetId ? `ตู้: ${filters.cabinetId}` : 'ตู้: ทั้งหมด');
    const startLabel = filters.startDate ? `วันที่เริ่ม: ${filters.startDate}` : 'วันที่เริ่ม: ทั้งหมด';
    const endLabel = filters.endDate ? `วันที่สิ้นสุด: ${filters.endDate}` : 'วันที่สิ้นสุด: ทั้งหมด';
    worksheet.mergeCells('A3:E3');
    const leftCell = worksheet.getCell('A3');
    leftCell.value = `${deptLabel}    ${cabLabel}    ${startLabel}    ${endLabel}`;
    leftCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF6C757D' } };
    leftCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
    worksheet.mergeCells('F3:H3');
    const dateCell = worksheet.getCell('F3');
    dateCell.value = `วันที่รายงาน: ${reportDate}`;
    dateCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF6C757D' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: false };
    worksheet.getRow(3).height = 20;
    worksheet.addRow([]);

    // ---- ตารางข้อมูล (แสดงก่อน สรุปผล/เงื่อนไข) - ไม่มีคอลัมน์ สถานะ RFID ----
    const tableStartRow = 5;
    const tableHeaders = ['ลำดับ', 'รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'วันที่เบิก', 'ชื่อผู้เบิก', 'RFID Code', 'แผนก', 'ตู้',];
    const headerRow = worksheet.getRow(tableStartRow);
    tableHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    headerRow.height = 26;

    let dataRowIndex = tableStartRow + 1;
    data.data.forEach((item, idx) => {
      const excelRow = worksheet.getRow(dataRowIndex);
      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
      [
        idx + 1,
        item.itemcode,
        item.itemname ?? '-',
        formatReportDate(item.modifyDate),
        item.cabinetUserName ?? 'ไม่ระบุ',
        item.RfidCode ?? '-',
        item.departmentName ?? '-',
        item.cabinetName ?? item.cabinetCode ?? '-',
      ].forEach((val, colIndex: number) => {
        const cell = excelRow.getCell(colIndex + 1 as any);
        cell.value = val as any;
        cell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF212529' } } as any;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } } as any;
        cell.alignment = {
          horizontal: colIndex === 2 || colIndex === 4 ? 'left' : 'center',
          vertical: 'middle',
        };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      excelRow.height = 22;
      dataRowIndex++;
    });

    worksheet.addRow([]);


    worksheet.getColumn(1).width = 13;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 32;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 22;
    worksheet.getColumn(6).width = 32;
    worksheet.getColumn(7).width = 18;
    worksheet.getColumn(8).width = 20;


    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
