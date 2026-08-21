import { describe, it, expect } from 'vitest';
import { buildDashboardParams } from './useDashboard';
import type { DateRange } from '@/components/DateRangePicker';

describe('buildDashboardParams', () => {
  it('sem range envia janela padrão de 30 dias', () => {
    expect(buildDashboardParams({ from: null, to: null })).toEqual({ days: 30 });
  });

  it('com range envia apenas start_date/end_date (sem days)', () => {
    const range: DateRange = { from: new Date(2026, 7, 15), to: new Date(2026, 7, 16) };
    expect(buildDashboardParams(range)).toEqual({ start_date: '2026-08-15', end_date: '2026-08-16' });
  });

  it('dia único envia start_date e end_date iguais', () => {
    const range: DateRange = { from: new Date(2026, 7, 15), to: new Date(2026, 7, 15) };
    expect(buildDashboardParams(range)).toEqual({ start_date: '2026-08-15', end_date: '2026-08-15' });
  });
});
