import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { CabinetStockReportData } from './cabinet-stock-report-excel.service';
import { resolveReportLogoPath } from '../config/report.config';

@Injectable()
export class CabinetStockReportPdfService {
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

  async generateReport(data: CabinetStockReportData): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: 40,
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
        const margin = 40;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const contentWidth = pageWidth - margin * 2;
        const summary = data?.summary ?? { total_rows: 0, total_qty: 0, total_refill_qty: 0 };
        const rows = data?.data && Array.isArray(data.data) ? data.data : [];

        // ---- Header block with logo ----
        const headerTop = 35;
        const headerHeight = 48;
        doc.rect(margin, headerTop, contentWidth, headerHeight)
          .fillAndStroke('#F8F9FA', '#DEE2E6');

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
        doc.text('รายงานต๊อกอุปกรณ์ในตู้', margin, headerTop + 6, {
          width: contentWidth,
          align: 'center',
        });
        doc.fontSize(9).font(finalFontName).fillColor('#6C757D');
        doc.text('Cabinet Stock Report', margin, headerTop + 22, {
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

        const itemHeight = 18;
        const cellPadding = 4;
        const totalTableWidth = contentWidth;
        const colPct = [0.07, 0.14, 0.12, 0.26, 0.10, 0.10, 0.10, 0.11];
        const colWidths = colPct.map((p) => Math.floor(totalTableWidth * p));
        let sumW = colWidths.reduce((a, b) => a + b, 0);
        if (sumW < totalTableWidth) colWidths[3] += totalTableWidth - sumW;
        const headers = ['ลำดับ', 'แผนก', 'รหัสอุปกรณ์', 'อุปกรณ์', 'คงเหลือ', 'Stock Max', 'Stock Min', 'จำนวนที่ต้องเติม'];

        const drawTableHeader = (y: number) => {
          let x = margin;
          doc.fontSize(7).font(finalFontBoldName);
          doc.rect(margin, y, totalTableWidth, itemHeight).fillAndStroke('#1A365D', '#1A365D');
          doc.fillColor('#FFFFFF');
          headers.forEach((h, i) => {
            doc.text(h, x + cellPadding, y + 5, {
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

        doc.fontSize(7).font(finalFontName).fillColor('#000000');
        if (rows.length === 0) {
          const rowY = doc.y;
          doc.rect(margin, rowY, totalTableWidth, itemHeight).fillAndStroke('#F8F9FA', '#DEE2E6');
          doc.text('ไม่มีข้อมูล', margin + cellPadding, rowY + 5, {
            width: totalTableWidth - cellPadding * 2,
            align: 'center',
          });
          doc.y = rowY + itemHeight;
        } else {
          for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            if (doc.y + itemHeight > pageHeight - 35) {
              doc.addPage({ size: 'A4', layout: 'portrait', margin: 40 });
              doc.y = margin;
              const newHeaderY = doc.y;
              drawTableHeader(newHeaderY);
              doc.y = newHeaderY + itemHeight;
            }

            const rowY = doc.y;
            const hasRefill = ((row as { refill_qty?: number }).refill_qty ?? 0) > 0;
            const bg = hasRefill ? '#F8D7D7' : (idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA');
            let xPos = margin;
            const seq = row.seq ?? idx + 1;
            const dept = (row as { department_name?: string }).department_name ?? '-';
            const code = (row as { item_code?: string }).item_code ?? '-';
            const name = (row as { item_name?: string }).item_name ?? '-';
            const bal = (row as { balance_qty?: number }).balance_qty ?? 0;
            const smax = (row as { stock_max?: number | null }).stock_max;
            const smin = (row as { stock_min?: number | null }).stock_min;
            const refill = (row as { refill_qty?: number }).refill_qty ?? 0;
            const cellTexts = [
              String(seq),
              String(dept).substring(0, 18),
              String(code).substring(0, 14),
              String(name).substring(0, 28),
              String(bal),
              smax != null ? String(smax) : '-',
              smin != null ? String(smin) : '-',
              String(refill),
            ];
            for (let i = 0; i < 8; i++) {
              const cw = colWidths[i];
              const w = Math.max(4, cw - cellPadding * 2);
              doc.rect(xPos, rowY, cw, itemHeight).fillAndStroke(bg, '#DEE2E6');
              doc.fillColor('#000000');
              doc.text(cellTexts[i] ?? '-', xPos + cellPadding, rowY + 5, {
                width: w,
                align: i === 1 || i === 2 || i === 3 ? 'left' : 'center',
              });
              xPos += cw;
            }
            doc.y = rowY + itemHeight;
          }
        }

        // doc.y += 3;

        // // ---- สรุปผล (แสดงหลังตารางข้อมูล) ----
        // doc.rect(margin, doc.y, contentWidth, 48).fillAndStroke('#E9ECEF', '#DEE2E6');
        // doc.fontSize(10).font(finalFontBoldName).fillColor('#1A365D');
        // doc.text('สรุปผล', margin + 8, doc.y );
        // doc.fontSize(9).font(finalFontName).fillColor('#000000');
        // doc
        //   .text(`จำนวนรายการ: ${summary.total_rows}`, margin + 8, doc.y)
        //   .text(`จำนวนรวม (ชิ้น): ${summary.total_qty}`, margin + 8, doc.y)
        //   .text(`จำนวนรวมที่ต้องเติม: ${summary.total_refill_qty}`, margin + 8, doc.y);
        // doc.y += 46;

        // // ---- เงื่อนไขการค้นหา (แสดงหลังตาราง) ----
        // const filters = data?.filters ?? {};
        // if (filters.cabinetId != null || filters.cabinetCode) {
        //   doc.rect(margin, doc.y, contentWidth, 20).fillAndStroke('#E9ECEF', '#DEE2E6');
        //   doc.fontSize(10).font(finalFontBoldName).fillColor('#1A365D');
        //   doc.text('เงื่อนไขการค้นหา', margin + 8, doc.y + 4);
        //   doc.fillColor('#000000');
        //   doc.fontSize(9).font(finalFontName);
        //   doc.text(
        //     `ตู้ที่เลือก: ${filters.cabinetId != null ? `ID ${filters.cabinetId}` : filters.cabinetCode ?? '-'}`,
        //     margin + 8,
        //     doc.y + 12
        //   );
        //   doc.y += 22;
        // }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
