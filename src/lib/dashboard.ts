import { capitalizeWords } from '@/lib/formatters';
import type { StatusTone } from '@/lib/status';
import type { DateRange } from '@/components/DateRangePicker';

export interface PeriodDelta {
  /** Change vs the previous period, in %; null when there was nothing to compare with. */
  percent: number | null;
  direction: 'up' | 'down' | 'flat';
}

export function periodDelta(current: number, previous: number): PeriodDelta {
  if (previous === 0) return { percent: null, direction: current > 0 ? 'up' : 'flat' };
  const percent = Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
  return { percent, direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat' };
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD (store-local day)
  revenue: number;
  orders: number;
}

const toIso = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

/**
 * Days without sales come back from the API as missing rows: fill them with zero so the
 * chart does not draw invented slopes. Long periods are grouped by week (bucket = first day).
 */
export function fillDailySeries(
  points: DailyPoint[],
  from: string,
  to: string,
  options: { weeklyAfterDays?: number } = {},
): DailyPoint[] {
  const byDate = new Map(points.map((p) => [p.date, p]));
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const days: DailyPoint[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = toIso(d);
    const p = byDate.get(iso);
    days.push({ date: iso, revenue: p?.revenue ?? 0, orders: p?.orders ?? 0 });
  }
  if (!options.weeklyAfterDays || days.length <= options.weeklyAfterDays) return days;

  const weeks: DailyPoint[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    weeks.push({
      date: chunk[0]!.date,
      revenue: Math.round(chunk.reduce((s, p) => s + p.revenue, 0) * 100) / 100,
      orders: chunk.reduce((s, p) => s + p.orders, 0),
    });
  }
  return weeks;
}

export interface RangePreset {
  label: string;
  range: DateRange;
}

export function rangePresets(today: Date = new Date()): RangePreset[] {
  const y = today.getFullYear();
  const m = today.getMonth();
  const day = (offset: number) => new Date(y, m, today.getDate() - offset);
  return [
    { label: 'Este mês', range: { from: new Date(y, m, 1), to: today } },
    { label: 'Mês passado', range: { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) } },
    { label: 'Últimos 30 dias', range: { from: day(29), to: today } },
    { label: 'Últimos 90 dias', range: { from: day(89), to: today } },
    { label: 'Este ano', range: { from: new Date(y, 0, 1), to: today } },
    { label: 'Últimos 12 meses', range: { from: new Date(y - 1, m, today.getDate() + 1), to: today } },
  ];
}

/** "outubro de 2026" -> "Outubro de 2026" (CSS capitalize would also capitalize "De"). */
export function monthLabel(date: Date): string {
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Months to pick from (newest first), e.g. for the monthly cost closing. */
export function monthOptions(today: Date = new Date(), count = 18): { value: string; label: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: monthLabel(d),
    };
  });
}

/** The default period of the dashboard: the current month so far. */
export function currentMonthRange(today: Date = new Date()): DateRange {
  return rangePresets(today)[0]!.range;
}

/** Meta Ads sends the campaign id (a long number) as utm_campaign. */
export function campaignLabel(campaign: string | null | undefined): string {
  if (!campaign) return 'Orgânico/Direto';
  if (/^\d{10,}$/.test(campaign)) return `Campanha Meta …${campaign.slice(-4)}`;
  return capitalizeWords(campaign.replace(/[_-]+/g, ' '));
}

const fulfillmentTones: Record<string, StatusTone> = {
  delivered: 'success',
  marked_as_fulfilled: 'success',
  closed: 'success',
  dispatched: 'brand',
  shipped: 'brand',
  cancelled: 'danger',
  canceled: 'danger',
};

export function fulfillmentTone(status: string): StatusTone {
  return fulfillmentTones[status.toLowerCase()] ?? 'warning';
}

/** CSS colors of the tones, for charts (recharts needs a color string). */
export const toneColor: Record<StatusTone, string> = {
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--destructive))',
  info: 'hsl(var(--info))',
  brand: 'hsl(var(--primary))',
  neutral: 'hsl(var(--muted-foreground))',
};

/** Categorical palette (lilac family) for charts without a semantic meaning. */
export const categoricalColors = [1, 2, 3, 4, 5, 6].map((i) => `hsl(var(--chart-${i}))`);
