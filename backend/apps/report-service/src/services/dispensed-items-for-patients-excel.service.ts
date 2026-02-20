import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { resolveReportLogoPath } from '../config/report.config';
import { ReportConfig } from '../config/report.config';

function formatReportDateTime(value?: string) {
  if (!value) return '-';
  const base = new Date(value);
  return base.toLocaleString(ReportConfig.locale, {
    timeZone: ReportConfig.timezone,
    ...ReportConfig.dateFormat.datetime,
  });
}

/** รายการอุปกรณ์ในหนึ่ง usage (สำหรับ sub row) */
export interface DispensedItemLine {
  itemcode: string;
  itemname: string;
  qty: number;
  uom?: string;
  assession_no?: string;
  order_item_status?: string;
}

/** แปลงสถานะให้แสดงเหมือนเว็บ: discontinue→ยกเลิก, verified→ยืนยันแล้ว */
function getStatusLabel(status?: string): string {
  if (status == null || status === '') return '-';
  const lower = status.toLowerCase();
  if (lower === 'discontinue' || lower === 'discontinued') return 'ยกเลิก';
  if (lower === 'verified') return 'ยืนยันแล้ว';
  return status;
}

/** หนึ่ง usage = หนึ่งคนไข้/หนึ่งครั้งเบิก มีหลาย supply_items */
export interface DispensedUsageGroup {
  usage_id: number;
  seq: number;
  patient_hn: string;
  patient_name: string;
  en?: string;
  department_code?: string;
  department_name?: string;
  usage_type?: string;
  dispensed_date: string;
  supply_items: DispensedItemLine[];
}

export interface DispensedItemsForPatientsReportData {
  filters?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
    departmentName?: string;
    usageType?: string;
  };
  summary: {
    total_records: number;
    total_qty: number;
    total_patients: number;
  };
  /** แบบ grouped: แต่ละ element = 1 usage มี supply_items หลายรายการ (สำหรับ main row + sub rows) */
  data: DispensedUsageGroup[];
}

@Injectable()
export class DispensedItemsForPatientsExcelService {
  async generateReport(data: DispensedItemsForPatientsReportData): Promise<Buffer> {
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data structure: data.data must be an array');
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Report Service';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('รายการเบิกอุปกรณ์ใช้กับคนไข้', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
      properties: { defaultRowHeight: 20 },
    });

    const reportDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Bangkok',
    });

    // ---- แถว 1-2: โลโก้ (A1:A2) + ชื่อรายงาน (B1:I2) ----
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

    worksheet.mergeCells('B1:K2');
    const headerCell = worksheet.getCell('B1');
    headerCell.value = 'รายการเบิกอุปกรณ์ใช้กับคนไข้\nDispensed Items for Patients Report';
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
    worksheet.mergeCells('A3:K3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `วันที่รายงาน: ${reportDate}`;
    dateCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF6C757D' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getRow(3).height = 20;
    worksheet.addRow([]);

    // ---- ตารางข้อมูล: main row ต่อ usage + sub rows ต่อ supply_item (เหมือน item-comparison) ----
    const tableStartRow = 5;
    // หัวตาราง 11 คอลัมน์
    const tableHeaders = [
      'ลำดับ',        // 1
      'HN / EN',      // 2
      'ชื่อคนไข้',    // 3
      'แผนก',         // 4 (new)
      'ประเภท',       // 5 (new)
      'วันที่เบิก',   // 6
      'รหัสอุปกรณ์',  // 7
      'ชื่ออุปกรณ์',  // 8
      'จำนวนอุปกรณ์', // 9
      'Assession No', // 10
      'สถานะ',        // 11
    ];
    const headerRow = worksheet.getRow(tableStartRow);
    tableHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      cell.alignment = {
        horizontal: i === 2 || i === 7 ? 'left' : 'center',
        vertical: 'middle',
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    headerRow.height = 26;

    let dataRowIndex = tableStartRow + 1;
    data.data.forEach((usage, idx) => {
      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
      const items = usage.supply_items ?? [];
      // นับเฉพาะอุปกรณ์ที่มีสถานะยืนยัน (Verified) — รายการยกเลิกไม่นำมาคิด
      const totalQty = items
        .filter((i) => (i.order_item_status ?? '').toLowerCase() === 'verified')
        .reduce((s, i) => s + i.qty, 0);

      // Main row: ลำดับ, HN/EN, ชื่อคนไข้, แผนก, ประเภท, วันที่เบิก, ว่าง, ว่าง, จำนวน, ว่าง, ว่าง
      const hnEn = `${usage.patient_hn ?? '-'} / ${usage.en ?? '-'}`;
      const usageTypeLabel = (usage.usage_type ?? '').toUpperCase() === 'IPD' ? 'ผู้ป่วยใน (IPD)'
        : (usage.usage_type ?? '').toUpperCase() === 'OPD' ? 'ผู้ป่วยนอก (OPD)'
        : (usage.usage_type ?? '-');
      const excelRow = worksheet.getRow(dataRowIndex);
      const mainCells: (string | number)[] = [
        usage.seq,                                     // 1 ลำดับ
        hnEn,                                          // 2 HN / EN
        usage.patient_name ?? '-',                     // 3 ชื่อคนไข้
        usage.department_name ?? usage.department_code ?? '-', // 4 แผนก
        usageTypeLabel,                                // 5 ประเภท
        formatReportDateTime(usage.dispensed_date),    // 6 วันที่เบิก
        '',                                            // 7 ว่าง (sub: รหัสอุปกรณ์)
        '',                                            // 8 ว่าง (sub: ชื่ออุปกรณ์)
        totalQty,                                      // 9 จำนวนอุปกรณ์
        '',                                            // 10 ว่าง (sub: Assession No)
        '',                                            // 11 ว่าง (sub: สถานะ)
      ];
      mainCells.forEach((val, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = val;
        cell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF212529' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = {
          horizontal: colIndex === 2 || colIndex === 7 ? 'left' : 'center',
          vertical: 'middle',
        };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      excelRow.height = 22;
      dataRowIndex++;

      // Sub rows: ว่าง×6, รหัสอุปกรณ์, ชื่ออุปกรณ์, จำนวน, Assession No, สถานะ
      items.forEach((item) => {
        const subRow = worksheet.getRow(dataRowIndex);
        const subBg = 'FFF0F8FF';
        const statusLabel = getStatusLabel(item.order_item_status);
        const subCells: (string | number)[] = [
          '',                                            // 1 ว่าง (ลำดับ)
          '',                                            // 2 ว่าง (HN/EN)
          '',                                            // 3 ว่าง (ชื่อคนไข้)
          '',                                            // 4 ว่าง (แผนก)
          '',                                            // 5 ว่าง (ประเภท)
          '',                                            // 6 ว่าง (วันที่เบิก)
          '└ ' + (item.itemcode ?? '-'),                 // 7 รหัสอุปกรณ์
          item.itemname ?? '-',                          // 8 ชื่ออุปกรณ์
          item.uom ? `${item.qty ?? 0} ${item.uom}` : (item.qty ?? 0), // 9 จำนวน
          item.assession_no ?? '-',                      // 10 Assession No
          statusLabel,                                   // 11 สถานะ
        ];
        subCells.forEach((val, colIndex) => {
          const cell = subRow.getCell(colIndex + 1);
          cell.value = val;
          // สถานะ (คอลัมน์ 11, index 10)
          if (colIndex === 10) {
            const statusLower = String(val).toLowerCase();
            if (statusLower === 'ยืนยันแล้ว' || statusLower === 'verified') {
              cell.font = { name: 'Tahoma', size: 9, color: { argb: 'FF16A34A' }, bold: true };
            } else if (statusLower === 'ยกเลิก' || statusLower === 'discontinue' || statusLower === 'discontinued') {
              cell.font = { name: 'Tahoma', size: 9, color: { argb: 'FFDC2626' }, bold: true };
            } else {
              cell.font = { name: 'Tahoma', size: 9, color: { argb: 'FF212529' } };
            }
          } else {
            cell.font = { name: 'Tahoma', size: 9, color: { argb: 'FF212529' } };
          }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subBg } };
          cell.alignment = {
            horizontal: colIndex === 7 ? 'left' : 'center',
            vertical: 'middle',
          };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        subRow.height = 20;
        dataRowIndex++;
      });
    });

    worksheet.addRow([]);
    worksheet.getColumn(1).width = 10;   // ลำดับ
    worksheet.getColumn(2).width = 18;   // HN / EN
    worksheet.getColumn(3).width = 22;   // ชื่อคนไข้
    worksheet.getColumn(4).width = 20;   // แผนก
    worksheet.getColumn(5).width = 16;   // ประเภท
    worksheet.getColumn(6).width = 20;   // วันที่เบิก
    worksheet.getColumn(7).width = 16;   // รหัสอุปกรณ์
    worksheet.getColumn(8).width = 28;   // ชื่ออุปกรณ์
    worksheet.getColumn(9).width = 14;   // จำนวนอุปกรณ์
    worksheet.getColumn(10).width = 18;  // Assession No
    worksheet.getColumn(11).width = 12;  // สถานะ

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
