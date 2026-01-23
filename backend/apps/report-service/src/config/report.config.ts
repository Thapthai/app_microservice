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
