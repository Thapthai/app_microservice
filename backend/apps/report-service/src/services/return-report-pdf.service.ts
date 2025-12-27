import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { ReturnReportData } from './return-report-excel.service';

export { ReturnReportData };

@Injectable()
export class ReturnReportPdfService {
  /**
   * Not using Tahoma - using Thai fonts from project only
   */
  private async registerTahomaFont(doc: PDFKit.PDFDocument): Promise<boolean> {
    return false;
  }

  /**
   * Register Thai font from project assets only
   * Ensures consistent rendering across all environments
   */
  private async registerThaiFont(doc: PDFKit.PDFDocument): Promise<boolean> {
    try {
      // Try multiple paths for dev and production
      const possiblePaths = [
        path.join(__dirname, '../../assets/fonts'),
        path.join(__dirname, '../../../apps/report-service/assets/fonts'),
        path.join(__dirname, '../../apps/report-service/assets/fonts'),
        path.join(process.cwd(), 'apps/report-service/assets/fonts'),
      ];

      let basePath: string | null = null;
      
      // Find the correct path
      for (const testPath of possiblePaths) {
        const testFile = path.join(testPath, 'THSarabunNew.ttf');
        if (fs.existsSync(testFile)) {
          basePath = testPath;
          break;
        }
      }

      if (!basePath) {
        console.error(`[PDF Service] Thai font not found in project assets`);
        return false;
      }

      const regularFont = path.join(basePath, 'THSarabunNew.ttf');
      const boldFont = path.join(basePath, 'THSarabunNew Bold.ttf');

      // Register fonts
      doc.registerFont('ThaiFont', regularFont);
      
      if (fs.existsSync(boldFont)) {
        doc.registerFont('ThaiFontBold', boldFont);
      } else {
        doc.registerFont('ThaiFontBold', regularFont);
      }

      return true;
    } catch (error) {
      console.error('[PDF Service] ❌ Error registering Thai font:', error);
      return false;
    }
  }

  /**
   * Generate return report in PDF format
   */
  async generateReport(data: ReturnReportData): Promise<Buffer> {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        layout: 'portrait',
        margin: 35,
      });

      const chunks: Buffer[] = [];

      // Try to register Tahoma first (supports Thai and Unicode)
      let finalFontName = 'Helvetica';
      let finalFontBoldName = 'Helvetica-Bold';
      
      try {
        const hasTahoma = await this.registerTahomaFont(doc);
        if (hasTahoma) {
          finalFontName = 'Tahoma';
          finalFontBoldName = 'Tahoma-Bold';
        } else {
          // Try Thai font as fallback
          const hasThaiFont = await this.registerThaiFont(doc);
          if (hasThaiFont) {
            finalFontName = 'ThaiFont';
            finalFontBoldName = 'ThaiFontBold';
          }
        }
      } catch (fontError) {
        console.warn('[PDF Service] Font registration error, using Helvetica:', fontError);
        finalFontName = 'Helvetica';
        finalFontBoldName = 'Helvetica-Bold';
      }

      return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error) => {
          console.error('[PDF Service] PDF generation error:', error);
          reject(error);
        });

        try {
      
      // Header - Clean design without background color
      const headerTop = 40;
      doc.fontSize(20)
         .font(finalFontBoldName)
         .fillColor('#2C3E50')
         .text('รายงานการคืนเวชภัณฑ์', 35, headerTop, { 
           align: 'center', 
           width: doc.page.width - 70 
         });
      
      doc.fillColor('#000000');
      doc.y = headerTop + 35;

      // Filters Box - Clean design with consistent spacing
      if (data.filters && (data.filters.date_from || data.filters.date_to || data.filters.return_reason || data.filters.department_code || data.filters.patient_hn)) {
        const filterBoxY = doc.y;
        const filterBoxPadding = 10;
        const filterHeaderHeight = 20;
        const filterBoxHeight = 60;
        doc.rect(35, filterBoxY, doc.page.width - 70, filterBoxHeight)
           .fillAndStroke('#F8F9FA', '#E0E0E0');
        
        // Filter Info Header - subtle background
        doc.rect(35, filterBoxY, doc.page.width - 70, filterHeaderHeight)
           .fill('#F0F0F0');
        
        doc.fontSize(12)
           .font(finalFontBoldName)
           .fillColor('#2C3E50')
           .text('เงื่อนไขการค้นหา', 35 + filterBoxPadding, filterBoxY + 5);
        
        // Filter details
        doc.fontSize(10)
           .font(finalFontName)
           .fillColor('#333333');
        
        const leftColX = 35 + filterBoxPadding;
        const rightColX = doc.page.width / 2 + 5;
        const lineHeight = 15;
        let currentY = filterBoxY + filterHeaderHeight + 8;
        
        const labelWidth = 80;
        if (data.filters.date_from || data.filters.date_to) {
          doc.font(finalFontBoldName)
             .fillColor('#2C3E50')
             .text('วันที่:', leftColX, currentY);
          doc.font(finalFontName)
             .fillColor('#333333')
             .text(`${data.filters.date_from || ''} ถึง ${data.filters.date_to || ''}`, leftColX + labelWidth, currentY);
          currentY += lineHeight;
        }
        
        if (data.filters.return_reason) {
          doc.font(finalFontBoldName)
             .fillColor('#2C3E50')
             .text('สาเหตุการคืน:', leftColX, currentY);
          doc.font(finalFontName)
             .fillColor('#333333')
             .text(this.getReturnReasonLabel(data.filters.return_reason), leftColX + labelWidth, currentY);
        }
        
        if (data.filters.department_code) {
          doc.font(finalFontBoldName)
             .fillColor('#2C3E50')
             .text('แผนก:', rightColX, currentY);
          doc.font(finalFontName)
             .fillColor('#333333')
             .text(data.filters.department_code, rightColX + labelWidth, currentY);
        }
        
        if (data.filters.patient_hn) {
          doc.font(finalFontBoldName)
             .fillColor('#2C3E50')
             .text('HN:', rightColX, currentY + (data.filters.department_code ? lineHeight : 0));
          doc.font(finalFontName)
             .fillColor('#333333')
             .text(data.filters.patient_hn, rightColX + labelWidth, currentY + (data.filters.department_code ? lineHeight : 0));
        }
        
        doc.y = filterBoxY + filterBoxHeight + 15;
      }

      // Summary Box - Clean design with consistent spacing
      const summaryBoxY = doc.y;
      const summaryBoxPadding = 10;
      const summaryHeaderHeight = 20;
      const summaryBoxHeight = 50;
      doc.rect(35, summaryBoxY, doc.page.width - 70, summaryBoxHeight)
         .fillAndStroke('#F8F9FA', '#E0E0E0');
      
      // Summary header - subtle background
      doc.rect(35, summaryBoxY, doc.page.width - 70, summaryHeaderHeight)
         .fill('#F0F0F0');
      
      doc.fontSize(12)
         .font(finalFontBoldName)
         .fillColor('#2C3E50')
         .text('สรุปผล (Summary)', 35 + summaryBoxPadding, summaryBoxY + 5);
      
      // Summary content
      const summaryStartY = summaryBoxY + summaryHeaderHeight + 8;
      const summaryLineHeight = 15;
      const summaryLabelWidth = 100;
      
      const summaryLeftX = 35 + summaryBoxPadding;
      const summaryRightX = doc.page.width / 2 + 5;
      
      doc.fontSize(10)
         .font(finalFontBoldName)
         .fillColor('#2C3E50')
         .text('จำนวนรายการที่คืน:', summaryLeftX, summaryStartY);
      doc.fontSize(10)
         .font(finalFontName)
         .fillColor('#333333')
         .text(`${data.summary.total_records} รายการ`, summaryLeftX + summaryLabelWidth, summaryStartY);
      
      doc.fontSize(10)
         .font(finalFontBoldName)
         .fillColor('#2C3E50')
         .text('จำนวนรวมที่คืน:', summaryRightX, summaryStartY);
      doc.fontSize(10)
         .font(finalFontName)
         .fillColor('#333333')
         .text(`${data.summary.total_qty_returned} ชิ้น`, summaryRightX + summaryLabelWidth, summaryStartY);
      
      doc.y = summaryBoxY + summaryBoxHeight + 15;

      // Table Header - consistent spacing
      const startY = doc.y;
      const tableTop = startY + 2;
      const itemHeight = 22;
      const pageWidth = doc.page.width - 70; // A4 portrait: 595 - 70 = 525pt
      
      // Calculate column widths
      const colWidths = [
        35,   // ลำดับ
        70,   // รหัสอุปกรณ์
        120,  // ชื่ออุปกรณ์
        50,   // HN
        50,   // EN
        50,   // จำนวนที่คืน
        100,  // สาเหตุการคืน
        70,   // วันที่คืน
        60    // หมายเหตุ
      ];
      
      // Verify total width matches pageWidth
      const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
      if (Math.abs(totalWidth - pageWidth) > 10) {
        const diff = pageWidth - totalWidth;
        colWidths[2] += diff; // Adjust name column
      }
      
      const headers = ['ลำดับ', 'รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'HN', 'EN', 'จำนวน', 'สาเหตุ', 'วันที่คืน', 'หมายเหตุ'];

      // Draw table header - clean styling with consistent padding
      const cellPadding = 3;
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

      data.data.forEach((record, index) => {
        // Check if we need a new page
        if (yPos > doc.page.height - 120) {
          doc.addPage({ layout: 'portrait', margin: 35 });
          
          // Redraw header on new page
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
          record.supply_item?.order_item_code || record.supply_item?.supply_code || '-',
          record.supply_item?.order_item_description || record.supply_item?.supply_name || '-',
          record.supply_item?.usage?.patient_hn || '-',
          record.supply_item?.usage?.en || '-',
          record.qty_returned.toString(),
          this.getReturnReasonLabel(record.return_reason),
          new Date(record.return_datetime).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          record.return_note || '-',
        ];

        // Alternate row background with elegant contrast
        const isEvenRow = index % 2 === 0;
        if (isEvenRow) {
          doc.rect(35, yPos, pageWidth, itemHeight).fill('#F8F9FA');
        } else {
          doc.rect(35, yPos, pageWidth, itemHeight).fill('#FFFFFF');
        }
        
        doc.fontSize(8.5).font(finalFontName);
        xPos = 35;
        rowData.forEach((dataText, i) => {
          doc.rect(xPos, yPos, colWidths[i], itemHeight).stroke('#E0E0E0');
          doc.fillColor('#333333');
          
          doc.text(dataText, xPos + cellPadding, yPos + 6, { 
            width: colWidths[i] - cellPadding * 2, 
            align: i === 0 || i === 4 || i === 5 ? 'center' : 'left',
            lineBreak: false,
            ellipsis: true,
          });
          xPos += colWidths[i];
        });
        doc.fillColor('#000000');

        yPos += itemHeight;
      });

      // Footer with elegant decorative line
      const footerY = yPos + 15;
      doc.rect(35, footerY - 3, doc.page.width - 70, 2)
         .fill('#BDC3C7');
      
      doc.fontSize(8)
         .font(finalFontName)
         .fillColor('#7F8C8D')
         .text(`สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`, 35, footerY, { 
           align: 'center', 
           width: doc.page.width - 70 
         });

        doc.end();
        } catch (error) {
          console.error('[PDF Service] Error during PDF generation:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('[PDF Service] Error setting up PDF generation:', error);
      throw error;
    }
  }

  private getReturnReasonLabel(reason: string): string {
    const labels: { [key: string]: string } = {
      'UNWRAPPED_UNUSED': 'ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิม',
      'EXPIRED': 'อุปกรณ์หมดอายุ',
      'CONTAMINATED': 'อุปกรณ์มีการปนเปื้อน',
      'DAMAGED': 'อุปกรณ์ชำรุด',
    };
    return labels[reason] || reason;
  }
}
