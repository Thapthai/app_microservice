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

        // Table: 10 columns
        const headers = [
          'ลำดับ',
          'HN/EN',
          'แผนก',
          'รหัสอุปกรณ์',
          'ชื่ออุปกรณ์',
          'จำนวนเบิก',
          'จำนวนใช้',
          'ส่วนต่าง',
          'วันที่',
          'สถานะ',
        ];
        // ปรับสัดส่วนความกว้างคอลัมน์ให้เหมาะสมกับความยาวข้อมูลแต่ละช่อง
        // ขยาย HN/EN (index 1) ให้กว้างขึ้นเล็กน้อย
        const colPct = [0.05, 0.13, 0.15, 0.10, 0.18, 0.07, 0.07, 0.07, 0.09, 0.08];
        let colWidths = colPct.map((p) => Math.floor(contentWidth * p));
        let sumW = colWidths.reduce((a, b) => a + b, 0);
        if (sumW < contentWidth) {
          colWidths[2] += contentWidth - sumW;
        }
        // ป้องกัน NaN / ค่าไม่ถูกต้องใน colWidths (กัน error unsupported number: NaN ของ PDFKit)
        const defaultColWidth = Math.floor(contentWidth / headers.length);
        colWidths = colWidths.map((w) =>
          !Number.isFinite(w) || w <= 0 ? defaultColWidth : w,
        );

        const drawTableHeader = (y: number) => {
          let x = margin;
          doc.fontSize(8).font(finalFontBoldName);
          doc.rect(margin, y, contentWidth, itemHeight).fillAndStroke('#1A365D', '#1A365D');
          doc.fillColor('#FFFFFF');
          headers.forEach((h, i) => {
            doc.text(h, x + cellPadding, y + 6, {
              width: Math.max(2, colWidths[i] - cellPadding * 2),
              // ให้ header ทุกคอลัมน์อยู่กึ่งกลาง
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
            const difference = (item.total_dispensed ?? 0) - (item.total_used ?? 0) - (item.total_returned ?? 0);
            const isMatch = item.status === 'MATCHED';
            let xPos = margin;
            const statusText = this.getStatusText(item.status || 'UNKNOWN').substring(0, 14);
            const cellTexts = [
              String(rowIndex + 1), // ลำดับ
              '-', // HN/EN (รายละเอียดอยู่ในแถวย่อย)
              '-', // ชื่อคนไข้ (รายละเอียดอยู่ในแถวย่อย)
              (item.itemcode ?? '-').toString().substring(0, 40), // รหัสอุปกรณ์
              (item.itemname ?? '-').toString().substring(0, 28), // ชื่ออุปกรณ์
              item.total_dispensed != null ? String(item.total_dispensed) : '0', // จำนวนเบิก
              item.total_used != null ? String(item.total_used) : '0', // จำนวนใช้
              String(difference), // ส่วนต่าง
              '-', // วันที่ (รายละเอียดอยู่ในแถวย่อย)
              statusText, // สถานะ (สรุปต่อรายการอุปกรณ์)
            ];
            for (let i = 0; i < headers.length; i++) {
              const cw = colWidths[i];
              const w = Math.max(4, cw - cellPadding * 2);
              let fillColor = bg;
              if (i === 5 && difference !== 0) fillColor = '#FFF3CD';
              if (i === 9) fillColor = isMatch ? '#D4EDDA' : '#F8D7DA';
              doc.rect(xPos, rowY, cw, itemHeight).fillAndStroke(fillColor, '#DEE2E6');
              doc.fillColor(i === 9 ? (isMatch ? '#155724' : '#721C24') : '#000000');
              doc.text(cellTexts[i] ?? '-', xPos + cellPadding, rowY + 6, {
                width: w,
                // ชิดซ้ายสำหรับ รหัสอุปกรณ์ (1), ชื่ออุปกรณ์ (2), HN/EN (3), ชื่อคนไข้ (4)
                align: i === 1 || i === 2 || i === 3 || i === 4 ? 'left' : 'center',
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
                const usageDate =
                  usage.created_at != null
                    ? new Date(usage.created_at).toLocaleDateString('th-TH')
                    : '-';
                const hnEn = `${usage.patient_hn ?? '-'} / ${usage.patient_en ?? '-'}`;
                const usageStatus = this.getUsageOrderStatusText(usage.order_item_status);
                const subTexts = [
                  ' ', // ลำดับ (ว่างในแถวลูก)

                  hnEn.substring(0, 38), // HN/EN
                  (usage.department_name || usage.department_code || '-').toString().substring(0, 24), // แผนก
                  ' ', // รหัสอุปกรณ์
                  '', // ชื่ออุปกรณ์
                  ' ', // จำนวนเบิก
                  (usage.qty_used ?? 0).toString(), // จำนวนใช้
                  ' ', // ส่วนต่าง
                  usageDate, // วันที่
                  usageStatus, // สถานะ (แปลงให้เหมือนเว็บ)
                ];
                for (let i = 0; i < headers.length; i++) {
                  const cw = colWidths[i];
                  // ใส่สีสถานะในคอลัมน์สุดท้ายให้เหมือนเว็บ
                  let cellBg = '#F0F8FF';
                  let textColor = '#000000';
                  if (i === 9) {
                    const lower = usageStatus.toLowerCase();
                    if (lower === 'ยืนยันแล้ว' || lower === 'verified') {
                      cellBg = '#D4EDDA'; // เขียวอ่อน
                      textColor = '#155724'; // เขียวเข้ม
                    } else if (
                      lower === 'ยกเลิก' ||
                      lower === 'discontinue' ||
                      lower === 'discontinued'
                    ) {
                      cellBg = '#F8D7DA'; // แดงอ่อน
                      textColor = '#721C24'; // แดงเข้ม
                    } else if (usageStatus === '-') {
                      cellBg = '#F8F9FA'; // เทาอ่อน
                      textColor = '#6C757D'; // เทากลาง
                    } else {
                      cellBg = '#E0E7FF'; // น้ำเงินอ่อน (เทียบ badge ฟ้าในเว็บ)
                      textColor = '#3730A3'; // น้ำเงินเข้ม
                    }
                  }
                  doc.rect(xPos, subY, cw, itemHeight).fillAndStroke(cellBg, '#DEE2E6');
                  doc.fillColor(textColor);
                  doc.text(subTexts[i] ?? '-', xPos + cellPadding, subY + 6, {
                    width: Math.max(4, cw - cellPadding * 2),
                    // ชิดซ้ายสำหรับ รหัสอุปกรณ์ (1), ชื่ออุปกรณ์ (2), HN/EN (3), ชื่อคนไข้ (4)
                    align: i === 1 || i === 2 || i === 3 || i === 4 ? 'left' : 'center',
                  });
                  xPos += cw;
                }
                doc.y = subY + itemHeight;
              });
            }
          });
        }

        // =========================================================
        // Summary Page: สรุปรายการเบิกตามเวชภัณฑ์ (แสดงเป็นหน้าใหม่)
        // =========================================================
        if (comparisonData.length > 0) {
          doc.addPage({ size: 'A4', layout: 'portrait', margin: 35 });
          const sMargin = margin;
          const sPageWidth = doc.page.width;
          const sPageHeight = doc.page.height;
          const sContentWidth = sPageWidth - sMargin * 2;
          const sItemHeight = itemHeight;

          doc.y = sMargin;
          doc.fontSize(12).font(finalFontBoldName).fillColor('#1A365D');
          doc.text('สรุปรายการเบิกตามเวชภัณฑ์', sMargin, doc.y, {
            width: sContentWidth,
            align: 'left',
          });
          doc.y += 10;
          doc.fontSize(9).font(finalFontName).fillColor('#6C757D');
          doc.text('รวมจำนวนเบิกทั้งหมดของแต่ละรายการเวชภัณฑ์ ตามช่วงวันที่ที่เลือก', sMargin, doc.y, {
            width: sContentWidth,
            align: 'left',
          });
          doc.fillColor('#000000');
          doc.y += 14;

          // 6 columns: ลำดับ, รหัส, ชื่อ, จำนวนเบิก, จำนวนใช้, ส่วนต่าง
          const sHeaders = ['ลำดับ', 'รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'จำนวนเบิก', 'จำนวนใช้', 'ส่วนต่าง'];
          const sColPct = [0.07, 0.16, 0.35, 0.14, 0.14, 0.14];
          let sColWidths = sColPct.map((p) => Math.floor(sContentWidth * p));
          let sSumW = sColWidths.reduce((a, b) => a + b, 0);
          if (sSumW < sContentWidth) {
            sColWidths[2] += sContentWidth - sSumW;
          }
          // ป้องกัน NaN / ค่าไม่ถูกต้องใน sColWidths
          const sDefaultColWidth = Math.floor(sContentWidth / sHeaders.length);
          sColWidths = sColWidths.map((w) =>
            !Number.isFinite(w) || w <= 0 ? sDefaultColWidth : w,
          );

          const drawSummaryHeader = (y: number) => {
            let x = sMargin;
            doc.fontSize(8).font(finalFontBoldName);
            doc.rect(sMargin, y, sContentWidth, sItemHeight).fillAndStroke('#1A365D', '#1A365D');
            doc.fillColor('#FFFFFF');
            sHeaders.forEach((h, i) => {
              doc.text(h, x + cellPadding, y + 6, {
                width: Math.max(2, sColWidths[i] - cellPadding * 2),
                // align: i === 1 || i === 2 ? 'left' : 'center',
                align: 'center',
              });
              x += sColWidths[i];
            });
            doc.fillColor('#000000');
          };

          const summaryHeaderY = doc.y;
          drawSummaryHeader(summaryHeaderY);
          doc.y = summaryHeaderY + sItemHeight;

          let sIndex = 0;
          doc.fontSize(8).font(finalFontName).fillColor('#000000');
          comparisonData.forEach((item) => {
            if (doc.y + sItemHeight > sPageHeight - 35) {
              doc.addPage({ size: 'A4', layout: 'portrait', margin: 35 });
              doc.y = sMargin;
              drawSummaryHeader(doc.y);
              doc.y += sItemHeight;
            }

            const difference = (item.total_dispensed ?? 0) - (item.total_used ?? 0) - (item.total_returned ?? 0);
            const rowY = doc.y;
            const bg = sIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
            let xPos = sMargin;
            const sTexts = [
              String(sIndex + 1),
              (item.itemcode ?? '-').toString().substring(0, 18),
              (item.itemname ?? '-').toString().substring(0, 40),
              item.total_dispensed != null ? String(item.total_dispensed) : '0',
              item.total_used != null ? String(item.total_used) : '0',
              String(difference),
            ];

            for (let i = 0; i < 6; i++) {
              const cw = sColWidths[i];
              const w = Math.max(4, cw - cellPadding * 2);
              doc.rect(xPos, rowY, cw, sItemHeight).fillAndStroke(bg, '#DEE2E6');
              doc.fillColor('#000000');
              doc.text(sTexts[i] ?? '-', xPos + cellPadding, rowY + 6, {
                width: w,
                align: i === 1 || i === 2 ? 'left' : 'center',
              });
              xPos += cw;
            }
            doc.y = rowY + sItemHeight;
            sIndex++;
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

  /** แปลง usage.order_item_status ให้เหมือนบนเว็บ: discontinue→ยกเลิก, verified→ยืนยันแล้ว, ค่าว่าง→'-' */
  private getUsageOrderStatusText(status?: string): string {
    if (status == null || status === '') return '-';
    const lower = status.toLowerCase();
    if (lower === 'discontinue' || lower === 'discontinued') return 'ยกเลิก';
    if (lower === 'verified') return 'ยืนยันแล้ว';
    return status;
  }
}
