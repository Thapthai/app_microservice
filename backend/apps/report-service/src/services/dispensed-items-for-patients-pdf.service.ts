import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { DispensedItemsForPatientsReportData } from './dispensed-items-for-patients-excel.service';
import { ReportConfig } from '../config/report.config';
import { resolveReportLogoPath } from '../config/report.config';

function formatReportDateTime(value?: string) {
  if (!value) return '-';
  const base = new Date(value);
  const corrected =
    typeof value === 'string' && value.endsWith('Z')
      ? new Date(base.getTime() - 7 * 60 * 60 * 1000)
      : base;
  return corrected.toLocaleString(ReportConfig.locale, {
    timeZone: ReportConfig.timezone,
    ...ReportConfig.dateFormat.datetime,
  });
}

@Injectable()
export class DispensedItemsForPatientsPdfService {
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

  async generateReport(data: DispensedItemsForPatientsReportData): Promise<Buffer> {
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

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        const margin = 35;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const contentWidth = pageWidth - margin * 2;
        const summary = data.summary ?? { total_records: 0, total_qty: 0, total_patients: 0 };
        const usages = data.data ?? [];

        // ---- Header block with logo (เหมือน dispensed-items-pdf) ----
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
        doc.text('รายการเบิกอุปกรณ์ใช้กับคนไข้', margin, headerTop + 6, {
          width: contentWidth,
          align: 'center',
        });
        doc.fontSize(9).font(finalFontName).fillColor('#6C757D');
        doc.text('Dispensed Items for Patients Report', margin, headerTop + 22, {
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

        const itemHeight = 20;
        const cellPadding = 3;
        const totalTableWidth = contentWidth;
        const colPct = [0.05, 0.09, 0.16, 0.10, 0.10, 0.11, 0.18, 0.07, 0.10];
        const colWidths = colPct.map((p) => Math.floor(totalTableWidth * p));
        let sumW = colWidths.reduce((a, b) => a + b, 0);
        if (sumW < totalTableWidth) {
          const diff = totalTableWidth - sumW;
          colWidths[6] += Math.floor(diff * 0.5);
          colWidths[2] += diff - Math.floor(diff * 0.5);
        }
        const headers = ['ลำดับ', 'HN', 'ชื่อคนไข้', 'EN', 'แผนก', 'รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'จำนวน', 'วันที่เบิก'];

        const drawTableHeader = (y: number) => {
          let x = margin;
          doc.fontSize(8).font(finalFontBoldName);
          doc.rect(margin, y, totalTableWidth, itemHeight).fillAndStroke('#1A365D', '#1A365D');
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
        if (usages.length === 0) {
          const rowY = doc.y;
          doc.rect(margin, rowY, totalTableWidth, itemHeight).fillAndStroke('#F8F9FA', '#DEE2E6');
          doc.text('ไม่มีข้อมูล', margin + cellPadding, rowY + 6, {
            width: totalTableWidth - cellPadding * 2,
            align: 'center',
          });
          doc.y = rowY + itemHeight;
        } else {
          usages.forEach((usage, idx) => {
            const items = usage.supply_items ?? [];
            const totalQty = items.reduce((s, i) => s + i.qty, 0);

            const drawRow = (cellTexts: string[], bg: string) => {
              if (doc.y + itemHeight > pageHeight - 35) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin: 35 });
                doc.y = margin;
                const newHeaderY = doc.y;
                drawTableHeader(newHeaderY);
                doc.y = newHeaderY + itemHeight;
              }
              const rowY = doc.y;
              let xPos = margin;
              for (let i = 0; i < 9; i++) {
                const cw = colWidths[i];
                const w = Math.max(4, cw - cellPadding * 2);
                doc.rect(xPos, rowY, cw, itemHeight).fillAndStroke(bg, '#DEE2E6');
                doc.fillColor('#000000');
                doc.text(cellTexts[i] ?? '-', xPos + cellPadding, rowY + 6, {
                  width: w,
                  align: i === 2 || i === 6 ? 'left' : 'center',
                });
                xPos += cw;
              }
              doc.y = rowY + itemHeight;
            };

            const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
            const mainCellTexts = [
              String(usage.seq ?? idx + 1),
              (usage.patient_hn ?? '-').toString().substring(0, 12),
              (usage.patient_name ?? '-').toString().substring(0, 22),
              (usage.en ?? '-').toString().substring(0, 14),
              (usage.department_code ?? '-').toString().substring(0, 12),
              items.length > 0 ? `รายการ ${items.length} รายการ` : '-',
              '',
              String(totalQty),
              formatReportDateTime(usage.dispensed_date).substring(0, 16),
            ];
            drawRow(mainCellTexts, bg);

            items.forEach((item) => {
              const subCellTexts = [
                '',
                '',
                '',
                '',
                '',
                ('└ ' + (item.itemcode ?? '-')).substring(0, 14),
                (item.itemname ?? '-').toString().substring(0, 24),
                String(item.qty ?? 0),
                '',
              ];
              drawRow(subCellTexts, '#F0F8FF');
            });
          });
        }

        doc.y += 6;

        // // ---- สรุปผล (หลังตาราง) ----
        // doc.rect(margin, doc.y, contentWidth, 50).fillAndStroke('#E9ECEF', '#DEE2E6');
        // doc.fontSize(10).font(finalFontBoldName).fillColor('#1A365D');
        // doc.text('สรุปผล', margin + 8, doc.y + 4);
        // doc.fontSize(9).font(finalFontName).fillColor('#000000');
        // doc
        //   .text(`จำนวนรายการทั้งหมด: ${summary.total_records}`, margin + 8, doc.y + 14)
        //   .text(`จำนวนคนไข้: ${summary.total_patients}`, margin + 8, doc.y + 26)
        //   .text(`จำนวนรวม: ${summary.total_qty}`, margin + 8, doc.y + 38);
        // doc.y += 52;

        // // ---- เงื่อนไขการค้นหา (หลังตาราง) ----
        // const filters = data.filters ?? {};
        // if (filters.keyword || filters.patientHn || filters.departmentCode || filters.startDate || filters.endDate) {
        //   let filterHeight = 20;
        //   if (filters.keyword) filterHeight += 14;
        //   if (filters.patientHn) filterHeight += 14;
        //   if (filters.departmentCode) filterHeight += 14;
        //   if (filters.startDate || filters.endDate) filterHeight += 14;
        //   doc.rect(margin, doc.y, contentWidth, filterHeight).fillAndStroke('#E9ECEF', '#DEE2E6');
        //   doc.fontSize(10).font(finalFontBoldName).fillColor('#1A365D');
        //   doc.text('เงื่อนไขการค้นหา', margin + 8, doc.y + 4);
        //   doc.fontSize(9).font(finalFontName).fillColor('#000000');
        //   let filterY = doc.y + 14;
        //   if (filters.keyword) {
        //     doc.text(`คำค้นหา: ${filters.keyword}`, margin + 8, filterY);
        //     filterY += 14;
        //   }
        //   if (filters.patientHn) {
        //     doc.text(`HN: ${filters.patientHn}`, margin + 8, filterY);
        //     filterY += 14;
        //   }
        //   if (filters.departmentCode) {
        //     doc.text(`แผนก: ${filters.departmentCode}`, margin + 8, filterY);
        //     filterY += 14;
        //   }
        //   if (filters.startDate || filters.endDate) {
        //     doc.text(`วันที่: ${filters.startDate ?? ''} ถึง ${filters.endDate ?? ''}`, margin + 8, filterY);
        //   }
        //   doc.y += filterHeight + 4;
        // }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
