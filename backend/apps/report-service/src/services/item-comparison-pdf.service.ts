import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { ItemComparisonReportData } from '../types/item-comparison-report.types';
import { resolveReportLogoPath } from '../config/report.config';

@Injectable()
export class ItemComparisonPdfService {
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
      if (!basePath) return false;
      const regularFont = path.join(basePath, 'THSarabunNew.ttf');
      const boldFont = path.join(basePath, 'THSarabunNew Bold.ttf');
      doc.registerFont('ThaiFont', regularFont);
      doc.registerFont('ThaiFontBold', fs.existsSync(boldFont) ? boldFont : regularFont);
      return true;
    } catch {
      return false;
    }
  }

  private getLogoBuffer(): Buffer | null {
    const logoPath = resolveReportLogoPath();
    if (!logoPath || !fs.existsSync(logoPath)) return null;
    try {
      return fs.readFileSync(logoPath);
    } catch {
      return null;
    }
  }

  async generateReport(data: ItemComparisonReportData): Promise<Buffer> {
    if (!data || !data.comparison) {
      throw new Error('Invalid report data: comparison data is missing');
    }

    const comparisonData = Array.isArray(data.comparison) ? data.comparison : [];
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: 35,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    let finalFontName = 'Helvetica';
    let finalFontBoldName = 'Helvetica-Bold';
    try {
      const hasThai = await this.registerThaiFont(doc);
      if (hasThai) {
        finalFontName = 'ThaiFont';
        finalFontBoldName = 'ThaiFontBold';
      }
    } catch {
      // keep default
    }

    const logoBuffer = this.getLogoBuffer();
    const reportDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Bangkok',
    });

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        const margin = 35;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const contentWidth = pageWidth - margin * 2;
        const itemHeight = 20;
        const cellPadding = 3;

        // ---- Header block with logo (เหมือน dispensed-items-for-patients) ----
        const headerTop = 35;
        const headerHeight = 48;
        doc.save();
        doc.rect(margin, headerTop, contentWidth, headerHeight)
          .fillAndStroke('#F8F9FA', '#DEE2E6');
        doc.restore();

        if (logoBuffer && logoBuffer.length > 0) {
          try {
            doc.image(logoBuffer, margin + 8, headerTop + 6, { fit: [70, 36] });
          } catch {
            try {
              doc.image(logoBuffer, margin + 8, headerTop + 6, { width: 70 });
            } catch {
              // skip logo
            }
          }
        }

        doc.fontSize(14).font(finalFontBoldName).fillColor('#1A365D');
        doc.text('รายงานเปรียบเทียบการเบิกอุปกรณ์และการบันทึกใช้กับคนไข้', margin, headerTop + 6, {
          width: contentWidth,
          align: 'center',
        });
        doc.fontSize(9).font(finalFontName).fillColor('#6C757D');
        doc.text('Comparative Report on Dispensing and Patient Usage', margin, headerTop + 22, {
          width: contentWidth,
          align: 'center',
        });
        doc.fillColor('#000000');
        doc.y = headerTop + headerHeight + 14;

        // วันที่รายงาน
        doc.fontSize(9).font(finalFontName).fillColor('#6C757D');
        doc.text(`วันที่รายงาน: ${reportDate}`, margin, doc.y, {
          width: contentWidth,
          align: 'right',
        });
        doc.fillColor('#000000');
        doc.y += 4;

        // Table: 8 columns
        const colPct = [0.06, 0.12, 0.22, 0.12, 0.12, 0.12, 0.12, 0.10];
        const colWidths = colPct.map((p) => Math.floor(contentWidth * p));
        let sumW = colWidths.reduce((a, b) => a + b, 0);
        if (sumW < contentWidth) {
          colWidths[2] += contentWidth - sumW;
        }
        const headers = [
          'ลำดับ',
          'รหัสอุปกรณ์',
          'ชื่ออุปกรณ์',
          'จำนวนเบิก',
          'จำนวนใช้',
          'ส่วนต่าง',
          'สถานะ',
          'ผลตรวจสอบ',
        ];

        const drawTableHeader = (y: number) => {
          let x = margin;
          doc.fontSize(8).font(finalFontBoldName);
          doc.rect(margin, y, contentWidth, itemHeight).fillAndStroke('#1A365D', '#1A365D');
          doc.fillColor('#FFFFFF');
          headers.forEach((h, i) => {
            doc.text(h, x + cellPadding, y + 6, {
              width: Math.max(2, colWidths[i] - cellPadding * 2),
              align: 'center',
            });
            x += colWidths[i];
          });
          doc.fillColor('#000000');
        };

        const tableHeaderY = doc.y;
        drawTableHeader(tableHeaderY);
        doc.y = tableHeaderY + itemHeight;

        doc.fontSize(8).font(finalFontName).fillColor('#000000');
        if (comparisonData.length === 0) {
          const rowY = doc.y;
          doc.rect(margin, rowY, contentWidth, itemHeight).fillAndStroke('#F8F9FA', '#DEE2E6');
          doc.text('ไม่มีข้อมูล', margin + cellPadding, rowY + 6, {
            width: contentWidth - cellPadding * 2,
            align: 'center',
          });
          doc.y = rowY + itemHeight;
        } else {
          let rowIndex = 0;
          comparisonData.forEach((item) => {
            if (doc.y + itemHeight > pageHeight - 35) {
              doc.addPage({ size: 'A4', layout: 'portrait', margin: 35 });
              doc.y = margin;
              drawTableHeader(doc.y);
              doc.y += itemHeight;
            }

            const rowY = doc.y;
            const bg = rowIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
            const isMatch = item.status === 'MATCHED';
            let xPos = margin;
            const cellTexts = [
              String(rowIndex + 1),
              (item.itemcode ?? '-').toString().substring(0, 14),
              (item.itemname ?? '-').toString().substring(0, 28),
              item.total_dispensed != null ? String(item.total_dispensed) : '0',
              item.total_used != null ? String(item.total_used) : '0',
              item.difference != null ? String(item.difference) : '0',
              this.getStatusText(item.status || 'UNKNOWN').substring(0, 14),
              isMatch ? 'ตรงกัน' : 'ไม่ตรงกัน',
            ];
            for (let i = 0; i < 8; i++) {
              const cw = colWidths[i];
              const w = Math.max(4, cw - cellPadding * 2);
              let fillColor = bg;
              if (i === 5 && (item.difference ?? 0) !== 0) fillColor = '#FFF3CD';
              if (i === 7) fillColor = isMatch ? '#D4EDDA' : '#F8D7DA';
              doc.rect(xPos, rowY, cw, itemHeight).fillAndStroke(fillColor, '#DEE2E6');
              doc.fillColor(i === 7 ? (isMatch ? '#155724' : '#721C24') : '#000000');
              doc.text(cellTexts[i] ?? '-', xPos + cellPadding, rowY + 6, {
                width: w,
                align: i === 2 ? 'left' : 'center',
              });
              xPos += cw;
            }
            doc.fillColor('#000000');
            doc.y = rowY + itemHeight;
            rowIndex++;

            // Sub rows for usage items
            if (item.usageItems && Array.isArray(item.usageItems) && item.usageItems.length > 0) {
              item.usageItems.forEach((usage: any) => {
                if (doc.y + itemHeight > pageHeight - 35) {
                  doc.addPage({ size: 'A4', layout: 'portrait', margin: 35 });
                  doc.y = margin;
                  drawTableHeader(doc.y);
                  doc.y += itemHeight;
                }
                const subY = doc.y;
                xPos = margin;
                const subTexts = [
                  '└',
                  (usage.patient_hn ?? '-').toString().substring(0, 12),
                  (usage.patient_name ?? '-').toString().substring(0, 24),
                  '-',
                  (usage.qty_used ?? 0).toString(),
                  (usage.qty_returned ?? '-').toString(),
                  (usage.order_item_status ?? '-').toString().substring(0, 10),
                  '-',
                ];
                for (let i = 0; i < 8; i++) {
                  const cw = colWidths[i];
                  doc.rect(xPos, subY, cw, itemHeight).fillAndStroke('#F0F8FF', '#DEE2E6');
                  doc.fillColor('#000000');
                  doc.text(subTexts[i] ?? '-', xPos + cellPadding, subY + 6, {
                    width: Math.max(4, cw - cellPadding * 2),
                    align: i === 2 || i === 1 ? 'left' : 'center',
                  });
                  xPos += cw;
                }
                doc.y = subY + itemHeight;
              });
            }
          });
        }

        doc.y += 6;
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
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
