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
    const summary = data.summary || {
      total_items: 0,
      total_dispensed: 0,
      total_used: 0,
      matched_count: 0,
      discrepancy_count: 0,
    };

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
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' },
    };
    worksheet.getCell('A1').border = {
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    let logoImageId: number | null = null;
    const logoPath = resolveReportLogoPath();
    if (logoPath && fs.existsSync(logoPath)) {
      try {
        logoImageId = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        worksheet.addImage(logoImageId, 'A1:A2');
      } catch {
        // skip logo on error
      }
    }
    worksheet.getRow(1).height = 20;
    worksheet.getRow(2).height = 20;
    worksheet.getColumn(1).width = 12;

    worksheet.mergeCells('B1:J2');
    const headerCell = worksheet.getCell('B1');
    headerCell.value = 'รายงานเปรียบเทียบการเบิกอุปกรณ์และการบันทึกใช้กับคนไข้\nComparative Report on Dispensing and Patient Usage';
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
    worksheet.mergeCells('A3:J3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `วันที่รายงาน: ${reportDate}`;
    dateCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF6C757D' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getRow(3).height = 20;
    worksheet.addRow([]);

    // ---- ตารางข้อมูล (โครงสร้างให้เหมือน PDF) ----
    const tableStartRow = 5;
    // 10 คอลัมน์: ลำดับ, HN/EN, แผนก, รหัสอุปกรณ์, ชื่ออุปกรณ์, จำนวนเบิก, จำนวนใช้, ส่วนต่าง, วันที่, สถานะ
    const tableHeaders = [
      'ลำดับ',        // 1
      'HN/EN',        // 2
      'แผนก',          // 3
      'รหัสอุปกรณ์',   // 4
      'ชื่ออุปกรณ์',    // 5
      'จำนวนเบิก',     // 6
      'จำนวนใช้',      // 7
      'ส่วนต่าง',      // 8
      'วันที่',        // 9
      'สถานะ',        // 10
    ];
    const headerRow = worksheet.getRow(tableStartRow);
    tableHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      // ให้ header ทุกคอลัมน์อยู่กึ่งกลาง (เหมือน PDF)
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
    comparisonData.forEach((item, idx) => {
      const difference =
        (item.total_dispensed ?? 0) - (item.total_used ?? 0) - (item.total_returned ?? 0);
      const excelRow = worksheet.getRow(dataRowIndex);
      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
      const isMatch = item.status === 'MATCHED';
      const statusText = this.getStatusText(item.status || 'UNKNOWN');
      // จัดเรียงข้อมูลหลักให้ตรงกับ header (เหมือน PDF)
      // 0:ลำดับ, 1:HN/EN, 2:ชื่อคนไข้, 3:รหัส, 4:ชื่ออุปกรณ์, 5:จำนวนเบิก, 6:จำนวนใช้, 7:ส่วนต่าง, 8:วันที่, 9:สถานะ
      const cells = [
        idx + 1, // ลำดับ
        '', // HN/EN (แสดงในแถวย่อย)
        '', // ชื่อคนไข้ (แสดงในแถวย่อย)
        item.itemcode || '-', // รหัสอุปกรณ์
        item.itemname ?? '-', // ชื่ออุปกรณ์
        item.total_dispensed ?? 0, // จำนวนเบิก
        item.total_used ?? 0, // จำนวนใช้
        difference, // ส่วนต่าง
        '', // วันที่ (แสดงในแถวย่อย)
        statusText, // สถานะ สรุปต่อรายการเวชภัณฑ์
      ];
      cells.forEach((val, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = val;
        cell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF212529' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        // ไฮไลต์ส่วนต่าง ถ้าไม่เท่ากับ 0 (คอลัมน์ index 7)
        if (colIndex === 7 && difference !== 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
          cell.font = { name: 'Tahoma', size: 10, bold: true, color: { argb: 'FF856404' } };
        }
        // ไฮไลต์สถานะ (คอลัมน์ index 9) เป็นเขียว/แดงเหมือน PDF
        if (colIndex === 9) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isMatch ? 'FFD4EDDA' : 'FFF8D7DA' },
          };
          cell.font = {
            name: 'Tahoma',
            size: 10,
            bold: true,
            color: { argb: isMatch ? 'FF155724' : 'FF721C24' },
          };
        }
        // ชิดซ้ายสำหรับคอลัมน์ HN/EN (1), ชื่อคนไข้ (2), รหัสอุปกรณ์ (3), ชื่ออุปกรณ์ (4)
        cell.alignment = {
          horizontal:
            colIndex === 1 || colIndex === 2 || colIndex === 3 || colIndex === 4
              ? 'left'
              : 'center',
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

      // Sub rows for usage items (รายละเอียดตามคนไข้) ให้โครงสร้างและสถานะตรงกับ PDF/เว็บ
      if (item.usageItems && Array.isArray(item.usageItems) && item.usageItems.length > 0) {
        item.usageItems.forEach((usage: any) => {
          const subRow = worksheet.getRow(dataRowIndex);
          const subBg = 'FFF0F8FF';
          const usageDate =
            usage.created_at != null
              ? new Date(usage.created_at).toLocaleDateString('th-TH')
              : '-';
          const hnEn = `${usage.patient_hn ?? '-'} / ${usage.patient_en ?? '-'}`;
          const usageStatus = this.getUsageOrderStatusText(usage.order_item_status);
          const subCells = [
            ' ', // ลำดับ (ว่างในแถวลูก)
            hnEn, // HN/EN
            usage.department_name || usage.department_code || '-', // แผนก
            '', // รหัสอุปกรณ์ (อยู่ในแถวหลัก)
            '', // ชื่ออุปกรณ์ (อยู่ในแถวหลัก)
            '-', // จำนวนเบิก (รวมอยู่ในแถวหลัก)
            usage.qty_used ?? 0, // จำนวนใช้
            usage.qty_returned ?? 0, // ส่วนต่าง/จำนวนคืนระดับ usage
            usageDate, // วันที่
            usageStatus, // สถานะ (แปลงให้เหมือนเว็บ)
          ];
          subCells.forEach((val, colIndex) => {
            const cell = subRow.getCell(colIndex + 1);
            cell.value = val;
            cell.font = { name: 'Tahoma', size: 9, color: { argb: 'FF212529' } };
            // ลงสีพื้นตามสถานะในคอลัมน์สุดท้าย (index 9) ให้ใกล้เคียงเว็บ
            let bgColor = subBg;
            let fontColor = 'FF212529';
            if (colIndex === 9) {
              const lower = usageStatus.toLowerCase();
              if (lower === 'ยืนยันแล้ว' || lower === 'verified') {
                bgColor = 'FFD4EDDA'; // เขียวอ่อน
                fontColor = 'FF155724'; // เขียวเข้ม
              } else if (
                lower === 'ยกเลิก' ||
                lower === 'discontinue' ||
                lower === 'discontinued'
              ) {
                bgColor = 'FFF8D7DA'; // แดงอ่อน
                fontColor = 'FF721C24'; // แดงเข้ม
              } else if (usageStatus === '-') {
                bgColor = 'FFF8F9FA'; // เทาอ่อน
                fontColor = 'FF6C757D'; // เทา
              } else {
                bgColor = 'FFE0E7FF'; // น้ำเงินอ่อน
                fontColor = 'FF3730A3'; // น้ำเงินเข้ม
              }
              cell.font = { name: 'Tahoma', size: 9, bold: true, color: { argb: fontColor } };
            }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.alignment = {
              horizontal:
                colIndex === 1 || colIndex === 2 || colIndex === 3 || colIndex === 4
                  ? 'left'
                  : 'center',
              vertical: 'middle',
            };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
          subRow.height = 20;
          dataRowIndex++;
        });
      }
    });

    // ปรับความกว้างคอลัมน์ให้ใกล้เคียงสัดส่วนใน PDF
    worksheet.getColumn(1).width = 13; // ลำดับ
    worksheet.getColumn(2).width = 18; // HN/EN
    worksheet.getColumn(3).width = 22; // ชื่อคนไข้
    worksheet.getColumn(4).width = 16; // รหัสอุปกรณ์
    worksheet.getColumn(5).width = 45; // ชื่ออุปกรณ์
    worksheet.getColumn(6).width = 12; // จำนวนเบิก
    worksheet.getColumn(7).width = 12; // จำนวนใช้
    worksheet.getColumn(8).width = 12; // ส่วนต่าง
    worksheet.getColumn(9).width = 16; // วันที่
    worksheet.getColumn(10).width = 14; // สถานะ

    // =========================================================
    // Sheet 2: สรุปรายการเบิก (รวมยอดเบิกตามเวชภัณฑ์ของช่วงวันที่)
    // Header เหมือน Sheet 1
    // =========================================================
    const summarySheet = workbook.addWorksheet('สรุปรายการเบิก', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
      properties: { defaultRowHeight: 20 },
    });

    // ---- แถว 1-2: โลโก้ (A1:A2) + ชื่อรายงาน (B1:H2) เหมือน Sheet 1 ----
    summarySheet.mergeCells('A1:A2');
    summarySheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' },
    };
    summarySheet.getCell('A1').border = {
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    if (logoImageId != null) {
      try {
        summarySheet.addImage(logoImageId, 'A1:A2');
      } catch {
        // skip logo on error
      }
    }
    summarySheet.getRow(1).height = 20;
    summarySheet.getRow(2).height = 20;
    summarySheet.getColumn(1).width = 12;

    summarySheet.mergeCells('B1:F2');
    const summaryHeaderCell = summarySheet.getCell('B1');
    summaryHeaderCell.value =
      'รายงานเปรียบเทียบการเบิกอุปกรณ์และการบันทึกใช้กับคนไข้\nComparative Report on Dispensing and Patient Usage';
    summaryHeaderCell.font = { name: 'Tahoma', size: 14, bold: true, color: { argb: 'FF1A365D' } };
    summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    summaryHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' },
    };
    summaryHeaderCell.border = {
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // แถว 3: วันที่รายงาน เหมือน Sheet 1
    summarySheet.mergeCells('A3:F3');
    const summaryDateCell = summarySheet.getCell('A3');
    summaryDateCell.value = `วันที่รายงาน: ${reportDate}`;
    summaryDateCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF6C757D' } };
    summaryDateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    summarySheet.getRow(3).height = 20;
    summarySheet.addRow([]);

    // Table header (แถว 5) - สไตล์เหมือน Sheet 1
    const summaryTableStartRow = 5;
    const summaryTableHeaders = [
      'ลำดับ',
      'รหัสอุปกรณ์',
      'ชื่ออุปกรณ์',
      'จำนวนเบิก',
      'จำนวนใช้',
      'ส่วนต่าง',
    ];
    const summaryHeaderRow = summarySheet.getRow(summaryTableStartRow);
    summaryTableHeaders.forEach((h, i) => {
      const cell = summaryHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      cell.alignment = {
        horizontal: i === 1 || i === 2 ? 'left' : 'center',
        vertical: 'middle',
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    summaryHeaderRow.height = 26;

    // Data rows (สรุปรายการเบิก/ใช้/ส่วนต่าง ของแต่ละ item)
    let summaryDataRowIndex = summaryTableStartRow + 1;
    comparisonData.forEach((item, idx) => {
      const difference = (item.total_dispensed ?? 0) - (item.total_used ?? 0) - (item.total_returned ?? 0);
      const excelRow = summarySheet.getRow(summaryDataRowIndex);
      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
      const cells = [
        idx + 1,
        item.itemcode || '-',
        item.itemname ?? '-',
        item.total_dispensed ?? 0,
        item.total_used ?? 0,
        difference,
      ];
      cells.forEach((val, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = val;
        cell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF212529' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = {
          horizontal: colIndex === 1 || colIndex === 2 ? 'left' : 'center',
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
      summaryDataRowIndex++;
    });

    summarySheet.getColumn(1).width = 13;
    summarySheet.getColumn(2).width = 18;
    summarySheet.getColumn(3).width = 32;
    summarySheet.getColumn(4).width = 14;
    summarySheet.getColumn(5).width = 14;
    summarySheet.getColumn(6).width = 14;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'MATCHED':
        return 'ตรงกัน';
      case 'DISPENSED_NOT_USED':
        return 'เบิกแล้วไม่ใช้';
      case 'USED_WITHOUT_DISPENSE':
        return 'ใช้โดยไม่เบิก';
      case 'DISPENSE_EXCEEDS_USAGE':
        return 'เบิกมากกว่าใช้';
      case 'USAGE_EXCEEDS_DISPENSE':
        return 'ใช้มากกว่าเบิก';
      case 'UNKNOWN':
        return 'ไม่ทราบสถานะ';
      default:
        return status || '-';
    }
  }

  /** แปลง usage.order_item_status ให้เหมือนบนเว็บ: discontinue→ยกเลิก, verified→ยืนยันแล้ว, ค่าว่าง→'-' */
  private getUsageOrderStatusText(status?: string): string {
    if (status == null || status === '') return '-';
    const lower = status.toLowerCase();
    if (lower === 'discontinue' || lower === 'discontinued') return 'ยกเลิก';
    if (lower === 'verified') return 'ยืนยันแล้ว';
    return status;
  }
}
