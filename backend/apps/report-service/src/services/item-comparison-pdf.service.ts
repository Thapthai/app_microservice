import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { ItemComparisonReportData } from '../types/item-comparison-report.types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ItemComparisonPdfService {
  /**
   * Not using Arial - using Thai fonts from project only
   */
  private async registerArialFont(doc: PDFKit.PDFDocument): Promise<boolean> {
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
        // Development: from source (apps/report-service/src/services/ -> apps/report-service/assets/fonts/)
        path.join(__dirname, '../../assets/fonts'),
        // Development: from dist (dist/apps/report-service/ -> apps/report-service/assets/fonts/)
        path.join(__dirname, '../../../apps/report-service/assets/fonts'),
        // Production (Docker): /app/dist/apps/report-service/ -> /app/apps/report-service/assets/fonts/
        path.join(__dirname, '../../apps/report-service/assets/fonts'),
        // Using process.cwd() as base
        path.join(process.cwd(), 'apps/report-service/assets/fonts'),
        // Absolute path for development
        '/Users/night/Desktop/POSE/app_microservice/backend/apps/report-service/assets/fonts',
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
        console.error(`[PDF Service] ❌ Thai font not found in any of the expected paths`);
        console.error(`[PDF Service] Tried paths:`, possiblePaths);
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

  async generateReport(data: ItemComparisonReportData): Promise<Buffer> {
    try {
      // Validate data
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

      const doc = new PDFDocument({ 
        size: 'A4',
        layout: 'portrait',
        margin: 35,
      });

      const chunks: Buffer[] = [];

      // Register Thai font from project assets
      let finalFontName = 'ThaiFont';
      let finalFontBoldName = 'ThaiFontBold';
      
      const hasThaiFont = await this.registerThaiFont(doc);
      if (!hasThaiFont) {
        throw new Error('Thai font not found in project assets. Please ensure THSarabunNew.ttf exists in apps/report-service/assets/fonts/');
      }
      

      return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error) => {
          console.error('[PDF Service] PDF generation error:', error);
          reject(error);
        });

        try {
          // Header - Clean design
          const headerTop = 40;
          doc.fontSize(20)
             .font(finalFontBoldName)
             .fillColor('#2C3E50')
             .text('รายงานเปรียบเทียบการเบิกอุปกรณ์', 35, headerTop, { 
               align: 'center', 
               width: doc.page.width - 70 
             })
             .fontSize(17)
             .text('และการบันทึกใช้กับคนไข้', 35, headerTop + 22, { 
               align: 'center', 
               width: doc.page.width - 70 
             });
          
          doc.fillColor('#000000');
          doc.y = headerTop + 50;

          // Filter Info Box - Clean design
          const filterBoxY = doc.y;
          const filterBoxPadding = 10;
          const filterHeaderHeight = 20;
          const filterBoxHeight = data.filters.itemCode ? 80 : 60;
          
          doc.rect(35, filterBoxY, doc.page.width - 70, filterBoxHeight)
             .fillAndStroke('#F8F9FA', '#E0E0E0');
          
          // Filter Info Header
          doc.rect(35, filterBoxY, doc.page.width - 70, filterHeaderHeight)
             .fill('#F0F0F0');
          
          doc.fontSize(12)
             .font(finalFontBoldName)
             .fillColor('#2C3E50')
             .text('ข้อมูลการกรอง', 35 + filterBoxPadding, filterBoxY + 5);
          
          // Filter details
          doc.fontSize(10)
             .font(finalFontName)
             .fillColor('#333333');
          
          const leftColX = 35 + filterBoxPadding;
          const rightColX = doc.page.width / 2 + 5;
          const lineHeight = 15;
          let currentY = filterBoxY + filterHeaderHeight + 8;
          const labelWidth = 70;
          
          // Date range
          doc.font(finalFontBoldName)
             .fillColor('#2C3E50')
             .text('ช่วงเวลา:', leftColX, currentY);
          doc.font(finalFontName)
             .fillColor('#333333')
             .text(
               data.filters.startDate && data.filters.endDate 
                 ? `${data.filters.startDate} - ${data.filters.endDate}` 
                 : 'ทั้งหมด',
               leftColX + labelWidth, 
               currentY
             );
          
          if (data.filters.itemCode) {
            doc.font(finalFontBoldName)
               .fillColor('#2C3E50')
               .text('รหัส:', leftColX, currentY + lineHeight);
            doc.font(finalFontName)
               .fillColor('#333333')
               .text(data.filters.itemCode, leftColX + labelWidth, currentY + lineHeight);
          }
          
          if (data.filters.departmentCode) {
            doc.font(finalFontBoldName)
               .fillColor('#2C3E50')
               .text('แผนก:', rightColX, currentY);
            doc.font(finalFontName)
               .fillColor('#333333')
               .text(data.filters.departmentCode, rightColX + labelWidth, currentY);
          }
          
          doc.y = filterBoxY + filterBoxHeight + 15;

          // Table Header - consistent spacing
          const startY = doc.y;
          const tableTop = startY + 2;
          const itemHeight = 22;
          const pageWidth = doc.page.width - 70;
          
          // Column widths for portrait layout
          const colWidths = [
            35,   // No.
            70,   // Code
            155,  // Name
            50,   // Dispensed
            50,   // Used
            50,   // Difference
            65,   // Status
            50    // Match
          ];
          
          const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
          if (Math.abs(totalWidth - pageWidth) > 10) {
            const diff = pageWidth - totalWidth;
            colWidths[2] += diff;
          }
          
          const headers = ['ลำดับ', 'รหัส', 'รายการ', 'เบิก', 'ใช้', 'ต่าง', 'สถานะ', 'ตรงกัน'];

          // Draw table header
          const cellPadding = 3;
          doc.fontSize(9).font(finalFontBoldName);
          let xPos = 35;
          headers.forEach((header, i) => {
            doc.rect(xPos, tableTop, colWidths[i], itemHeight)
               .fillAndStroke('#E8E8E8', '#CCCCCC');
            doc.fillColor('#2C3E50')
               .text(header, xPos + cellPadding, tableTop + 6, { 
                 width: colWidths[i] - cellPadding * 2, 
                 align: 'center' 
               });
            xPos += colWidths[i];
          });
          doc.fillColor('#000000');

          // Draw table rows
          let yPos = tableTop + itemHeight;
          let matchCount = 0;
          let notMatchCount = 0;

          comparisonData.forEach((item, index) => {
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
                   .text(header, xPosHeader + cellPadding, 35 + 6, { 
                     width: colWidths[i] - cellPadding * 2, 
                     align: 'center' 
                   });
                xPosHeader += colWidths[i];
              });
              doc.fillColor('#000000');
              yPos = 35 + itemHeight;
            }

            const isMatch = item.status === 'MATCHED';
            if (isMatch) matchCount++;
            else notMatchCount++;

            // Safe string operations
            const itemName = item.itemname || '-';
            const displayName = itemName.length > 35 ? itemName.substring(0, 32) + '...' : itemName;
            const statusText = this.getStatusText(item.status || 'UNKNOWN');
            const displayStatus = statusText.length > 12 ? statusText.substring(0, 10) + '..' : statusText;

            const rowData = [
              (index + 1).toString(),
              item.itemcode || '-',
              displayName,
              (item.total_dispensed || 0).toString(),
              (item.total_used || 0).toString(),
              (item.difference || 0).toString(),
              displayStatus,
              isMatch ? 'Match' : 'Not Match',
            ];

            // Alternate row background
            const isEvenRow = index % 2 === 0;
            if (isEvenRow) {
              doc.rect(35, yPos, pageWidth, itemHeight).fill('#F8F9FA');
            } else {
              doc.rect(35, yPos, pageWidth, itemHeight).fill('#FFFFFF');
            }
            
            doc.fontSize(8.5).font(finalFontName);
            xPos = 35;
            rowData.forEach((dataText, i) => {
              // Set background color for match column
              if (i === 7) {
                if (isMatch) {
                  doc.rect(xPos, yPos, colWidths[i], itemHeight).fillAndStroke('#D4EDDA', '#C3E6CB');
                  doc.fillColor('#155724');
                } else {
                  doc.rect(xPos, yPos, colWidths[i], itemHeight).fillAndStroke('#F8D7DA', '#F5C6CB');
                  doc.fillColor('#721C24');
                }
              } else {
                doc.rect(xPos, yPos, colWidths[i], itemHeight).stroke('#E0E0E0');
                doc.fillColor('#333333');
              }
              
              doc.text(dataText, xPos + cellPadding, yPos + 6, { 
                width: colWidths[i] - cellPadding * 2, 
                align: i === 0 || i >= 3 ? 'center' : 'left',
                lineBreak: false,
                ellipsis: true,
              });
              xPos += colWidths[i];
            });
            doc.fillColor('#000000');
            yPos += itemHeight;
          });

          // Summary Box
          doc.y = yPos + 15;
          const summaryBoxY = doc.y;
          const summaryBoxPadding = 12;
          const summaryBoxHeight = 70;
          
          doc.rect(35, summaryBoxY, doc.page.width - 70, summaryBoxHeight)
             .fillAndStroke('#FFFBEA', '#F0E68C');
          
          doc.fontSize(13)
             .font(finalFontBoldName)
             .fillColor('#856404')
             .text('สรุปผลการตรวจสอบ', 35 + summaryBoxPadding, summaryBoxY + 10);
          
          const summaryY = summaryBoxY + 32;
          const summaryLineHeight = 18;
          
          doc.fontSize(11)
             .font(finalFontBoldName)
             .fillColor('#333333')
             .text('รายการทั้งหมด:', 35 + summaryBoxPadding, summaryY);
          doc.font(finalFontName)
             .text(`${summary.total_items} รายการ`, 35 + summaryBoxPadding + 100, summaryY);
          
          doc.font(finalFontBoldName)
             .fillColor('#155724')
             .text('ถูกต้อง:', 35 + summaryBoxPadding + 220, summaryY);
          doc.font(finalFontName)
             .text(`${matchCount} รายการ`, 35 + summaryBoxPadding + 270, summaryY);
          
          doc.font(finalFontBoldName)
             .fillColor('#721C24')
             .text('ไม่ถูกต้อง:', 35 + summaryBoxPadding, summaryY + summaryLineHeight);
          doc.font(finalFontName)
             .text(`${notMatchCount} รายการ`, 35 + summaryBoxPadding + 100, summaryY + summaryLineHeight);

          // Footer
          doc.fontSize(9)
             .font(finalFontName)
             .fillColor('#999999')
             .text(
               `สร้างรายงานเมื่อ: ${new Date().toLocaleString('th-TH', {
                 year: 'numeric',
                 month: 'long',
                 day: 'numeric',
                 hour: '2-digit',
                 minute: '2-digit',
                 second: '2-digit'
               })}`,
               35,
               doc.page.height - 50,
               { align: 'center', width: doc.page.width - 70 }
             );

          doc.end();
        } catch (error) {
          console.error('[PDF Service] Error generating report:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('[PDF Service] Error in generateReport:', error);
      throw error;
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'MATCHED':
        return 'ตรงกัน';
      case 'DISPENSED_NOT_USED':
        return 'เบิกไม่ใช้';
      case 'USED_WITHOUT_DISPENSE':
        return 'ใช้ไม่เบิก';
      case 'DISPENSE_EXCEEDS_USAGE':
        return 'เบิกมากกว่า';
      case 'USAGE_EXCEEDS_DISPENSE':
        return 'ใช้มากกว่า';
      case 'UNKNOWN':
        return 'ไม่ทราบ';
      default:
        return status || '-';
    }
  }
}
