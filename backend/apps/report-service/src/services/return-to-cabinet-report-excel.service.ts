import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { ReportConfig, resolveReportLogoPath } from '../config/report.config';

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

export interface ReturnToCabinetReportData {
  filters?: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
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
    workbook.creator = 'Report Service';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('รายงานคืนอุปกรณ์เข้าตู้', {
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

    worksheet.mergeCells('B1:G2');
    const headerCell = worksheet.getCell('B1');
    headerCell.value = 'รายงานคืนอุปกรณ์เข้าตู้\nReturn To Cabinet Report';
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
    worksheet.mergeCells('A3:G3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `วันที่รายงาน: ${reportDate}`;
    dateCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF6C757D' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getRow(3).height = 20;

    let currentRow = 3;

    // // แสดงเงื่อนไขการค้นหาให้สอดคล้องกับ params ที่ส่งมา
    
    // const filters = data.filters ?? {};
    // if (
    //   filters.keyword ||
    //   filters.itemTypeId != null ||
    //   filters.startDate ||
    //   filters.endDate ||
    //   filters.departmentId ||
    //   filters.cabinetId
    // ) {
    //   currentRow += 1;
    //   worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    //   const filterCell = worksheet.getCell(`A${currentRow}`);
    //   const parts: string[] = [];
    //   if (filters.keyword) parts.push(`คำค้นหา: ${filters.keyword}`);
    //   if (filters.startDate || filters.endDate) {
    //     parts.push(`วันที่: ${filters.startDate ?? ''} ถึง ${filters.endDate ?? ''}`);
    //   }
    //   if (filters.departmentId) parts.push(`แผนก ID: ${filters.departmentId}`);
    //   if (filters.cabinetId) parts.push(`ตู้ ID: ${filters.cabinetId}`);
    //   if (filters.itemTypeId != null) parts.push(`ประเภทอุปกรณ์ ID: ${filters.itemTypeId}`);

    //   filterCell.value = parts.join(' | ');
    //   filterCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF495057' } };
    //   filterCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    //   filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
    //   filterCell.border = {
    //     top: { style: 'thin' },
    //     left: { style: 'thin' },
    //     right: { style: 'thin' },
    //     bottom: { style: 'thin' },
    //   };
    // }

    // เว้นบรรทัดก่อนตาราง
    currentRow += 2;

    // ---- ตารางข้อมูล (รูปแบบเดียวกับ dispensed-items-for-patients) ----
    const tableStartRow = currentRow;
    const tableHeaders = [
      'ลำดับ',
      'รหัสอุปกรณ์',
      'ชื่ออุปกรณ์',
      'วันที่แก้ไขล่าสุด',
      'ชื่อผู้เบิก',
      'RFID Code',
      'cabinet',
    ];
    const headerRow = worksheet.getRow(tableStartRow);
    tableHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 26;

    let dataRowIndex = tableStartRow + 1;
    data.data.forEach((item, idx) => {
      const excelRow = worksheet.getRow(dataRowIndex);
      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
      const rowValues = [
        idx + 1,
        item.itemcode,
        item.itemname,
        formatReportDateTime(item.modifyDate),
        (item as any).cabinetUserName || 'ไม่ระบุ',
        item.RfidCode || '-',
        (item as any).cabinetName || '-',
      ];

      rowValues.forEach((val, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = val;
        cell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF212529' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = {
          horizontal: colIndex === 2 || colIndex === 4 ? 'left' : 'center',
          vertical: 'middle',
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      excelRow.height = 22;
      dataRowIndex++;
    });

    // ปรับความกว้างคอลัมน์ให้ใกล้เคียง PDF/Excel อื่นๆ
    worksheet.getColumn(1).width = 10; // ลำดับ
    worksheet.getColumn(2).width = 18; // รหัสอุปกรณ์
    worksheet.getColumn(3).width = 32; // ชื่ออุปกรณ์
    worksheet.getColumn(4).width = 22; // วันที่แก้ไขล่าสุด
    worksheet.getColumn(5).width = 22; // ชื่อผู้เบิก
    worksheet.getColumn(6).width = 22; // RFID Code
    worksheet.getColumn(7).width = 20; // cabinet

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
