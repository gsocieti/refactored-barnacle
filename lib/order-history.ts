export const HISTORY_RANGES = ['today', 'week', 'month', 'all'] as const;

export type HistoryRange = (typeof HISTORY_RANGES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  preparing: 'Disiapkan',
  served: 'Disajikan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export function parseHistoryRange(value: string | undefined): HistoryRange {
  return HISTORY_RANGES.find((range) => range === value) ?? 'all';
}

function jakartaDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return { year: part('year'), month: part('month'), day: part('day') };
}

function dateAtJakartaMidnight(date: Date) {
  const day = date.toISOString().slice(0, 10);
  return new Date(`${day}T00:00:00+07:00`).toISOString();
}

export function getHistoryDateBounds(range: HistoryRange, now = new Date()) {
  if (range === 'all') return null;

  const { year, month, day } = jakartaDateParts(now);
  const start = new Date(Date.UTC(year, month - 1, day));
  if (range === 'week') {
    const mondayOffset = (start.getUTCDay() + 6) % 7;
    start.setUTCDate(start.getUTCDate() - mondayOffset);
  } else if (range === 'month') {
    start.setUTCDate(1);
  }

  const end = new Date(start);
  if (range === 'today') end.setUTCDate(end.getUTCDate() + 1);
  if (range === 'week') end.setUTCDate(end.getUTCDate() + 7);
  if (range === 'month') end.setUTCMonth(end.getUTCMonth() + 1);

  return {
    start: dateAtJakartaMidnight(start),
    end: dateAtJakartaMidnight(end),
  };
}
