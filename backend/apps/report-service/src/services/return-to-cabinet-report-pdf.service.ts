import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { ReturnToCabinetReportData } from './return-to-cabinet-report-excel.service';
import { ReportConfig } from '../config/report.config';

function formatReportDate(value?: string) {
  if (!value) return '-';

  // If backend serializes a Bangkok-local DATETIME as UTC (ending with 'Z'),
  // compensate by shifting back 7 hours, then format in ReportConfig.timezone.
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

@Injectable()
export class ReturnToCabinetReportPdfService {
  /**
   * Register Thai font from project assets only
   */
  private async registerThaiFont(doc: PDFKit.PDFDocument): Promise<boolean> {
    try {
      const possiblePaths = [
        path.join(__dirname, '../../assets/fonts'),
        path.join(__dirname, '../../../apps/report-service/assets/fonts'),
        path.join(__dirname, '../../apps/report-service/assets/fonts'),
        path.join(process.cwd(), 'apps/report-service/assets/fonts'),
      ];

      let basePath: string | null = null;
      
      for (const testPath of possiblePaths) {
        const testFile = path.join(testPath, 'THSarabunNew.ttf');
        if (fs.existsSync(testFile)) {
          basePath = testPath;
          break;
        }
      }

      if (!basePath) {
        return false;
      }

      const regularFont = path.join(basePath, 'THSarabunNew.ttf');
      const boldFont = path.join(basePath, 'THSarabunNew Bold.ttf');

      doc.registerFont('ThaiFont', regularFont);
      
      if (fs.existsSync(boldFont)) {
        doc.registerFont('ThaiFontBold', boldFont);
      } else {
        doc.registerFont('ThaiFontBold', regularFont);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async generateReport(data: ReturnToCabinetReportData): Promise<Buffer> {
    try {
      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid data structure: data.data must be an array');
      }

      const doc = new PDFDocument({ 
        size: 'A4',
        layout: 'portrait',
        margin: 35,
      });

      const chunks: Buffer[] = [];

      let finalFontName = 'Helvetica';
      let finalFontBoldName = 'Helvetica-Bold';
      
      try {
        const hasThaiFont = await this.registerThaiFont(doc);
        if (hasThaiFont) {
          finalFontName = 'ThaiFont';
          finalFontBoldName = 'ThaiFontBold';
        }
      } catch (fontError) {
        finalFontName = 'Helvetica';
        finalFontBoldName = 'Helvetica-Bold';
      }

      return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error) => reject(error));

        try {
          // Header
          const headerTop = 40;
          doc.fontSize(20)
             .font(finalFontBoldName)
             .fillColor('#2C3E50')
             .text('รายงานคืนอุปกรณ์เข้าตู้', 35, headerTop, { 
               align: 'center', 
               width: doc.page.width - 70 
             });
          
          doc.fillColor('#000000');
          doc.y = headerTop + 35;

          // Filters Box
          if (data.filters && (data.filters.keyword || data.filters.itemTypeId || data.filters.startDate || data.filters.endDate)) {
            const filterBoxY = doc.y;
            const filterBoxPadding = 10;
            const filterHeaderHeight = 20;
            const filterBoxHeight = 40;
            doc.rect(35, filterBoxY, doc.page.width - 70, filterBoxHeight)
               .fillAndStroke('#F8F9FA', '#E0E0E0');
            
            doc.rect(35, filterBoxY, doc.page.width - 70, filterHeaderHeight)
               .fill('#F0F0F0');
            
            doc.fontSize(12)
               .font(finalFontBoldName)
               .fillColor('#2C3E50')
               .text('เงื่อนไขการค้นหา', 35 + filterBoxPadding, filterBoxY + 5);
            
            doc.fontSize(10)
               .font(finalFontName)
               .fillColor('#000000');
            
            let filterY = filterBoxY + filterHeaderHeight + 5;
            if (data.filters.keyword) {
              doc.text(`คำค้นหา: ${data.filters.keyword}`, 35 + filterBoxPadding, filterY);
              filterY += 12;
            }
            if (data.filters.itemTypeId) {
              doc.text(`ประเภทอุปกรณ์: ID ${data.filters.itemTypeId}`, 35 + filterBoxPadding, filterY);
              filterY += 12;
            }
            if (data.filters.startDate || data.filters.endDate) {
              doc.text(`วันที่: ${data.filters.startDate || ''} ถึง ${data.filters.endDate || ''}`, 35 + filterBoxPadding, filterY);
            }
            
            doc.y = filterBoxY + filterBoxHeight + 15;
          }

          // Summary Box
          const summaryBoxY = doc.y;
          const summaryBoxPadding = 10;
          const summaryHeaderHeight = 20;
          const summaryBoxHeight = 60;
          doc.rect(35, summaryBoxY, doc.page.width - 70, summaryBoxHeight)
             .fillAndStroke('#E8F5E9', '#C8E6C9');
          
          doc.rect(35, summaryBoxY, doc.page.width - 70, summaryHeaderHeight)
             .fill('#C8E6C9');
          
          doc.fontSize(12)
             .font(finalFontBoldName)
             .fillColor('#2C3E50')
             .text('สรุปผล', 35 + summaryBoxPadding, summaryBoxY + 5);
          
          doc.fontSize(10)
             .font(finalFontName)
             .fillColor('#000000');
          doc.text(`จำนวนรายการทั้งหมด: ${data.summary.total_records}`, 35 + summaryBoxPadding, summaryBoxY + summaryHeaderHeight + 5)
             .text(`จำนวนรวม: ${data.summary.total_qty}`, 35 + summaryBoxPadding, summaryBoxY + summaryHeaderHeight + 17);
          
          doc.y = summaryBoxY + summaryBoxHeight + 20;

          // Table
          const tableTop = doc.y;
          const itemHeight = 20;
          const cellPadding = 5;
          const headers = ['ลำดับ', 'รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'วันที่แก้ไข', 'ชื่อผู้เบิก', 'RFID Code', 'cabinet'];
          const totalTableWidth = doc.page.width - 70; // 35 margin on each side
          
          // Calculate proportional column widths
          const colPercentages = [0.08, 0.12, 0.25, 0.15, 0.15, 0.15, 0.10]; // Sum = 1.00
          const colWidths = colPercentages.map(p => Math.floor(totalTableWidth * p));
          
          // Adjust last column to fill remaining width
          const totalCalculated = colWidths.reduce((sum, w) => sum + w, 0);
          const remaining = totalTableWidth - totalCalculated;
          if (remaining > 0) {
            colWidths[colWidths.length - 1] += remaining;
          }
          
          // Draw header
          doc.fontSize(9).font(finalFontBoldName);
          let xPos = 35;
          headers.forEach((header, i) => {
            doc.rect(xPos, tableTop, colWidths[i], itemHeight)
               .fillAndStroke('#E8E8E8', '#CCCCCC');
            doc.fillColor('#2C3E50')
               .text(header, xPos + cellPadding, tableTop + 6, { width: colWidths[i] - cellPadding * 2, align: 'center' });
            xPos += colWidths[i];
          });
          doc.fillColor('#000000');
          
          // Draw table rows
          let yPos = tableTop + itemHeight;
          doc.fontSize(8).font(finalFontName);

          data.data.forEach((item, index) => {
            if (yPos > doc.page.height - 120) {
              doc.addPage({ size: 'A4', layout: 'portrait', margin: 35 });
              
              doc.fontSize(9).font(finalFontBoldName);
              let xPosHeader = 35;
              headers.forEach((header, i) => {
                doc.rect(xPosHeader, 35, colWidths[i], itemHeight)
                   .fillAndStroke('#E8E8E8', '#CCCCCC');
                doc.fillColor('#2C3E50')
                   .text(header, xPosHeader + cellPadding, 43, { width: colWidths[i] - cellPadding * 2, align: 'center' });
                xPosHeader += colWidths[i];
              });
              doc.fillColor('#000000');
              yPos = 35 + itemHeight;
            }

            const rowData = [
              (index + 1).toString(),
              item.itemcode || '-',
              item.itemname || '-',
              formatReportDate(item.modifyDate),
              (item as any).cabinetUserName || 'ไม่ระบุ',
              item.RfidCode || '-',
              (item as any).cabinetName || '-',
            ];

            let xPos = 35;
            rowData.forEach((cellData, i) => {
              doc.rect(xPos, yPos, colWidths[i], itemHeight)
                 .stroke();
              doc.text(cellData, xPos + cellPadding, yPos + 6, { 
                width: colWidths[i] - cellPadding * 2, 
                align: i === 2 ? 'left' : 'center' 
              });
              xPos += colWidths[i];
            });
            yPos += itemHeight;
          });

          doc.end();
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw error;
    }
  }
}
