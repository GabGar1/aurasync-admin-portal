import { describe, it, expect } from 'vitest';
import { periodDelta, fillDailySeries, rangePresets, campaignLabel, fulfillmentTone } from './dashboard';

describe('periodDelta', () => {
  it('calcula a variação percentual em relação ao período anterior', () => {
    expect(periodDelta(150, 100)).toEqual({ percent: 50, direction: 'up' });
    expect(periodDelta(80, 100)).toEqual({ percent: -20, direction: 'down' });
    expect(periodDelta(100, 100)).toEqual({ percent: 0, direction: 'flat' });
  });

  it('não inventa porcentagem quando não havia base de comparação', () => {
    expect(periodDelta(100, 0)).toEqual({ percent: null, direction: 'up' });
    expect(periodDelta(0, 0)).toEqual({ percent: null, direction: 'flat' });
  });
});

describe('fillDailySeries', () => {
  it('preenche os dias sem venda com zero, em ordem', () => {
    const filled = fillDailySeries(
      [{ date: '2026-08-03', revenue: 50, orders: 1 }, { date: '2026-08-01', revenue: 100, orders: 2 }],
      '2026-08-01',
      '2026-08-04',
    );
    expect(filled).toEqual([
      { date: '2026-08-01', revenue: 100, orders: 2 },
      { date: '2026-08-02', revenue: 0, orders: 0 },
      { date: '2026-08-03', revenue: 50, orders: 1 },
      { date: '2026-08-04', revenue: 0, orders: 0 },
    ]);
  });

  it('agrupa por semana em períodos longos', () => {
    const filled = fillDailySeries([{ date: '2026-01-02', revenue: 10, orders: 1 }, { date: '2026-01-05', revenue: 5, orders: 1 }], '2026-01-01', '2026-04-30', { weeklyAfterDays: 60 });
    expect(filled.length).toBe(18);
    expect(filled[0]).toEqual({ date: '2026-01-01', revenue: 15, orders: 2 });
  });
});

describe('rangePresets', () => {
  const today = new Date(2026, 10, 12); // 12/11/2026

  it('oferece este mês, mês passado e este ano com limites de calendário', () => {
    const presets = Object.fromEntries(rangePresets(today).map((p) => [p.label, p.range]));
    expect(presets['Este mês']).toEqual({ from: new Date(2026, 10, 1), to: today });
    expect(presets['Mês passado']).toEqual({ from: new Date(2026, 9, 1), to: new Date(2026, 9, 31) });
    expect(presets['Este ano']).toEqual({ from: new Date(2026, 0, 1), to: today });
    expect(presets['Últimos 30 dias']).toEqual({ from: new Date(2026, 9, 14), to: today });
  });
});

describe('campaignLabel', () => {
  it('troca o ID numérico de campanha do Meta por um rótulo legível', () => {
    expect(campaignLabel('120222198954390582')).toBe('Campanha Meta …0582');
    expect(campaignLabel('black_friday')).toBe('Black Friday');
    expect(campaignLabel(null)).toBe('Orgânico/Direto');
  });
});

describe('fulfillmentTone', () => {
  it('usa cor semântica: entregue verde, cancelado vermelho', () => {
    expect(fulfillmentTone('DELIVERED')).toBe('success');
    expect(fulfillmentTone('cancelled')).toBe('danger');
    expect(fulfillmentTone('PENDING')).toBe('warning');
    expect(fulfillmentTone('DISPATCHED')).toBe('brand');
  });
});
