import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { ReturnToCabinetReportData } from './return-to-cabinet-report-excel.service';

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
          if (data.filters && (data.filters.itemCode || data.filters.itemTypeId || data.filters.startDate || data.filters.endDate)) {
            const filterBoxY = doc.y;
            const filterBoxPadding = 10;
            const filterHeaderHeight = 20;
            const filterBoxHeight = 60;
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
            if (data.filters.itemCode) {
              doc.text(`รหัสอุปกรณ์: ${data.filters.itemCode}`, 35 + filterBoxPadding, filterY);
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
          const summaryBoxHeight = 40;
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
             .fillColor('#000000')
             .text(`จำนวนรายการทั้งหมด: ${data.summary.total_records}`, 35 + summaryBoxPadding, summaryBoxY + summaryHeaderHeight + 5)
             .text(`จำนวนรวม: ${data.summary.total_qty}`, 35 + summaryBoxPadding, summaryBoxY + summaryHeaderHeight + 17);
          
          doc.y = summaryBoxY + summaryBoxHeight + 20;

          // Table
          const tableTop = doc.y;
          const itemHeight = 20;
          const cellPadding = 5;
          const headers = ['RowID', 'รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'วันที่แก้ไข', 'จำนวน', 'RFID Code', 'StockID'];
          const colWidths = [50, 80, 120, 80, 50, 100, 50];
          
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
              doc.addPage({ layout: 'portrait', margin: 35 });
              
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
              item.RowID?.toString() || '-',
              item.itemcode || '-',
              item.itemname || '-',
              item.modifyDate ? new Date(item.modifyDate).toLocaleDateString('th-TH') : '-',
              item.qty?.toString() || '0',
              item.RfidCode || '-',
              item.StockID?.toString() || '-',
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
