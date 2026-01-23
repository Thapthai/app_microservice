export function formatThaiDateTime(value?: string) {
    if (!value) return '-';

    // If backend serializes a Bangkok-local DATETIME as UTC (ending with 'Z'),
    // compensate by shifting back 7 hours, then format in Asia/Bangkok.
    const base = new Date(value);
    const corrected =
        typeof value === 'string' && value.endsWith('Z')
            ? new Date(base.getTime() - 7 * 60 * 60 * 1000)
            : base;

    return corrected.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}   