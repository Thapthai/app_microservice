import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { resolveReportLogoPath } from '../config/report.config';
import { ItemComparisonReportData } from '../types/item-comparison-report.types';

@Injectable()
export class ItemComparisonExcelService {
  async generateReport(data: ItemComparisonReportData): Promise<Buffer> {
    if (!data || !data.comparison) {
      throw new Error('Invalid report data: comparison data is missing');
    }

    const comparisonData = Array.isArray(data.comparison) ? data.comparison : [];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Report Service';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('รายงานเปรียบเทียบการเบิกและใช้', {
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
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' },
    };
    worksheet.getCell('A1').border = {
      right: { style: 'thin' }, bottom: { style: 'thin' },
    };
    let logoImageId: number | null = null;
    const logoPath = resolveReportLogoPath();
    if (logoPath && fs.existsSync(logoPath)) {
      try {
        logoImageId = workbook.addImage({ filename: logoPath, extension: 'png' });
        worksheet.addImage(logoImageId, 'A1:A2');
      } catch {
        // skip logo on error
      }
    }
    worksheet.getRow(1).height = 20;
    worksheet.getRow(2).height = 20;
    worksheet.getColumn(1).width = 12;

    worksheet.mergeCells('B1:I2');
    const headerCell = worksheet.getCell('B1');
    headerCell.value = 'รายงานเปรียบเทียบการเบิกอุปกรณ์และการบันทึกใช้กับคนไข้\nComparative Report on Dispensing and Patient Usage';
    headerCell.font = { name: 'Tahoma', size: 14, bold: true, color: { argb: 'FF1A365D' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    headerCell.border = {
      left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' },
    };

    // ---- แถว 3: วันที่รายงาน ----
    worksheet.mergeCells('A3:I3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `วันที่รายงาน: ${reportDate}`;
    dateCell.font = { name: 'Tahoma', size: 12, color: { argb: 'FF6C757D' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getRow(3).height = 20;

    // ---- แถว 4: Filter summary ----
    const filters = data.filters ?? {};
    const filterLabels = ['วันที่เริ่ม', 'วันที่สิ้นสุด', 'แผนก', 'จำนวนรายการ'];
    const filterValues = [
      filters.startDate ?? 'ทั้งหมด',
      filters.endDate ?? 'ทั้งหมด',
      filters.departmentName ?? filters.departmentCode ?? 'ทั้งหมด',
      `${data.summary?.total_items ?? 0} รายการ`,
    ];
    // 9 columns (A-I) → 4 กลุ่ม: [A,B], [C,D], [E,F], [G,I]
    const filterColMap = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'I']];
    filterLabels.forEach((lbl, gi) => {
      const cols = filterColMap[gi];
      worksheet.mergeCells(`${cols[0]}4:${cols[1]}4`);
      const cell = worksheet.getCell(`${cols[0]}4`);
      cell.value = `${lbl}: ${filterValues[gi]}`;
      cell.font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FF1A365D' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF2' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    worksheet.getRow(4).height = 20;

    // ---- แถว 5: Table header ----
    // ลำดับ, HN/EN, แผนก/ชนิดผู้ป่วย, ชื่ออุปกรณ์, จำนวนเบิก, จำนวนใช้, ส่วนต่าง, วันที่, สถานะ
    const tableStartRow = 5;
    const tableHeaders = [
      'ลำดับ', 'HN / EN', 'แผนก / ชนิดผู้ป่วย', 'ชื่ออุปกรณ์',
      'จำนวนเบิก', 'จำนวนใช้', 'ส่วนต่าง', 'วันที่', 'สถานะ',
    ];
    const headerRow = worksheet.getRow(tableStartRow);
    tableHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Tahoma', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    headerRow.height = 26;

    // ---- แถวข้อมูล ----
    let dataRowIndex = tableStartRow + 1;
    comparisonData.forEach((item, idx) => {
      const difference = (item.total_dispensed ?? 0) - (item.total_used ?? 0) - (item.total_returned ?? 0);
      const isMatch = item.status === 'MATCHED';
      const statusText = this.getStatusText(item.status || 'UNKNOWN');
      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';

      const excelRow = worksheet.getRow(dataRowIndex);
      const mainCells = [
        idx + 1, '', '', item.itemname ?? '-',
        item.total_dispensed ?? 0, item.total_used ?? 0, difference, '', statusText,
      ];
      mainCells.forEach((val, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = val;
        cell.font = { name: 'Tahoma', size: 12, color: { argb: 'FF212529' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        if (colIndex === 6 && difference !== 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
          cell.font = { name: 'Tahoma', size: 12, bold: true, color: { argb: 'FF856404' } };
        }
        if (colIndex === 8) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isMatch ? 'FFD4EDDA' : 'FFF8D7DA' } };
          cell.font = { name: 'Tahoma', size: 12, bold: true, color: { argb: isMatch ? 'FF155724' : 'FF721C24' } };
        }
        cell.alignment = {
          horizontal: colIndex === 1 || colIndex === 2 || colIndex === 3 ? 'left' : 'center',
          vertical: 'middle',
          wrapText: true,
        };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      excelRow.height = 22;
      dataRowIndex++;

      // Sub rows
      if (item.usageItems && Array.isArray(item.usageItems) && item.usageItems.length > 0) {
        item.usageItems.forEach((usage: any) => {
          const subRow = worksheet.getRow(dataRowIndex);
          const usageDate = usage.usage_datetime != null
            ? new Date(usage.usage_datetime).toLocaleDateString('th-TH')
            : '-';
          const hnEn = `${usage.patient_hn ?? '-'} / ${usage.patient_en ?? '-'}`;
          const deptLabel = usage.department_name || usage.department_code || '-';
          const usageType = (usage.usage_type ?? '').toUpperCase();
          const patientTypeLabel = usageType === 'IPD' ? 'ผู้ป่วยใน' : usageType === 'OPD' ? 'ผู้ป่วยนอก' : '';
          const deptAndType = patientTypeLabel ? `${deptLabel} / ${patientTypeLabel}` : deptLabel;
          const usageStatus = this.getUsageOrderStatusText(usage.order_item_status);

          const subCells = [
            '', hnEn, deptAndType, '', '', usage.qty_used ?? 0, '', usageDate, usageStatus,
          ];
          subCells.forEach((val, colIndex) => {
            const cell = subRow.getCell(colIndex + 1);
            cell.value = val;
            let bgColor = 'FFF0F8FF';
            let fontColor = 'FF212529';
            let isBold = false;
            if (colIndex === 8) {
              const lower = usageStatus.toLowerCase();
              if (lower === 'ยืนยันแล้ว' || lower === 'verified') {
                bgColor = 'FFD4EDDA'; fontColor = 'FF155724'; isBold = true;
              } else if (lower === 'ยกเลิก' || lower === 'discontinue' || lower === 'discontinued') {
                bgColor = 'FFF8D7DA'; fontColor = 'FF721C24'; isBold = true;
              } else if (usageStatus === '-') {
                bgColor = 'FFF8F9FA'; fontColor = 'FF6C757D';
              } else {
                bgColor = 'FFE0E7FF'; fontColor = 'FF3730A3'; isBold = true;
              }
            }
            cell.font = { name: 'Tahoma', size: 12, bold: isBold, color: { argb: fontColor } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.alignment = {
              horizontal: colIndex === 1 || colIndex === 2 || colIndex === 3 ? 'left' : 'center',
              vertical: 'middle',
              wrapText: true,
            };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          });
          subRow.height = 24;
          dataRowIndex++;
        });
      }
    });

    worksheet.addRow([]);

    // ---- Footer + หมายเหตุ ----
    const footerRow = dataRowIndex + 1;
    worksheet.mergeCells(`A${footerRow}:I${footerRow}`);
    const footerCell = worksheet.getCell(`A${footerRow}`);
    footerCell.value = 'เอกสารนี้สร้างจากระบบรายงานอัตโนมัติ';
    footerCell.font = { name: 'Tahoma', size: 11, color: { argb: 'FFADB5BD' } };
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(footerRow).height = 18;

    const noteRow = footerRow + 1;
    worksheet.mergeCells(`A${noteRow}:I${noteRow}`);
    const noteCell = worksheet.getCell(`A${noteRow}`);
    noteCell.value = `จำนวนรายการทั้งหมด: ${data.summary?.total_items ?? 0} รายการ | ตรงกัน: ${data.summary?.matched_count ?? 0} | พบความผิดปกติ: ${data.summary?.discrepancy_count ?? 0}`;
    noteCell.font = { name: 'Tahoma', size: 11, color: { argb: 'FF6C757D' } };
    noteCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(noteRow).height = 16;

    // ---- ความกว้างคอลัมน์ ----
    worksheet.getColumn(1).width = 13;  // ลำดับ
    worksheet.getColumn(2).width = 30;  // HN/EN
    worksheet.getColumn(3).width = 24;  // แผนก/ชนิดผู้ป่วย
    worksheet.getColumn(4).width = 40;  // ชื่ออุปกรณ์
    worksheet.getColumn(5).width = 13;  // จำนวนเบิก
    worksheet.getColumn(6).width = 13;  // จำนวนใช้
    worksheet.getColumn(7).width = 13;  // ส่วนต่าง
    worksheet.getColumn(8).width = 16;  // วันที่
    worksheet.getColumn(9).width = 16;  // สถานะ

    // =========================================================
    // Sheet 2: สรุปรายการเบิก
    // =========================================================
    const summarySheet = workbook.addWorksheet('สรุปรายการเบิก', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
      properties: { defaultRowHeight: 20 },
    });

    summarySheet.mergeCells('A1:A2');
    summarySheet.getCell('A1').fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' },
    };
    summarySheet.getCell('A1').border = {
      right: { style: 'thin' }, bottom: { style: 'thin' },
    };
    if (logoImageId != null) {
      try { summarySheet.addImage(logoImageId, 'A1:A2'); } catch { /* skip */ }
    }
    summarySheet.getRow(1).height = 20;
    summarySheet.getRow(2).height = 20;
    summarySheet.getColumn(1).width = 12;

    summarySheet.mergeCells('B1:E2');
    const summaryHeaderCell = summarySheet.getCell('B1');
    summaryHeaderCell.value = 'รายงานเปรียบเทียบการเบิกอุปกรณ์และการบันทึกใช้กับคนไข้\nComparative Report on Dispensing and Patient Usage';
    summaryHeaderCell.font = { name: 'Tahoma', size: 14, bold: true, color: { argb: 'FF1A365D' } };
    summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    summaryHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    summaryHeaderCell.border = {
      left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' },
    };

    summarySheet.mergeCells('A3:E3');
    const summaryDateCell = summarySheet.getCell('A3');
    summaryDateCell.value = `วันที่รายงาน: ${reportDate}`;
    summaryDateCell.font = { name: 'Tahoma', size: 12, color: { argb: 'FF6C757D' } };
    summaryDateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    summarySheet.getRow(3).height = 20;

    // Filter row
    const sumFilterLabels = ['วันที่เริ่ม', 'วันที่สิ้นสุด', 'แผนก', 'จำนวนรายการ'];
    const sumFilterValues = [
      filters.startDate ?? 'ทั้งหมด',
      filters.endDate ?? 'ทั้งหมด',
      filters.departmentName ?? filters.departmentCode ?? 'ทั้งหมด',
      `${data.summary?.total_items ?? 0} รายการ`,
    ];
    const sumFilterColMap = [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'E']];
    sumFilterLabels.forEach((lbl, gi) => {
      const cols = sumFilterColMap[gi];
      summarySheet.mergeCells(`${cols[0]}4:${cols[1]}4`);
      const cell = summarySheet.getCell(`${cols[0]}4`);
      cell.value = `${lbl}: ${sumFilterValues[gi]}`;
      cell.font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FF1A365D' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF2' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    summarySheet.getRow(4).height = 20;

    // Table header row 5
    const summaryTableHeaders = ['ลำดับ', 'ชื่ออุปกรณ์', 'จำนวนเบิก', 'จำนวนใช้', 'ส่วนต่าง'];
    const summaryHeaderRow = summarySheet.getRow(5);
    summaryTableHeaders.forEach((h, i) => {
      const cell = summaryHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Tahoma', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      cell.alignment = { horizontal: i === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    summaryHeaderRow.height = 26;

    let summaryDataRowIndex = 6;
    comparisonData.forEach((item, idx) => {
      const difference = (item.total_dispensed ?? 0) - (item.total_used ?? 0) - (item.total_returned ?? 0);
      const sumRow = summarySheet.getRow(summaryDataRowIndex);
      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
      const sCells = [
        idx + 1, item.itemname ?? '-',
        item.total_dispensed ?? 0, item.total_used ?? 0, difference,
      ];
      sCells.forEach((val, colIndex) => {
        const cell = sumRow.getCell(colIndex + 1);
        cell.value = val;
        let fgColor = bg;
        let fontColor = 'FF212529';
        let isBold = false;
        if (colIndex === 4 && difference !== 0) {
          fgColor = 'FFFFF3CD'; fontColor = 'FF856404'; isBold = true;
        }
        cell.font = { name: 'Tahoma', size: 12, bold: isBold, color: { argb: fontColor } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fgColor } };
        cell.alignment = { horizontal: colIndex === 1 ? 'left' : 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      sumRow.height = 22;
      summaryDataRowIndex++;
    });

    summarySheet.addRow([]);
    const sumFooterRow = summaryDataRowIndex + 1;
    summarySheet.mergeCells(`A${sumFooterRow}:E${sumFooterRow}`);
    const sumFooterCell = summarySheet.getCell(`A${sumFooterRow}`);
    sumFooterCell.value = 'เอกสารนี้สร้างจากระบบรายงานอัตโนมัติ';
    sumFooterCell.font = { name: 'Tahoma', size: 11, color: { argb: 'FFADB5BD' } };
    sumFooterCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(sumFooterRow).height = 18;

    summarySheet.getColumn(1).width = 13;
    summarySheet.getColumn(2).width = 44;
    summarySheet.getColumn(3).width = 14;
    summarySheet.getColumn(4).width = 14;
    summarySheet.getColumn(5).width = 14;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'MATCHED': return 'ตรงกัน';
      case 'DISPENSED_NOT_USED': return 'เบิกแล้วไม่ใช้';
      case 'USED_WITHOUT_DISPENSE': return 'ใช้โดยไม่เบิก';
      case 'DISPENSE_EXCEEDS_USAGE': return 'เบิกมากกว่าใช้';
      case 'USAGE_EXCEEDS_DISPENSE': return 'ใช้มากกว่าเบิก';
      case 'UNKNOWN': return 'ไม่ทราบสถานะ';
      default: return status || '-';
    }
  }

  private getUsageOrderStatusText(status?: string): string {
    if (status == null || status === '') return '-';
    const lower = status.toLowerCase();
    if (lower === 'discontinue' || lower === 'discontinued') return 'ยกเลิก';
    if (lower === 'verified') return 'ยืนยันแล้ว';
    return status;
  }
}
