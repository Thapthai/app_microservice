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
  return base.toLocaleString(ReportConfig.locale, {
    timeZone: ReportConfig.timezone,
    ...ReportConfig.dateFormat.datetime,
  });
}

/** แปลงสถานะให้แสดงเหมือนเว็บ: discontinue→ยกเลิก, verified→ยืนยันแล้ว */
function getStatusLabel(status?: string): string {
  if (status == null || status === '') return '-';
  const lower = status.toLowerCase();
  if (lower === 'discontinue' || lower === 'discontinued') return 'ยกเลิก';
  if (lower === 'verified') return 'ยืนยันแล้ว';
  return status;
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
        // 9 columns: ลำดับ, HN/EN, ชื่อคนไข้, วันที่เบิก, รหัสอุปกรณ์, ชื่ออุปกรณ์, จำนวนอุปกรณ์, Assession No, สถานะ
        const colPct = [0.06, 0.12, 0.14, 0.12, 0.12, 0.18, 0.08, 0.10, 0.08];
        let colWidths = colPct.map((p) => Math.floor(totalTableWidth * p));
        let sumW = colWidths.reduce((a, b) => a + b, 0);
        if (sumW > totalTableWidth) {
          colWidths = colWidths.map((w) => Math.floor((w * totalTableWidth) / sumW));
          sumW = colWidths.reduce((a, b) => a + b, 0);
        }
        if (sumW < totalTableWidth) colWidths[5] += totalTableWidth - sumW;
        // หัวตาราง 9 คอลัมน์ (ให้ data ตรงกับ header) — ใช้ "จำนวนอุปกรณ์" เพื่อไม่ให้ล้นบรรทัด
        const headers = [
          'ลำดับ',                    // 0
          'HN / EN',                  // 1
          'ชื่อคนไข้',                // 2
          'วันที่เบิก',               // 3
          'รหัสอุปกรณ์',              // 4
          'ชื่ออุปกรณ์',               // 5
          'จำนวนอุปกรณ์',             // 6
          'Assession No',             // 7
          'สถานะ',                    // 8
        ];

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
            // นับเฉพาะอุปกรณ์ที่มีสถานะยืนยัน (Verified) — รายการยกเลิกไม่นำมาคิด
            const totalQty = items
              .filter((i) => (i.order_item_status ?? '').toLowerCase() === 'verified')
              .reduce((s, i) => s + i.qty, 0);

            const drawRow = (cellTexts: string[], bg: string, statusText?: string) => {
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
                // พื้นหลัง + สีตัวอักษรของสถานะ ให้เหมือน item-comparison-pdf.service.ts
                // - สถานะคอลัมน์ที่ 8: สีพื้นเขียว/แดงอ่อน + ตัวอักษรเขียว/แดงเข้ม
                let cellBg = bg;
                if (i === 8 && statusText) {
                  const statusLower = statusText.toLowerCase();
                  if (statusLower === 'ยืนยันแล้ว' || statusLower === 'verified') {
                    cellBg = '#D4EDDA'; // เขียวอ่อน (เหมือน success background)
                  } else if (
                    statusLower === 'ยกเลิก' ||
                    statusLower === 'discontinue' ||
                    statusLower === 'discontinued'
                  ) {
                    cellBg = '#F8D7DA'; // แดงอ่อน (เหมือน danger background)
                  }
                }
                doc.rect(xPos, rowY, cw, itemHeight).fillAndStroke(cellBg, '#DEE2E6');

                let textColor = '#000000';
                if (i === 8 && statusText) {
                  const statusLower = statusText.toLowerCase();
                  if (statusLower === 'ยืนยันแล้ว' || statusLower === 'verified') {
                    textColor = '#155724'; // เขียวเข้ม
                  } else if (
                    statusLower === 'ยกเลิก' ||
                    statusLower === 'discontinue' ||
                    statusLower === 'discontinued'
                  ) {
                    textColor = '#721C24'; // แดงเข้ม
                  }
                }
                doc.fillColor(textColor);
                doc.text(cellTexts[i] ?? '-', xPos + cellPadding, rowY + 6, {
                  width: w,
                  align: i === 2 || i === 5 ? 'left' : 'center',
                });
                xPos += cw;
              }
              doc.fillColor('#000000');
              doc.y = rowY + itemHeight;
            };

            const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
            const hnEn = `${usage.patient_hn ?? '-'} / ${usage.en ?? '-'}`;
            // Main row: ลำดับ, HN/EN, ชื่อคนไข้, วันที่เบิก, ว่าง, ว่าง, จำนวนอุปกรณ์ที่ถูกใช้งาน, ว่าง, ว่าง
            const mainCellTexts = [
              String(usage.seq ?? idx + 1),                            // 0 ลำดับ
              hnEn.substring(0, 18),                                    // 1 HN / EN
              (usage.patient_name ?? '-').toString().substring(0, 20),  // 2 ชื่อคนไข้
              formatReportDateTime(usage.dispensed_date).substring(0, 16), // 3 วันที่เบิก
              '',                                                       // 4 ว่าง (sub: รหัสอุปกรณ์)
              '',                                                       // 5 ว่าง (sub: ชื่ออุปกรณ์)
              String(totalQty),                                         // 6 จำนวนอุปกรณ์ที่ถูกใช้งาน
              '',                                                       // 7 ว่าง (sub: Assession No)
              '',                                                       // 8 ว่าง (sub: สถานะ)
            ];
            drawRow(mainCellTexts, bg);

            // Sub rows: ว่าง, ว่าง, ว่าง, ว่าง, รหัสอุปกรณ์, ชื่ออุปกรณ์, จำนวน, Assession No, สถานะ
            items.forEach((item) => {
              const statusLabel = getStatusLabel(item.order_item_status);
              const subCellTexts = [
                '',                                                       // 0 ว่าง (main: ลำดับ)
                '',                                                       // 1 ว่าง (main: HN/EN)
                '',                                                       // 2 ว่าง (main: ชื่อคนไข้)
                '',     
                //  '└ ' ใส่ใน PDF ไม่ได้                                                  // 3 ว่าง (main: วันที่เบิก)
                '- ' + (item.itemcode ?? '-').toString().substring(0, 24),     // 4 รหัสอุปกรณ์
                (item.itemname ?? '-').toString().substring(0, 22),     // 5 ชื่ออุปกรณ์
                item.uom ? `${item.qty ?? 0} ${item.uom}` : String(item.qty ?? 0), // 6 จำนวน (หน่วย)
                (item.assession_no ?? '-').toString().substring(0, 12), // 7 Assession No
                statusLabel,                                             // 8 สถานะ
              ];
              drawRow(subCellTexts, '#F0F8FF', statusLabel);
            });
          });
        }

        doc.y += 6;


        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
