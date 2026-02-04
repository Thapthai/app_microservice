import * as path from 'path';
import * as fs from 'fs';

/** รายงานสต๊อกอุปกรณ์ในตู้ - ชื่อไฟล์โลโก้ */
const CABINET_REPORT_LOGO_FILENAME = '3_logo_p-1-fit.png';

/**
 * หา path ไฟล์โลโก้สำหรับรายงานสต๊อกอุปกรณ์ในตู้ (3_logo_p-1-fit.png)
 * ลองตามลำดับ: public/, uploads/items/, backend/public, __dirname relative
 */
export function resolveReportLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'public', CABINET_REPORT_LOGO_FILENAME),
    path.join(process.cwd(), 'backend', 'public', CABINET_REPORT_LOGO_FILENAME),
    path.join(process.cwd(), 'uploads', 'items', CABINET_REPORT_LOGO_FILENAME),
    path.join(process.cwd(), 'backend', 'uploads', 'items', CABINET_REPORT_LOGO_FILENAME),
    path.join(__dirname, '..', '..', '..', '..', 'public', CABINET_REPORT_LOGO_FILENAME),
    path.join(__dirname, '..', '..', '..', '..', '..', 'public', CABINET_REPORT_LOGO_FILENAME),
    path.join(__dirname, '..', '..', '..', '..', 'uploads', 'items', CABINET_REPORT_LOGO_FILENAME),
    path.join(__dirname, '..', '..', '..', '..', '..', 'uploads', 'items', CABINET_REPORT_LOGO_FILENAME),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export const ReportConfig = {
  timezone: process.env.REPORT_TIMEZONE || 'Asia/Bangkok',
  locale: process.env.REPORT_LOCALE || 'th-TH',
  dateFormat: {
    date: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    datetime: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
  },
} as const;
