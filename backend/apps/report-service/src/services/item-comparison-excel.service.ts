import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ItemComparisonReportData } from '../types/item-comparison-report.types';

@Injectable()
export class ItemComparisonExcelService {
  async generateReport(data: ItemComparisonReportData): Promise<Buffer> {
    // Validate data
    if (!data || !data.comparison) {
      throw new Error('Invalid report data: comparison data is missing');
    }

    // Ensure comparison is an array
    const comparisonData = Array.isArray(data.comparison) ? data.comparison : [];
    
    // Ensure summary exists
    const summary = data.summary || {
      total_items: 0,
      total_dispensed: 0,
      total_used: 0,
      matched_count: 0,
      discrepancy_count: 0,
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานเปรียบเทียบ');

    // ========================================
    // SECTION 1: TITLE SECTION (หัวรายงาน)
    // ========================================
    const titleRow = worksheet.addRow(['รายงานเปรียบเทียบการเบิกอุปกรณ์และการบันทึกใช้กับคนไข้']);
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { name: 'Tahoma', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titleRow.height = 30;

    const titleEnRow = worksheet.addRow(['Comparative Report on Medical Equipment Dispensing and Patient Usage Documentation']);
    worksheet.mergeCells('A2:H2');
    const titleEnCell = worksheet.getCell('A2');
    titleEnCell.font = { name: 'Tahoma', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleEnCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleEnCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titleEnRow.height = 28;

    // ========================================
    // SECTION 2: FILTER INFORMATION (ข้อมูลการกรอง)
    // ========================================
    worksheet.addRow([]); // Empty row

    const filterHeaderRow = worksheet.addRow(['ข้อมูลการกรอง (Filter Information)']);
    worksheet.mergeCells(`A${filterHeaderRow.number}:H${filterHeaderRow.number}`);
    const filterHeaderCell = worksheet.getCell(`A${filterHeaderRow.number}`);
    filterHeaderCell.font = { name: 'Tahoma', size: 14, bold: true, color: { argb: 'FF203864' } };
    filterHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
    filterHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    filterHeaderCell.border = {
      top: { style: 'medium', color: { argb: 'FF203864' } },
      left: { style: 'medium', color: { argb: 'FF203864' } },
      bottom: { style: 'medium', color: { argb: 'FF203864' } },
      right: { style: 'medium', color: { argb: 'FF203864' } },
    };
    filterHeaderRow.height = 28;

    // Filter details
    const filterDetails: any[] = [];
    
    if (data.filters.startDate && data.filters.endDate) {
      filterDetails.push(['ช่วงเวลา (Date Range):', `${data.filters.startDate} ถึง ${data.filters.endDate}`]);
    }
    if (data.filters.itemCode) {
      filterDetails.push(['รหัสเวชภัณฑ์ (Item Code):', data.filters.itemCode]);
    }
    if (data.filters.itemTypeId) {
      filterDetails.push(['ประเภทเวชภัณฑ์ (Item Type ID):', data.filters.itemTypeId.toString()]);
    }
    if (data.filters.departmentCode) {
      filterDetails.push(['แผนก (Department):', data.filters.departmentCode]);
    }

    if (filterDetails.length === 0) {
      filterDetails.push(['ช่วงเวลา (Date Range):', 'ทั้งหมด (All)']);
    }

    filterDetails.forEach((detail) => {
      const row = worksheet.addRow(detail);
      row.height = 24;
      
      // Label cell (Column A)
      const labelCell = row.getCell(1);
      labelCell.font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FF203864' } };
      labelCell.alignment = { horizontal: 'left', vertical: 'middle' };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F0FF' } };
      labelCell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FF203864' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
      
      // Value cells (Columns B-H merged)
      worksheet.mergeCells(`B${row.number}:H${row.number}`);
      const valueCell = row.getCell(2);
      valueCell.font = { name: 'Tahoma', size: 13 };
      valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      valueCell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FF203864' } },
      };
    });

    // ========================================
    // SECTION 3: DATA TABLE (ตารางข้อมูล)
    // ========================================
    worksheet.addRow([]); // Empty row

    const headerRow = worksheet.addRow([
      'ลำดับ\n(No.)',
      'รหัสอุปกรณ์\n(Code)',
      'ชื่ออุปกรณ์\n(Name)',
      'จำนวนเบิก\n(Dispensed)',
      'จำนวนใช้\n(Used)',
      'ส่วนต่าง\n(Difference)',
      'สถานะ\n(Status)',
      'ผลการตรวจสอบ\n(Result)',
    ]);
    
    headerRow.height = 40;
    for (let col = 1; col <= 8; col++) {
      const cell = headerRow.getCell(col);
      cell.font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203864' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF203864' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'medium', color: { argb: 'FF203864' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      };
    }

    // Data rows
    let matchCount = 0;
    let notMatchCount = 0;

    comparisonData.forEach((item, index) => {
      const isMatch = item.status === 'MATCHED';
      
      if (isMatch) matchCount++;
      else notMatchCount++;

      // Main item row
      const row = worksheet.addRow([
        index + 1,
        item.itemcode || '-',
        item.itemname || '-',
        item.total_dispensed || 0,
        item.total_used || 0,
        item.difference || 0,
        this.getStatusText(item.status || 'UNKNOWN'),
        isMatch ? '✓ Match' : '✗ Not Match',
      ]);

      row.height = 28;

      // Apply styles to each cell
      for (let col = 1; col <= 8; col++) {
        const cell = row.getCell(col);
        cell.font = { name: 'Tahoma', size: 13, bold: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        };

        // Base color for main items (highlight)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };

        // Alignment
        if (col === 1 || col >= 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      }

      // Special styling for difference
      if (item.difference !== 0) {
        const cell = row.getCell(6);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
        cell.font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FF856404' } };
      }

      // Special styling for match result
      const matchCell = row.getCell(8);
      if (isMatch) {
        matchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
        matchCell.font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FF155724' } };
      } else {
        matchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
        matchCell.font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FF721C24' } };
      }

      // Sub rows for usage items (if available)
      if (item.usageItems && Array.isArray(item.usageItems) && item.usageItems.length > 0) {
        item.usageItems.forEach((usage: any) => {
          const subRow = worksheet.addRow([
            '└ ' + (usage.patient_hn || '-'),
            usage.patient_name || '-',
            usage.department_code || '-',
            '-',
            usage.qty_used || 0,
            usage.qty_returned || '-',
            usage.order_item_status || 'ใช้งาน',
            '-',
          ]);

          subRow.height = 24;

          // Apply styles to sub-row cells
          for (let col = 1; col <= 8; col++) {
            const cell = subRow.getCell(col);
            cell.font = { name: 'Tahoma', size: 12 };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
              left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
              bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
              right: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            };

            // Light blue background for sub-rows
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8FF' } };

            // Alignment
            if (col >= 4 && col !== 8) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else {
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
          }
        });
      }
    });

    // ========================================
    // SECTION 4: SUMMARY (สรุป)
    // ========================================
    worksheet.addRow([]); // Empty row

    const summaryHeaderRow = worksheet.addRow(['สรุปผลการตรวจสอบ (Summary)']);
    worksheet.mergeCells(`A${summaryHeaderRow.number}:H${summaryHeaderRow.number}`);
    summaryHeaderRow.height = 30;
    const summaryHeaderCell = worksheet.getCell(`A${summaryHeaderRow.number}`);
    summaryHeaderCell.font = { name: 'Tahoma', size: 14, bold: true, color: { argb: 'FF856404' } };
    summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summaryHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    summaryHeaderCell.border = {
      top: { style: 'medium', color: { argb: 'FF856404' } },
      left: { style: 'medium', color: { argb: 'FF856404' } },
      bottom: { style: 'thin', color: { argb: 'FF856404' } },
      right: { style: 'medium', color: { argb: 'FF856404' } },
    };

    const summaryRow = worksheet.addRow([
      'ทั้งหมด:',
      `${summary.total_items} รายการ`,
      '',
      'ถูกต้อง:',
      `${matchCount} รายการ`,
      '',
      'ไม่ถูกต้อง:',
      `${notMatchCount} รายการ`,
    ]);
    
    summaryRow.height = 28;
    
    // Column 1: Total label
    summaryRow.getCell(1).font = { name: 'Tahoma', size: 13, bold: true };
    summaryRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E3E5' } };
    summaryRow.getCell(1).border = {
      top: { style: 'thin', color: { argb: 'FF856404' } },
      left: { style: 'thin', color: { argb: 'FF856404' } },
      bottom: { style: 'medium', color: { argb: 'FF856404' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
    
    // Column 2: Total value
    summaryRow.getCell(2).font = { name: 'Tahoma', size: 13, bold: true };
    summaryRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    summaryRow.getCell(2).border = {
      top: { style: 'thin', color: { argb: 'FF856404' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF856404' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
    
    // Column 3: Empty
    summaryRow.getCell(3).border = {
      top: { style: 'thin', color: { argb: 'FF856404' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF856404' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
    
    // Columns 4-5: Match
    summaryRow.getCell(4).font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FF155724' } };
    summaryRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
    summaryRow.getCell(4).border = {
      top: { style: 'thin', color: { argb: 'FF856404' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF856404' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
    
    summaryRow.getCell(5).font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FF155724' } };
    summaryRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
    summaryRow.getCell(5).border = {
      top: { style: 'thin', color: { argb: 'FF856404' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF856404' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
    
    // Column 6: Empty
    summaryRow.getCell(6).border = {
      top: { style: 'thin', color: { argb: 'FF856404' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF856404' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
    
    // Columns 7-8: Not Match
    summaryRow.getCell(7).font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FF721C24' } };
    summaryRow.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
    summaryRow.getCell(7).border = {
      top: { style: 'thin', color: { argb: 'FF856404' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF856404' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
    
    summaryRow.getCell(8).font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FF721C24' } };
    summaryRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryRow.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
    summaryRow.getCell(8).border = {
      top: { style: 'thin', color: { argb: 'FF856404' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF856404' } },
      right: { style: 'thin', color: { argb: 'FF856404' } },
    };

    // ========================================
    // SECTION 5: FOOTER (วันที่สร้างรายงาน)
    // ========================================
    worksheet.addRow([]); // Empty row
    
    const footerRow = worksheet.addRow([
      `สร้างรายงานเมื่อ: ${new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })}`
    ]);
    worksheet.mergeCells(`A${footerRow.number}:H${footerRow.number}`);
    footerRow.height = 22;
    
    const footerCell = footerRow.getCell(1);
    footerCell.font = { name: 'Tahoma', size: 11, italic: true, color: { argb: 'FF666666' } };
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ========================================
    // FINAL: SET COLUMN WIDTHS
    // ========================================
    worksheet.getColumn(1).width = 10;   // ลำดับ
    worksheet.getColumn(2).width = 20;   // รหัสอุปกรณ์
    worksheet.getColumn(3).width = 40;   // ชื่ออุปกรณ์
    worksheet.getColumn(4).width = 15;   // จำนวนเบิก
    worksheet.getColumn(5).width = 15;   // จำนวนใช้
    worksheet.getColumn(6).width = 15;   // ส่วนต่าง
    worksheet.getColumn(7).width = 20;   // สถานะ
    worksheet.getColumn(8).width = 18;   // ผลการตรวจสอบ

    // Generate buffer
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
}
