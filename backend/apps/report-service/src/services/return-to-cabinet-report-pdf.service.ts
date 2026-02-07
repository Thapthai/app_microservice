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
          const margin = 40;
          const pageWidth = doc.page.width;
          const pageHeight = doc.page.height;
          const contentWidth = pageWidth - margin * 2;
          const rows = data.data ?? [];
          const filters = data.filters as (ReturnToCabinetReportData['filters'] & {
            departmentId?: string;
            cabinetId?: string;
          }) | undefined;

          // ---- Header block with logo (ให้เหมือน dispensed-items / cabinet-stock) ----
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
          doc.y = headerTop + headerHeight + 14;

          // วันที่รายงาน
          doc.fontSize(9).font(finalFontName).fillColor('#6C757D');
          doc.text(`วันที่รายงาน: ${reportDate}`, margin, doc.y, {
            width: contentWidth,
            align: 'right',
          });
          doc.fillColor('#000000');
          doc.y += 4;

          // สรุปเงื่อนไข (inline แบบบรรทัดเดียวให้ดีไซน์เรียบเหมือนรายงานอื่น)
          if (
            filters &&
            (filters.keyword ||
              filters.itemTypeId != null ||
              filters.startDate ||
              filters.endDate ||
              filters.departmentId ||
              filters.cabinetId)
          ) {
            const parts: string[] = [];
            if (filters.keyword) parts.push(`คำค้นหา: ${filters.keyword}`);
            if (filters.startDate || filters.endDate) {
              parts.push(`วันที่: ${filters.startDate ?? ''} ถึง ${filters.endDate ?? ''}`);
            }
            if (filters.departmentId) parts.push(`แผนก ID: ${filters.departmentId}`);
            if (filters.cabinetId) parts.push(`ตู้ ID: ${filters.cabinetId}`);
            if (filters.itemTypeId != null) parts.push(`ประเภทอุปกรณ์ ID: ${filters.itemTypeId}`);

            doc.fontSize(8).font(finalFontName).fillColor('#6C757D');
            doc.text(parts.join(' | '), margin, doc.y, {
              width: contentWidth,
              align: 'left',
            });
            doc.fillColor('#000000');
            doc.y += 6;
          }

          // ---- ตารางข้อมูล ----
          const itemHeight = 18;
          const cellPadding = 4;
          const totalTableWidth = contentWidth;
          const headers = [
            'ลำดับ',
            'รหัสอุปกรณ์',
            'ชื่ออุปกรณ์',
            'วันที่แก้ไขล่าสุด',
            'ชื่อผู้เบิก',
            'RFID Code',
            'cabinet',
            'สถานะ RFID',
          ];

          // สัดส่วนคอลัมน์ ใกล้เคียง Excel
          const colPercentages = [0.07, 0.12, 0.23, 0.16, 0.14, 0.11, 0.09, 0.08];
          const colWidths = colPercentages.map((p) => Math.floor(totalTableWidth * p));
          const totalCalculated = colWidths.reduce((sum, w) => sum + w, 0);
          if (totalCalculated < totalTableWidth) {
            colWidths[2] += totalTableWidth - totalCalculated;
          }

          const drawTableHeader = (y: number) => {
            let x = margin;
            doc.fontSize(8).font(finalFontBoldName);
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

          doc.fontSize(8).font(finalFontName).fillColor('#000000');

          if (rows.length === 0) {
            const rowY = doc.y;
            doc.rect(margin, rowY, totalTableWidth, itemHeight).fillAndStroke('#F8F9FA', '#DEE2E6');
            doc.text('ไม่มีข้อมูล', margin + cellPadding, rowY + 5, {
              width: totalTableWidth - cellPadding * 2,
              align: 'center',
            });
            doc.y = rowY + itemHeight;
          } else {
            rows.forEach((item, idx) => {
              if (doc.y + itemHeight > pageHeight - 35) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin });
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
                (item as any).cabinetName || '-',
                (item as any).Istatus_rfid ?? '-',
              ];

              rowData.forEach((cellData, i) => {
                const cw = colWidths[i];
                const w = Math.max(4, cw - cellPadding * 2);
                doc.rect(xPos, rowY, cw, itemHeight).fillAndStroke(bg, '#DEE2E6');
                doc.fillColor('#000000');
                doc.text(String(cellData), xPos + cellPadding, rowY + 5, {
                  width: w,
                  align: i === 2 || i === 4 ? 'left' : 'center',
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
