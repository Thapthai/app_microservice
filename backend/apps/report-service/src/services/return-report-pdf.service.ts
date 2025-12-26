import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { ReturnReportData } from './return-report-excel.service';

@Injectable()
export class ReturnReportPdfService {
  private registerThaiFont(doc: PDFDocument): void {
    try {
      const fontPaths = [
        'apps/report-service/assets/fonts/THSarabunNew.ttf',
        'apps/report-service/assets/fonts/THSarabunNew-Bold.ttf',
      ];
      
      fontPaths.forEach((fontPath) => {
        try {
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.join(process.cwd(), fontPath);
          if (fs.existsSync(fullPath)) {
            doc.registerFont('THSarabunNew', fullPath);
            doc.registerFont('THSarabunNew-Bold', fullPath);
          }
        } catch (e) {
          // Font registration failed, will use default
        }
      });
    } catch (error) {
      // Font registration failed, will use default
    }
  }

  async generateReport(data: ReturnReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        this.registerThaiFont(doc);
        
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Title
        doc.font('THSarabunNew-Bold').fontSize(20).text('รายงานการคืนเวชภัณฑ์', { align: 'center' });
        doc.moveDown();

        // Filters
        if (data.filters) {
          doc.font('THSarabunNew-Bold').fontSize(14).text('เงื่อนไขการค้นหา');
          doc.font('THSarabunNew').fontSize(12);
          if (data.filters.date_from || data.filters.date_to) {
            doc.text(`วันที่: ${data.filters.date_from || ''} ถึง ${data.filters.date_to || ''}`);
          }
          if (data.filters.return_reason) {
            doc.text(`สาเหตุการคืน: ${this.getReturnReasonLabel(data.filters.return_reason)}`);
          }
          if (data.filters.department_code) {
            doc.text(`แผนก: ${data.filters.department_code}`);
          }
          if (data.filters.patient_hn) {
            doc.text(`HN: ${data.filters.patient_hn}`);
          }
          doc.moveDown();
        }

        // Summary
        doc.font('THSarabunNew-Bold').fontSize(14).text('สรุปผล (Summary)');
        doc.font('THSarabunNew').fontSize(12);
        doc.text(`จำนวนรายการที่คืน: ${data.summary.total_records}`);
        doc.text(`จำนวนรวมที่คืน: ${data.summary.total_qty_returned}`);
        doc.moveDown();

        // Table headers
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [30, 50, 80, 40, 40, 40, 70, 50, 60];
        const headers = ['ลำดับ', 'รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'HN', 'EN', 'จำนวน', 'สาเหตุ', 'วันที่คืน', 'หมายเหตุ'];
        
        doc.font('THSarabunNew-Bold').fontSize(11);
        let x = tableLeft;
        headers.forEach((header, i) => {
          doc.rect(x, tableTop, colWidths[i], 20).stroke();
          doc.text(header, x + 2, tableTop + 5, { width: colWidths[i] - 4, align: 'center' });
          x += colWidths[i];
        });

        // Table data
        let y = tableTop + 20;
        doc.font('THSarabunNew').fontSize(10);
        
        data.data.forEach((record, index) => {
          if (y > 750) {
            doc.addPage();
            y = 50;
            // Redraw headers on new page
            x = tableLeft;
            doc.font('THSarabunNew-Bold').fontSize(11);
            headers.forEach((header, i) => {
              doc.rect(x, y, colWidths[i], 20).stroke();
              doc.text(header, x + 2, y + 5, { width: colWidths[i] - 4, align: 'center' });
              x += colWidths[i];
            });
            y += 20;
            doc.font('THSarabunNew').fontSize(10);
          }

          const rowData = [
            (index + 1).toString(),
            record.supply_item?.order_item_code || record.supply_item?.supply_code || '-',
            record.supply_item?.order_item_description || record.supply_item?.supply_name || '-',
            record.supply_item?.usage?.patient_hn || '-',
            record.supply_item?.usage?.en || '-',
            record.qty_returned.toString(),
            this.getReturnReasonLabel(record.return_reason),
            new Date(record.return_datetime).toLocaleDateString('th-TH'),
            record.return_note || '-',
          ];

          x = tableLeft;
          rowData.forEach((cell, i) => {
            doc.rect(x, y, colWidths[i], 15).stroke();
            doc.text(cell, x + 2, y + 3, { width: colWidths[i] - 4, align: i === 0 || i === 2 || i === 8 ? 'left' : 'center' });
            x += colWidths[i];
          });
          y += 15;
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getReturnReasonLabel(reason: string): string {
    const labels: { [key: string]: string } = {
      'UNWRAPPED_UNUSED': 'ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิม',
      'EXPIRED': 'อุปกรณ์หมดอายุ',
      'CONTAMINATED': 'อุปกรณ์มีการปนเปื้อน',
      'DAMAGED': 'อุปกรณ์ชำรุด',
    };
    return labels[reason] || reason;
  }
}

