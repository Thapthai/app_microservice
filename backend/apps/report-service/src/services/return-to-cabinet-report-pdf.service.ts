import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { ReturnToCabinetReportData } from './return-to-cabinet-report-excel.service';
import { ReportConfig, resolveReportLogoPath } from '../config/report.config';

function formatReportDate(value?: string) {
  if (!value) return '-';

  // If backend serializes a Bangkok-local DATETIME as UTC (ending with 'Z'),
  // compensate by shifting back 7 hours, then format in ReportConfig.timezone.
  const base = new Date(value);
  const corrected =
    typeof value === 'string' && value.endsWith('Z')
      ? new Date(base.getTime() - 7 * 60 * 60 * 1000)
      : base;

  return corrected.toLocaleDateString(ReportConfig.locale, {
    timeZone: ReportConfig.timezone,
    ...ReportConfig.dateFormat.date,
  });
}

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

  private getLogoBuffer(): Buffer | null {
    const logoPath = resolveReportLogoPath();
    if (!logoPath || !fs.existsSync(logoPath)) return null;
    try {
      return fs.readFileSync(logoPath);
    } catch {
      return null;
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
        margin: 40,
        bufferPages: true,
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
        doc.on('error', (error) => reject(error));

        try {
          const margin = 28;
          const pageWidth = doc.page.width;
          const pageHeight = doc.page.height;
          const contentWidth = pageWidth - margin * 2;
          const rows = data.data ?? [];
          const filters = data.filters as (ReturnToCabinetReportData['filters'] & {
            departmentId?: string;
            cabinetId?: string;
            departmentName?: string;
            cabinetName?: string;
          }) | undefined;

          // ---- Header block with logo (ให้เหมือน dispensed-items / cabinet-stock) ----
          const headerTop = 28;
          const headerHeight = 40;
          doc.rect(margin, headerTop, contentWidth, headerHeight)
            .fillAndStroke('#F8F9FA', '#DEE2E6');

          if (logoBuffer && logoBuffer.length > 0) {
            try {
              doc.image(logoBuffer, margin + 6, headerTop + 4, { fit: [56, 32] });
            } catch {
              try {
                doc.image(logoBuffer, margin + 6, headerTop + 4, { width: 56 });
              } catch {
                // ignore logo error
              }
            }
          }

          doc.fontSize(14).font(finalFontBoldName).fillColor('#1A365D');
          doc.text('รายงานคืนอุปกรณ์เข้าตู้', margin, headerTop + 6, {
            width: contentWidth,
            align: 'center',
          });
          doc.fontSize(9).font(finalFontName).fillColor('#6C757D');
          doc.text('Return To Cabinet Report', margin, headerTop + 22, {
            width: contentWidth,
            align: 'center',
          });
          doc.fillColor('#000000');
          doc.y = headerTop + headerHeight + 8;

          // แถวเงื่อนไข: ด้านซ้าย แผนก, ตู้, วันที่เริ่ม, วันที่สิ้นสุด | ด้านขวา วันที่รายงาน (เหมือน dispensed-items)
          doc.text(`วันที่รายงาน: ${reportDate}`, margin + contentWidth / 2, doc.y, {
            width: contentWidth / 2,
            align: 'right',
          });
          doc.fillColor('#000000');
          const deptLabel = filters?.departmentName ? `แผนก: ${filters.departmentName}` : (filters?.departmentId ? `แผนก: ${filters.departmentId}` : 'แผนก: ทั้งหมด');
          const cabLabel = filters?.cabinetName ? `ตู้: ${filters.cabinetName}` : (filters?.cabinetId ? `ตู้: ${filters.cabinetId}` : 'ตู้: ทั้งหมด');
          const startLabel = filters?.startDate ? `วันที่เริ่ม: ${filters.startDate}` : 'วันที่เริ่ม: ทั้งหมด';
          const endLabel = filters?.endDate ? `วันที่สิ้นสุด: ${filters.endDate}` : 'วันที่สิ้นสุด: ทั้งหมด';
          const leftConditionStr = `${deptLabel}    ${cabLabel}    ${startLabel}    ${endLabel}`;
          doc.fontSize(9).font(finalFontName).fillColor('#6C757D');
          doc.text(leftConditionStr, margin, doc.y, { width: contentWidth / 2, align: 'left' });

          doc.y += 2;

          // ---- ตารางข้อมูล ----
          const itemHeight = 14;
          const cellPadding = 3;
          const totalTableWidth = contentWidth;
          const headers = [
            'ลำดับ',
            'รหัสอุปกรณ์',
            'ชื่ออุปกรณ์',
            'วันที่แก้ไขล่าสุด',
            'ชื่อผู้เบิก',
            'RFID Code',
            'แผนก',
            'ตู้',
          ];

          // สัดส่วนคอลัมน์ (รวม 1.0) ให้ไม่ล้นความกว้างกระดาษ
          const colPercentages = [0.045, 0.117, 0.208, 0.10, 0.13, 0.26, 0.10, 0.10];
          let colWidths = colPercentages.map((p) => Math.floor(totalTableWidth * p));
          let totalCalculated = colWidths.reduce((sum, w) => sum + w, 0);
          if (totalCalculated > totalTableWidth) {
            colWidths = colWidths.map((w) => Math.floor((w * totalTableWidth) / totalCalculated));
            totalCalculated = colWidths.reduce((sum, w) => sum + w, 0);
          }
          if (totalCalculated < totalTableWidth) {
            colWidths[2] += totalTableWidth - totalCalculated;
          }

          const drawTableHeader = (y: number) => {
            let x = margin;
            doc.fontSize(7).font(finalFontBoldName);
            doc.rect(margin, y, totalTableWidth, itemHeight).fillAndStroke('#1A365D', '#1A365D');
            doc.fillColor('#FFFFFF');
            headers.forEach((h, i) => {
              doc.text(h, x + cellPadding, y + 3, {
                width: Math.max(2, colWidths[i] - cellPadding * 2),
                height: itemHeight - 6,
                align: 'center',
                ellipsis: true,
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
            doc.text('ไม่มีข้อมูล', margin + cellPadding, rowY + 3, {
              width: totalTableWidth - cellPadding * 2,
              height: itemHeight - 6,
              align: 'center',
              ellipsis: true,
            });
            doc.y = rowY + itemHeight;
          } else {
            rows.forEach((item, idx) => {
              if (doc.y + itemHeight > pageHeight - 32) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin: 28 });
                doc.y = margin;
                const newHeaderY = doc.y;
                drawTableHeader(newHeaderY);
                doc.y = newHeaderY + itemHeight;
              }

              const rowY = doc.y;
              const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
              let xPos = margin;
              const rowData = [
                String(idx + 1),
                item.itemcode || '-',
                item.itemname || '-',
                formatReportDate(item.modifyDate),
                (item as any).cabinetUserName || 'ไม่ระบุ',
                item.RfidCode || '-',
                (item as any).departmentName ?? '-',
                (item as any).cabinetName || '-',
              ];

              rowData.forEach((cellData, i) => {
                const cw = colWidths[i];
                const w = Math.max(4, cw - cellPadding * 2);
                doc.rect(xPos, rowY, cw, itemHeight).fillAndStroke(bg, '#DEE2E6');
                doc.fillColor('#000000');
                doc.text(String(cellData), xPos + cellPadding, rowY + 3, {
                  width: w,
                  height: itemHeight - 6,
                  align: i === 2 || i === 4 ? 'left' : 'center',
                  ellipsis: true,
                });
                xPos += cw;
              });

              doc.y = rowY + itemHeight;
            });
          }

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
