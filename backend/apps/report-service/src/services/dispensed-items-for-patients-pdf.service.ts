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
        doc.y += 6;

        // ---- ตาราง Filter Summary (1 แถว) ----
        const filters = data.filters ?? {};
        const filterRowHeight = 22;
        const filterY = doc.y;

        // format วันที่
        const fmtDate = (d?: string) => {
          if (!d) return '-';
          try {
            return new Date(d).toLocaleDateString('th-TH', {
              year: 'numeric', month: 'short', day: 'numeric',
              timeZone: 'Asia/Bangkok',
            });
          } catch { return d; }
        };

        const filterCells = [
          { label: 'วันที่เริ่มต้น', value: fmtDate(filters.startDate) },
          { label: 'วันที่สิ้นสุด', value: fmtDate(filters.endDate) },
          { label: 'แผนก', value: (filters as any).departmentName || filters.departmentCode || 'ทั้งหมด' },
          { label: 'ประเภทผู้ป่วย', value: filters.usageType === 'OPD' ? 'ผู้ป่วยนอก (OPD)' : filters.usageType === 'IPD' ? 'ผู้ป่วยใน (IPD)' : 'ทั้งหมด' },
          { label: 'คำค้นหา', value: filters.keyword || '-' },
        ];

        const filterColWidth = Math.floor(contentWidth / filterCells.length);
        let fx = margin;
        // แถว header
        filterCells.forEach((fc, i) => {
          const cw = i === filterCells.length - 1
            ? contentWidth - filterColWidth * (filterCells.length - 1)
            : filterColWidth;
          doc.rect(fx, filterY, cw, filterRowHeight).fillAndStroke('#E8EDF2', '#DEE2E6');
          doc.fontSize(6).font(finalFontBoldName).fillColor('#444444');
          doc.text(fc.label, fx + 3, filterY + 4, { width: cw - 6, align: 'center' });
          doc.fontSize(7).font(finalFontName).fillColor('#000000');
          doc.text(fc.value, fx + 3, filterY + 13, { width: cw - 6, align: 'center' });
          fx += cw;
        });
        doc.y = filterY + filterRowHeight + 6;

        const itemHeight = 20;
        const cellPadding = 3;
        const totalTableWidth = contentWidth;
        // 11 columns สำหรับ portrait A4 (content width ~525pt)
        // ลำดับ, HN/EN, ชื่อคนไข้, แผนก(-), ประเภท, วันที่เบิก(-), รหัส, ชื่ออุปกรณ์, จำนวน(+), Assession, สถานะ
        const colPct = [0.04, 0.10, 0.13, 0.09, 0.07, 0.09, 0.09, 0.15, 0.11, 0.07, 0.06];
        let colWidths = colPct.map((p) => Math.floor(totalTableWidth * p));
        let sumW = colWidths.reduce((a, b) => a + b, 0);
        if (sumW > totalTableWidth) {
          colWidths = colWidths.map((w) => Math.floor((w * totalTableWidth) / sumW));
          sumW = colWidths.reduce((a, b) => a + b, 0);
        }
        if (sumW < totalTableWidth) colWidths[7] += totalTableWidth - sumW;
        // หัวตาราง 11 คอลัมน์
        const headers = [
          'ลำดับ',         // 0
          'HN / EN',       // 1
          'ชื่อคนไข้',     // 2
          'แผนก',          // 3 (new)
          'ประเภท',        // 4 (new)
          'วันที่เบิก',    // 5
          'รหัสอุปกรณ์',   // 6
          'ชื่ออุปกรณ์',   // 7
          'จำนวนอุปกรณ์',  // 8
          'Assession No',  // 9
          'สถานะ',         // 10
        ];

        const drawTableHeader = (y: number) => {
          let x = margin;
          doc.fontSize(7).font(finalFontBoldName);
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

        doc.fontSize(7).font(finalFontName).fillColor('#000000');
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
              for (let i = 0; i < 11; i++) {
                const cw = colWidths[i];
                const w = Math.max(4, cw - cellPadding * 2);
                // สถานะคอลัมน์ที่ 10: สีพื้นเขียว/แดงอ่อน + ตัวอักษรเขียว/แดงเข้ม
                let cellBg = bg;
                if (i === 10 && statusText) {
                  const statusLower = statusText.toLowerCase();
                  if (statusLower === 'ยืนยันแล้ว' || statusLower === 'verified') {
                    cellBg = '#D4EDDA';
                  } else if (
                    statusLower === 'ยกเลิก' ||
                    statusLower === 'discontinue' ||
                    statusLower === 'discontinued'
                  ) {
                    cellBg = '#F8D7DA';
                  }
                }
                doc.rect(xPos, rowY, cw, itemHeight).fillAndStroke(cellBg, '#DEE2E6');

                let textColor = '#000000';
                if (i === 10 && statusText) {
                  const statusLower = statusText.toLowerCase();
                  if (statusLower === 'ยืนยันแล้ว' || statusLower === 'verified') {
                    textColor = '#155724';
                  } else if (
                    statusLower === 'ยกเลิก' ||
                    statusLower === 'discontinue' ||
                    statusLower === 'discontinued'
                  ) {
                    textColor = '#721C24';
                  }
                }
                doc.fillColor(textColor);
                doc.text(cellTexts[i] ?? '-', xPos + cellPadding, rowY + 6, {
                  width: w,
                  align: i === 2 || i === 7 ? 'left' : 'center',
                });
                xPos += cw;
              }
              doc.fillColor('#000000');
              doc.y = rowY + itemHeight;
            };

            const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
            const hnEn = `${usage.patient_hn ?? '-'} / ${usage.en ?? '-'}`;
            const usageTypeLabel = (usage.usage_type ?? '').toUpperCase() === 'IPD' ? 'ผู้ป่วยใน'
              : (usage.usage_type ?? '').toUpperCase() === 'OPD' ? 'ผู้ป่วยนอก'
              : (usage.usage_type ?? '-');
            // Main row: ลำดับ, HN/EN, ชื่อคนไข้, แผนก, ประเภท, วันที่เบิก, ว่าง, ว่าง, จำนวน, ว่าง, ว่าง
            const mainCellTexts = [
              String(usage.seq ?? idx + 1),                               // 0 ลำดับ
              hnEn.substring(0, 18),                                      // 1 HN / EN
              (usage.patient_name ?? '-').toString().substring(0, 20),    // 2 ชื่อคนไข้
              (usage.department_name ?? usage.department_code ?? '-').toString().substring(0, 18), // 3 แผนก
              usageTypeLabel,                                             // 4 ประเภท
              formatReportDateTime(usage.dispensed_date).substring(0, 16), // 5 วันที่เบิก
              '',                                                         // 6 ว่าง (sub: รหัสอุปกรณ์)
              '',                                                         // 7 ว่าง (sub: ชื่ออุปกรณ์)
              String(totalQty),                                           // 8 จำนวนอุปกรณ์
              '',                                                         // 9 ว่าง (sub: Assession No)
              '',                                                         // 10 ว่าง (sub: สถานะ)
            ];
            drawRow(mainCellTexts, bg);

            // Sub rows: ว่าง×6, รหัสอุปกรณ์, ชื่ออุปกรณ์, จำนวน, Assession No, สถานะ
            items.forEach((item) => {
              const statusLabel = getStatusLabel(item.order_item_status);
              const subCellTexts = [
                '',                                                                // 0 ว่าง (ลำดับ)
                '',                                                                // 1 ว่าง (HN/EN)
                '',                                                                // 2 ว่าง (ชื่อคนไข้)
                '',                                                                // 3 ว่าง (แผนก)
                '',                                                                // 4 ว่าง (ประเภท)
                '',                                                                // 5 ว่าง (วันที่เบิก)
                '- ' + (item.itemcode ?? '-').toString().substring(0, 24),         // 6 รหัสอุปกรณ์
                (item.itemname ?? '-').toString().substring(0, 22),                // 7 ชื่ออุปกรณ์
                item.uom ? `${item.qty ?? 0} ${item.uom}` : String(item.qty ?? 0), // 8 จำนวน
                (item.assession_no ?? '-').toString().substring(0, 12),            // 9 Assession No
                statusLabel,                                                       // 10 สถานะ
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
