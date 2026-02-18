import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { ReturnReportData } from './return-report-excel.service';
import { resolveReportLogoPath } from '../config/report.config';

export { ReturnReportData };

@Injectable()
export class ReturnReportPdfService {
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

  async generateReport(data: ReturnReportData): Promise<Buffer> {
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data structure: data.data must be an array');
    }

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

    const margin = 35;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - margin * 2;
    const itemHeight = 20;
    const cellPadding = 3;

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        // ---- Header block with logo (เหมือน item-comparison-pdf) ----
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
        doc.text('รายงานอุปกรณ์ที่ไม่ถูกใช้งาน', margin, headerTop + 6, {
          width: contentWidth,
          align: 'center',
        });
        doc.fontSize(9).font(finalFontName).fillColor('#6C757D');
        doc.text('Return Report', margin, headerTop + 22, {
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

        // เงื่อนไข + สรุป (หนึ่งบรรทัด)
        if (
          data.filters &&
          (data.filters.date_from || data.filters.date_to || data.filters.return_reason)
        ) {
          const parts: string[] = [];
          if (data.filters.date_from || data.filters.date_to) {
            parts.push(
              `วันที่: ${data.filters.date_from || ''} ถึง ${data.filters.date_to || ''}`,
            );
          }
          if (data.filters.return_reason) {
            parts.push(`สาเหตุ: ${this.getReturnReasonLabel(data.filters.return_reason)}`);
          }
          parts.push(
            `สรุป: ${data.summary.total_records} รายการ, ${data.summary.total_qty_returned} ชิ้น`,
          );
          doc.fontSize(9).font(finalFontName).fillColor('#495057');
          doc.text(parts.join(' | '), margin, doc.y, {
            width: contentWidth,
            align: 'left',
          });
          doc.fillColor('#000000');
          doc.y += 18;
        }

        // Table: 9 columns (ลำดับ, รหัส, ชื่อ, ตู้, ชื่อผู้เติม, จำนวน, สาเหตุ, วันที่, หมายเหตุ)
        const colPct = [0.05, 0.10, 0.18, 0.14, 0.12, 0.07, 0.14, 0.09, 0.11];
        const colWidths = colPct.map((p) => Math.floor(contentWidth * p));
        let sumW = colWidths.reduce((a, b) => a + b, 0);
        if (sumW < contentWidth) {
          colWidths[2] += contentWidth - sumW;
        }
        const headers = [
          'ลำดับ',
          'รหัสอุปกรณ์',
          'ชื่ออุปกรณ์',
          'ตู้',
          'ชื่อผู้เติม',
          'จำนวน',
          'สาเหตุ',
          'วันที่',
          'หมายเหตุ',
        ];

        const drawTableHeader = (y: number) => {
          doc.fontSize(8).font(finalFontBoldName);
          doc.rect(margin, y, contentWidth, itemHeight).fillAndStroke('#1A365D', '#1A365D');
          doc.fillColor('#FFFFFF');
          let x = margin;
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

        if (data.data.length === 0) {
          const rowY = doc.y;
          doc.rect(margin, rowY, contentWidth, itemHeight).fillAndStroke('#F8F9FA', '#DEE2E6');
          doc.text('ไม่มีข้อมูล', margin + cellPadding, rowY + 6, {
            width: contentWidth - cellPadding * 2,
            align: 'center',
          });
          doc.y = rowY + itemHeight;
        } else {
          data.data.forEach((record, index) => {
            if (doc.y + itemHeight > pageHeight - 35) {
              doc.addPage({ size: 'A4', layout: 'portrait', margin: 35 });
              doc.y = margin;
              drawTableHeader(doc.y);
              doc.y += itemHeight;
            }

            const rowY = doc.y;
            const bg = index % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
            const itemCode =
              record.supply_item?.order_item_code || record.supply_item?.supply_code || '-';
            const itemName =
              record.supply_item?.order_item_description ||
              record.supply_item?.supply_name ||
              '-';
            const cabinetDisplay =
              [record.cabinet_name || record.cabinet_code, record.department_name].filter(Boolean).join(' / ') || '-';
            const returnByName = record.return_by_user_name ?? 'ไม่ระบุ';
            const returnDate =
              record.return_datetime instanceof Date
                ? record.return_datetime.toLocaleDateString('th-TH')
                : new Date(record.return_datetime).toLocaleDateString('th-TH');

            const cellTexts = [
              String(index + 1),
              String(itemCode).substring(0, 20),
              String(itemName).substring(0, 20),
              String(cabinetDisplay).substring(0, 18),
              String(returnByName).substring(0, 12),
              String(record.qty_returned),
              this.getReturnReasonLabel(record.return_reason).substring(0, 28),
              returnDate,
              (record.return_note || '-').substring(0, 12),
            ];

            let xPos = margin;
            for (let i = 0; i < 9; i++) {
              const cw = colWidths[i] ?? 0;
              const w = Math.max(4, cw - cellPadding * 2);
              doc.rect(xPos, rowY, cw, itemHeight).fillAndStroke(bg, '#DEE2E6');
              doc.fillColor('#333333');
              doc.text(cellTexts[i] ?? '-', xPos + cellPadding, rowY + 6, {
                width: w,
                align: i === 1 || i === 2 || i === 3 || i === 4 || i === 8 ? 'left' : 'center',
              });
              xPos += cw;
            }
            doc.fillColor('#000000');
            doc.y = rowY + itemHeight;
          });
        }

        doc.y += 6;
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
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
