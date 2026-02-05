import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { resolveReportLogoPath } from '../config/report.config';

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
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data structure: data.data must be an array');
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Report Service';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('รายงานการคืนเวชภัณฑ์', {
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

    worksheet.mergeCells('B1:I2');
    const headerCell = worksheet.getCell('B1');
    headerCell.value =
      'รายงานการคืนเวชภัณฑ์\nReturn Report';
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
    worksheet.mergeCells('A3:I3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `วันที่รายงาน: ${reportDate}`;
    dateCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF6C757D' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getRow(3).height = 20;

    // แถว 4: เงื่อนไข + สรุป (ถ้ามี)
    // let tableStartRow = 5;
    // if (data.filters && (data.filters.date_from || data.filters.date_to || data.filters.return_reason)) {
    //   worksheet.mergeCells(`A4:I4`);
    //   const filterParts: string[] = [];
    //   if (data.filters.date_from || data.filters.date_to) {
    //     filterParts.push(`วันที่: ${data.filters.date_from || ''} ถึง ${data.filters.date_to || ''}`);
    //   }
    //   if (data.filters.return_reason) {
    //     filterParts.push(`สาเหตุ: ${this.getReturnReasonLabel(data.filters.return_reason)}`);
    //   }
    //   const summaryStr = `สรุป: ${data.summary.total_records} รายการ, ${data.summary.total_qty_returned} ชิ้น`;
    //   const filterCell = worksheet.getCell('A4');
    //   filterCell.value = [...filterParts, summaryStr].join(' | ');
    //   filterCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF495057' } };
    //   filterCell.alignment = { horizontal: 'left', vertical: 'middle' };
    //   worksheet.getRow(4).height = 20;
    //   tableStartRow = 6;
    // }

    // ---- ตารางข้อมูล ----
    const tableHeaders = [
      'ลำดับ',
      'รหัสอุปกรณ์',
      'ชื่ออุปกรณ์',
      'HN',
      'EN',
      'จำนวนที่คืน',
      'สาเหตุการคืน',
      'วันที่คืน',
      'หมายเหตุ',
    ];
    const headerRow = worksheet.getRow(5);
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

    let dataRowIndex = 6;
    data.data.forEach((record, idx) => {
      const excelRow = worksheet.getRow(dataRowIndex);
      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
      const itemCode = record.supply_item?.order_item_code || record.supply_item?.supply_code || '-';
      const itemName = record.supply_item?.order_item_description || record.supply_item?.supply_name || '-';
      const patientHn = record.supply_item?.usage?.patient_hn || '-';
      const en = record.supply_item?.usage?.en || '-';
      const cells = [
        idx + 1,
        itemCode,
        itemName,
        patientHn,
        en,
        record.qty_returned,
        this.getReturnReasonLabel(record.return_reason),
        record.return_datetime instanceof Date
          ? record.return_datetime.toLocaleDateString('th-TH')
          : new Date(record.return_datetime).toLocaleDateString('th-TH'),
        record.return_note || '-',
      ];
      cells.forEach((val, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = val;
        cell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF212529' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = {
          horizontal: colIndex === 1 || colIndex === 2 || colIndex === 8 ? 'left' : 'center',
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

    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 32;
    worksheet.getColumn(4).width = 14;
    worksheet.getColumn(5).width = 14;
    worksheet.getColumn(6).width = 14;
    worksheet.getColumn(7).width = 28;
    worksheet.getColumn(8).width = 18;
    worksheet.getColumn(9).width = 24;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getReturnReasonLabel(reason: string): string {
    const labels: { [key: string]: string } = {
      UNWRAPPED_UNUSED: 'ยังไม่ได้แกะซอง / อยู่ในสภาพเดิม',
      EXPIRED: 'อุปกรณ์หมดอายุ',
      CONTAMINATED: 'อุปกรณ์มีการปนเปื้อน',
      DAMAGED: 'อุปกรณ์ชำรุด',
    };
    return labels[reason] || reason;
  }
}
