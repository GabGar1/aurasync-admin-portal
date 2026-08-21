# Ajustes UI (Dashboard, Produtos, Venda Externa, Clientes, Sidebar) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar os ajustes de UI/tradução aprovados em 5 áreas do portal.

**Architecture:** Mudanças pontuais em componentes/pages existentes; sem novos endpoints. `effectiveOrderStatus` centralizado em `lib/formatters.ts`. Ordenação global de "Estoque Local" fica adiada até o backend enviar a mudança.

**Tech Stack:** React 18, TypeScript, Tailwind, shadcn/ui, recharts, vitest.

## Global Constraints

- Seguir AGENTS.md: pages compõem componentes; serviços só na camada `services/`; sem comentários.
- Verificar: `npm run lint`, `npm run test`, `npm run build` ao final de cada task.

---

### Task 1: Status "Estornado" tem prioridade sobre "Entregue" + label PACKED

**Files:**
- Modify: `src/lib/formatters.ts` (`effectiveOrderStatus` ~linha 214, `statusLabels` ~linha 52)
- Modify: `src/pages/Orders.tsx:36-44` (`statusBadgeClass`)
- Test: `src/lib/formatters.test.ts`

- [ ] **Step 1: Escrever testes que falham** — adicionar em `formatters.test.ts`:

```ts
it('prioriza estornado/reembolsado sobre completed_at', () => {
  expect(effectiveOrderStatus({ status: 'voided', completed_at: 'x' })).toEqual({ key: 'voided', label: 'Estornado' });
  expect(effectiveOrderStatus({ status: 'refunded', completed_at: 'x' }).label).toBe('Reembolsado');
  expect(effectiveOrderStatus({ status: 'VOIDED', completed_at: 'x' }).label).toBe('Estornado');
});

it('traduz PACKED', () => {
  expect(statusLabel('PACKED')).toBe('Empacotado');
});
```

- [ ] **Step 2: Rodar e confirmar falha** — `npm run test` → 2 testes falham.
- [ ] **Step 3: Implementar** — em `formatters.ts` adicionar `PACKED: 'Empacotado'` e `packed: 'Empacotado'` em `statusLabels`; em `effectiveOrderStatus`, inserir antes do check de `completed_at`:

```ts
const normalizedStatus = order.status.toLowerCase();
if (normalizedStatus === 'voided' || normalizedStatus === 'refunded') {
  return { key: 'voided', label: statusLabel(order.status) };
}
```

- [ ] **Step 4: Rodar testes** — `npm run test` → PASS.
- [ ] **Step 5: Badge do status estornado** — em `Orders.tsx` `statusBadgeClass` adicionar:

```ts
voided: 'bg-red-100 text-red-800 hover:bg-red-100 border-transparent',
```

- [ ] **Step 6: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 7: Commit** — `git add src/lib/formatters.ts src/lib/formatters.test.ts src/pages/Orders.tsx && git commit -m "fix: prioriza status estornado sobre entregue e traduz PACKED"`

---

### Task 2: Gráfico "Pedidos por Status" (cores) e "Pedidos por Hora" (tooltip)

**Files:**
- Modify: `src/components/dashboard/OrdersCharts.tsx`

- [ ] **Step 1: Cores por índice (padrão Métodos de Pagamento)** — remover `STATUS_COLORS` e usar:

```tsx
<Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={50} label={({ status, count }) => `${statusLabel(status)}: ${count}`}>
  {byStatus.map((entry, i) => (
    <Cell key={entry.status} fill={`hsl(${i * 60}, 60%, 60%)`} />
  ))}
</Pie>
<Tooltip formatter={(value: number, name: string) => [value, statusLabel(name)]} />
```

- [ ] **Step 2: Tooltip de Pedidos por Hora**:

```tsx
<Tooltip formatter={(value: number) => [value, 'Pedidos']} labelFormatter={(hour) => `${hour}h`} />
```

- [ ] **Step 3: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 4: Commit** — `git add src/components/dashboard/OrdersCharts.tsx && git commit -m "feat: cores por índice no gráfico de status e tooltip em PT-BR por hora"`

---

### Task 3: Gráfico "Receita ao Longo do Tempo" (tooltip + eixo Y)

**Files:**
- Modify: `src/components/dashboard/RevenueChart.tsx`

- [ ] **Step 1: Eixo Y (0 → +500)** — computar `maxRevenue`, `yMax`, `yTicks` no corpo do componente e substituir o `<YAxis />` atual:

```tsx
const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
const yMax = Math.ceil(maxRevenue / 500) * 500 || 500;
const yTicks = Array.from({ length: yMax / 500 + 1 }, (_, i) => i * 500);

<YAxis
  domain={[0, yMax]}
  ticks={yTicks}
  tickFormatter={(v: number) =>
    v === 0 ? 'R$0' : v < 1000 ? `R$${v}` : `R$${(v / 1000).toFixed(1).replace('.', ',')}k`
  }
  fontSize={12}
/>
```

- [ ] **Step 2: Tooltip** — importar `formatDateOnly` e substituir:

```tsx
<Tooltip
  labelFormatter={(d: string) => formatDateOnly(d)}
  formatter={(value: number) => [formatCurrency(value), 'Receita']}
/>
```

- [ ] **Step 3: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 4: Commit** — `git add src/components/dashboard/RevenueChart.tsx && git commit -m "feat: tooltip e eixo Y do gráfico de receita em PT-BR com passos de 500"`

---

### Task 4: "Top 20 Produtos" sem coluna Variante

**Files:**
- Modify: `src/components/dashboard/TopProducts.tsx`

- [ ] **Step 1: Remover coluna** — na view "product": remover `<TableHead>Variante</TableHead>` e `<TableCell>{item.variant_name || '-'}</TableCell>`.
- [ ] **Step 2: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 3: Commit** — `git add src/components/dashboard/TopProducts.tsx && git commit -m "refactor: remove coluna variante do top produtos"`

---

### Task 5: "Vendas por Loja" — tooltip "Pedidos"

**Files:**
- Modify: `src/components/dashboard/MarketingSection.tsx`

- [ ] **Step 1: Substituir** `<Tooltip formatter={(value: number) => formatCurrency(value)} />` por:

```tsx
<Tooltip formatter={(value: number) => [value, 'Pedidos']} />
```

- [ ] **Step 2: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 3: Commit** — `git add src/components/dashboard/MarketingSection.tsx && git commit -m "fix: tooltip de vendas por loja mostra Pedidos"`

---

### Task 6: Seção Estoque (remover Variante ×3 + ordenar Sem Vendas por estoque desc)

**Files:**
- Modify: `src/components/dashboard/StockSection.tsx`

- [ ] **Step 1: Estoque Baixo** — remover `<TableHead>Variante</TableHead>` e `<TableCell>{item.variant_name || '-'}</TableCell>`; mudar `colSpan={4}` → `colSpan={3}`.
- [ ] **Step 2: Sem Vendas (30 dias)** — remover coluna Variante e ordenar:

```tsx
{[...data.no_sales_30d].sort((a, b) => b.stock - a.stock).map((item, i) => (
```

- [ ] **Step 3: Estoque Parado** — remover `<TableHead>Variante</TableHead>` e `<TableCell>{item.variant_name || '-'}</TableCell>`.
- [ ] **Step 4: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 5: Commit** — `git add src/components/dashboard/StockSection.tsx && git commit -m "feat: remove coluna variante das tabelas de estoque e ordena sem vendas por estoque"`

---

### Task 7: Produtos — não expandir variantes automaticamente ao filtrar

**Files:**
- Modify: `src/pages/Products.tsx`

- [ ] **Step 1: Remover o `useEffect` (linhas 128–134)** que seta `expandedRows` quando `debouncedSearch` muda; manter `toggleRow` manual. Remover `useEffect` do import do react (linha 1).
- [ ] **Step 2: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 3: Commit** — `git add src/pages/Products.tsx && git commit -m "fix: filtro de texto não expande variantes automaticamente"`

> **Adiado:** ordenação global por "Estoque Local" — aguardando mudança do backend.

---

### Task 8: VariantPicker — trigger sem null e mais largo

**Files:**
- Modify: `src/components/VariantPicker.tsx`

- [ ] **Step 1: Trigger** — substituir a linha que monta o texto do botão por:

```tsx
{value ? `${value.product_name} - ${formatCurrency(value.price)}` : placeholder}
```

- [ ] **Step 2: Largura** — substituir o `PopoverContent` por:

```tsx
<PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[400px] p-0" align="start">
```

- [ ] **Step 3: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 4: Commit** — `git add src/components/VariantPicker.tsx && git commit -m "fix: exibe nome e preço no select de produtos sem variante nula"`

---

### Task 9: Clientes — botão "Adicionar cliente"

**Files:**
- Modify: `src/pages/Customers.tsx`

- [ ] **Step 1: Importar** `CreateCustomerDialog` de `@/components/sales/CreateCustomerDialog` e `Plus` de `lucide-react` (Button já importado).
- [ ] **Step 2: Estado** — `const [customerDialogOpen, setCustomerDialogOpen] = useState(false);`
- [ ] **Step 3: UI** — no bloco da busca, adicionar ao lado do input:

```tsx
<Button onClick={() => setCustomerDialogOpen(true)} className="shrink-0">
  <Plus className="h-4 w-4 mr-2" />
  Adicionar cliente
</Button>
```

- [ ] **Step 4: Dialog** — ao final, antes de `CustomerDetailDrawer`:

```tsx
<CreateCustomerDialog
  open={customerDialogOpen}
  onOpenChange={setCustomerDialogOpen}
  onCreated={() => setCustomerDialogOpen(false)}
/>
```

(O dialog já invalida `['customers']` em `onSuccess` → lista atualiza.)

- [ ] **Step 5: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 6: Commit** — `git add src/pages/Customers.tsx && git commit -m "feat: botão adicionar cliente na página de clientes"`

---

### Task 10: Sidebar — texto "AuraSync" no lugar da logo

**Files:**
- Modify: `src/pages/Layout.tsx`

- [ ] **Step 1: Substituir o `<img>` por**:

```tsx
<span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">AuraSync</span>
```

(`SidebarTrigger className="ml-auto"` permanece à direita; header já usa `flex items-center` para alinhamento vertical. Colapsado: só o botão permanece.)

- [ ] **Step 2: Verificar** — `npm run lint && npm run test && npm run build`.
- [ ] **Step 3: Commit** — `git add src/pages/Layout.tsx && git commit -m "feat: substitui logo por texto AuraSync na sidebar"`

---

## Self-Review

- **Cobertura:** todos os itens do pedido mapeados (Estornado, cores status, tooltips revenue/hora/loja, PACKED, colunas Variante ×4, ordenação sem-vendas, expansão produtos, sort global adiado, VariantPicker, botão clientes, sidebar).
- **Consistência de tipos:** `formatDateOnly` já existe em `formatters.ts`; `statusLabel` aceita string; sem novas assinaturas entre tasks.
- **Placeholders:** nenhum.

**Pendência explícita:** sort global "Estoque Local" — aguardando contrato do backend.
