# Adaptação FRONTEND_PROMPT_DASHBOARD_FILTROS_STATUS — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaptar o frontend ao contrato novo do backend (filtro de data dia único, campanhas por source/medium, fulfillment_status) — fechando as lacunas restantes.

**Architecture:** Mudanças pontuais; já aplicado em commits anteriores: DateRangePicker (dia único + Limpar), Campanhas (`utmCampaignLabel`), Pedidos (`fulfillment_status`). Resta omitir `days` no useDashboard quando há datas explícitas.

**Tech Stack:** React 18, TypeScript, TanStack Query, vitest.

## Global Constraints

- Seguir AGENTS.md: páginas compõem componentes; sem comentários no código.
- Verificar: `npm run lint`, `npm run test`, `npm run build` ao final de cada task.
- Estoque do dashboard permanece fixo em 30 dias (`getStock(30)`) — decisão aprovada.
- Ordenação global "Estoque Local" (produtos) está fora do escopo — aguarda contrato do backend.

---

### Task 1: useDashboard — omitir `days` quando há datas explícitas

**Files:**
- Modify: `src/hooks/useDashboard.ts`
- Test: `src/hooks/useDashboard.test.ts` (novo)

- [ ] **Step 1: Escrever testes que falham** — `src/hooks/useDashboard.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar e confirmar falha** — `npx vitest run src/hooks/useDashboard.test.ts` → FAIL (função não exportada).
- [ ] **Step 3: Implementar** — em `useDashboard.ts`, extrair e usar:

```ts
export function buildDashboardParams(range: DateRange): { days?: number; start_date?: string; end_date?: string } {
  if (range.from && range.to) {
    return { start_date: toLocalDate(range.from), end_date: toLocalDate(range.to) };
  }
  return { days: 30 };
}
```

Substituir o corpo de `params` por `useCallback(() => buildDashboardParams(range), [range])`.

- [ ] **Step 4: Rodar testes** — `npm run test` → PASS.
- [ ] **Step 5: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 6: Commit** — `git add src/hooks/useDashboard.ts src/hooks/useDashboard.test.ts && git commit -m "refactor(dashboard): omite days quando há datas explícitas no filtro"`

---

### Task 2: Verificação manual do checklist (seção 5 do prompt)

- [ ] **Step 1: grep de sanidade** — confirmar ausência de `status:` na query de pedidos e `'N/A'` na tabela de campanhas:

```bash
rg -n "fulfillment_status" src/pages/Orders.tsx src/services/api.ts
rg -n "N/A" src/components/dashboard/MarketingSection.tsx
```

- [ ] **Step 2: Validação manual no app** (conforme prompt seção 5):
  1. Selecionar um dia no calendário → filtro aplica naquele dia (não cai em 30 dias).
  2. Range com 2 cliques → intervalo normal.
  3. Clicar "Limpar" → volta ao padrão (últimos 30 dias).
  4. Card "Campanhas": sem "N/A"; linhas "Instagram / social" e "Orgânico/Direto".
  5. Página de Pedidos: filtrar por "Entregue"/"Cancelado" reflete `fulfillment_status`.
  6. Receita/AOV não mudam com pedido estornado (payment_status voided) no período.

---

## Self-Review

- **Cobertura:** prompt seções 1 (datas — gap fechado), 2 (campanhas — já aplicado, verificar), 3 (pedidos — já aplicado, verificar), 4 (receita — sem mudança), 5 (verificação manual).
- **Consistência:** `toLocalDate` permanece no módulo; `buildDashboardParams` exportado para teste; `DateRange` já importado do DateRangePicker.
- **Placeholders:** nenhum.
