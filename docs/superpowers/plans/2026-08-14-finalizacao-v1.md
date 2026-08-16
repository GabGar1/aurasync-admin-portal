# Finalização v1 — Dashboard, Produtos, Pedidos, Venda Externa, Clientes (+ backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar todas as correções/melhorias listadas pelo usuário nas 5 páginas (Dashboard, Produtos, Pedidos, Venda externa, Clientes), com as mudanças de suporte necessárias no backend (fuso horário do dashboard, `POST /customers`, nomes nos itens do pedido, `category` no top_products, busca por UUID de variante).

**Architecture:** Backend primeiro (repos `aurasync-backend`, branch `feat/cost-engine-v2`): correção de fuso horário no dashboard repository, novo endpoint `POST /api/customers`, enriquecimento dos itens de pedido com `product_name`/`variant_name`, `category` em `top_products` e busca de produtos por UUID de variante. Depois frontend (repo `aurasync-admin-portal`, branch `develop`): labels/helpers centralizados em `lib/formatters.ts` com testes vitest, e ajustes por página.

**Tech Stack:** Node/TS/Fastify/Knex (backend, testes `node --test` via tsx); React/TS/Vite/shadcn/recharts/TanStack Query/react-hook-form/zod (frontend, testes vitest).

## Global Constraints

- **Sem commits** — o usuário não autorizou commits; cada tarefa termina com verificação (testes + lint), não com commit. (Se o usuário autorizar depois, commit por tarefa com mensagem `feat(...)`/`fix(...)`.)
- Backend: rodar testes com `npm test` (pretest roda bootstrap) e lint com `npm run lint` no diretório `aurasync-backend`.
- Frontend: `npm test` (vitest run), `npm run lint`, `npm run build` no diretório `aurasync-admin-portal`.
- Valores monetários: nunca recalcular; exibir o que a API entrega (`formatCurrency`).
- Manter padrões existentes: componentes shadcn, RHF+zod em forms, `formatters.ts` como fonte única de rótulos PT-BR.
- Fuso da loja: `America/Sao_Paulo` (offset fixo −03:00, sem DST).

---

## Task 1 (Backend): Filtro de data do dashboard por fuso horário local

**Files:**
- Modify: `aurasync-backend/src/repositories/dashboard.repository.ts`
- Modify: `aurasync-backend/src/routers/dashboard.router.ts`
- Modify: `aurasync-backend/src/services/dashboard.service.ts`
- Test: `aurasync-backend/src/services/dashboard.service.integration.test.ts`

**Interfaces:**
- Consumes: `getOrdersStats(days, dates)` / `getMarketingStats(days, dates)` — assinatura muda de `{ start?: Date; end?: Date }` para `{ start_date?: string; end_date?: string }` (strings `YYYY-MM-DD`).
- Produces: mesmo shape de resposta (`OrdersResponse`/`MarketingResponse` zod), sem mudança de contrato para o front.

- [ ] **Step 1: Mudar o router para repassar as strings de data (sem `new Date`)**

Em `src/routers/dashboard.router.ts`, nos dois handlers (marketing e orders), troque:

```ts
const dates = {
  ...(start_date ? { start: new Date(start_date) } : {}),
  ...(end_date ? { end: new Date(end_date) } : {}),
};
```

por:

```ts
const dates = {
  ...(start_date ? { start_date } : {}),
  ...(end_date ? { end_date } : {}),
};
```

- [ ] **Step 2: Ajustar o service**

Em `src/services/dashboard.service.ts`, troque as duas assinaturas:

```ts
async getMarketingStats(days = 30, dates: { start_date?: string; end_date?: string } = {}) {
  return dashboardRepository.getMarketingStats(days, dates);
}

async getOrdersStats(days = 30, dates: { start_date?: string; end_date?: string } = {}) {
  return dashboardRepository.getOrdersStats(days, dates);
}
```

- [ ] **Step 3: Escrever o teste que falha (fuso horário)**

Adicione a `src/services/dashboard.service.integration.test.ts` (mesmos imports existentes; reutilize `db`):

```ts
it("filters dashboard stats by the store's local day (America/Sao_Paulo)", async () => {
  const boundaryOrderId = "00000000-0000-0000-0000-000000000099";
  // 2026-08-01T02:30Z = 31/07/2026 23:30 em America/Sao_Paulo
  await db("orders").insert({
    id: boundaryOrderId,
    customer_name: "Boundary Customer",
    status: "PAID",
    total_amount: 50.00,
    created_at: new Date("2026-08-01T02:30:00.000Z"),
  });
  await db("order_items").insert({
    order_id: boundaryOrderId,
    variant_id: variantId,
    quantity: 1,
    unit_price: 50.00,
  });

  const onLocalDay = await dashboardService.getOrdersStats(30, {
    start_date: "2026-07-31",
    end_date: "2026-07-31",
  });
  const julyTrend = onLocalDay.revenue_trend.find((d: any) => d.date === "2026-07-31");
  assert.ok(julyTrend, "order realized on 2026-07-31 local should appear in that day's trend");
  assert.ok(
    onLocalDay.by_hour.some((h: any) => h.hour === 23),
    "order at 23:30 local must be bucketed in hour 23, not UTC hour 2"
  );

  const onUtcDay = await dashboardService.getOrdersStats(30, {
    start_date: "2026-08-01",
    end_date: "2026-08-01",
  });
  const augustTrend = onUtcDay.revenue_trend.find((d: any) => d.date === "2026-08-01");
  assert.ok(
    !augustTrend || augustTrend.orders === 0,
    "order realized on 2026-07-31 local must NOT count for 2026-08-01"
  );
});
```

Run: `npm test` no diretório `aurasync-backend`
Expected: FAIL — `julyTrend` undefined (pedido contado em 01/08 UTC, hour = 2).

- [ ] **Step 4: Implementar conversão local no repository**

Em `src/repositories/dashboard.repository.ts`, adicione no topo (após o import do db):

```ts
const STORE_TZ_OFFSET = "-03:00"; // America/Sao_Paulo (sem DST desde 2019)

function localDateToUtc(dateStr: string, endOfDay = false): Date {
  const time = endOfDay ? "23:59:59.999" : "00:00:00";
  return new Date(`${dateStr}T${time}${STORE_TZ_OFFSET}`);
}
```

Troque o `dateWindow`:

```ts
private dateWindow(days: number, dates: { start_date?: string; end_date?: string } = {}) {
  if (dates.start_date && dates.end_date) {
    return {
      start: localDateToUtc(dates.start_date),
      end: localDateToUtc(dates.end_date, true),
    };
  }
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end };
}
```

Atualize as assinaturas `getMarketingStats` e `getOrdersStats` para `dates: { start_date?: string; end_date?: string } = {}`.

Em `getOrdersStats`, troque o bloco `byHour`:

```ts
const localHourExpr =
  "EXTRACT(HOUR FROM (orders.created_at AT TIME ZONE 'America/Sao_Paulo'))::int";

const byHour = await baseQuery
  .clone()
  .groupBy(db.raw(localHourExpr))
  .select(
    db.raw(`${localHourExpr} as hour`),
    db.raw("COUNT(*)::int as orders"),
    db.raw("COALESCE(SUM(total_amount), 0)::float8 as revenue")
  )
  .orderBy("hour");
```

E o `revenueTrend`:

```ts
const revenueTrend = await baseQuery
  .clone()
  .groupBy(db.raw("(orders.created_at AT TIME ZONE 'America/Sao_Paulo')::date"))
  .select(
    db.raw("(orders.created_at AT TIME ZONE 'America/Sao_Paulo')::date::text as date"),
    db.raw("COALESCE(SUM(total_amount), 0)::float8 as revenue"),
    db.raw("COUNT(*)::int as orders")
  )
  .orderBy("date", "asc")
  .limit(366);
```

(remove o `.orderBy("date", "desc").limit(30)` antigo — o KPI "Receita Total (Período)" soma `revenue_trend` e ficava truncado em ranges longos).

- [ ] **Step 5: Rodar os testes e verificar**

Run: `npm test` no diretório `aurasync-backend`
Expected: todos PASS (127 anteriores + novo teste de fuso).

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: sem erros.

---

## Task 2 (Backend): Endpoint `POST /api/customers`

**Files:**
- Modify: `aurasync-backend/src/routers/customer.router.ts`
- Modify: `aurasync-backend/src/services/customer.service.ts`
- Modify: `aurasync-backend/src/repositories/customer.repository.ts`
- Test: `aurasync-backend/src/services/customer.service.integration.test.ts`

**Interfaces:**
- Produces: `POST /customers` body `{ name: string; email?: string; city?: string; province?: string }` → `201 Customer` (mesma row da tabela customers); upsert por email quando email fornecido.

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `src/services/customer.service.integration.test.ts`:

```ts
it("creates a customer without email", async () => {
  const created = await customerService.createCustomer({
    name: "Cliente Sem Email",
    city: "Campinas",
  });
  assert.ok(created.id);
  assert.strictEqual(created.name, "Cliente Sem Email");
  assert.strictEqual(created.email, null);
  assert.strictEqual(created.city, "Campinas");
});

it("upserts a customer by email on creation", async () => {
  const first = await customerService.createCustomer({
    name: "Maria Silva",
    email: "maria@test.com",
    city: "São Paulo",
    province: "SP",
  });
  const second = await customerService.createCustomer({
    name: "Maria Silva Atualizada",
    email: "maria@test.com",
  });
  assert.strictEqual(second.id, first.id);
  assert.strictEqual(second.name, "Maria Silva Atualizada");
  assert.strictEqual(second.city, "São Paulo");
});
```

Run: `npm test`
Expected: FAIL — `customerService.createCustomer is not a function`.

- [ ] **Step 2: Adicionar o método no service**

Em `src/services/customer.service.ts`:

```ts
async createCustomer(data: { name: string; email?: string; city?: string; province?: string }) {
  return customerRepository.create(data);
}
```

- [ ] **Step 3: Adicionar `create` no repository**

Em `src/repositories/customer.repository.ts` (classe `CustomerRepository`):

```ts
async create(data: { name: string; email?: string; city?: string; province?: string }) {
  if (!data.email) {
    const [row] = await db(this.table)
      .insert({
        name: data.name,
        email: null,
        city: data.city ?? null,
        province: data.province ?? null,
        first_purchase_at: null,
        last_purchase_at: null,
      })
      .returning("*");
    return row;
  }

  const merge: Record<string, unknown> = {
    name: data.name,
    updated_at: new Date(),
  };
  if (data.city != null) merge.city = data.city;
  if (data.province != null) merge.province = data.province;

  const [row] = await db(this.table)
    .insert({
      name: data.name,
      email: data.email,
      city: data.city ?? null,
      province: data.province ?? null,
      first_purchase_at: null,
      last_purchase_at: null,
    })
    .onConflict("email")
    .merge(merge)
    .returning("*");
  return row;
}
```

- [ ] **Step 4: Adicionar a rota**

Em `src/routers/customer.router.ts`, após o GET `/`:

```ts
fastify.post('/', {
  onRequest: [fastify.authenticate],
  preHandler: [requireRole(['ADMIN', 'SUPER_ADMIN'])],
  schema: {
    body: z.object({
      name: z.string().min(1, 'Nome é obrigatório').max(255),
      email: z.string().email('Email inválido').optional(),
      city: z.string().max(255).optional(),
      province: z.string().max(10).optional(),
    }),
  },
}, async (request, reply) => {
  try {
    const customer = await customerService.createCustomer(request.body);
    return reply.code(201).send(customer);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
});
```

- [ ] **Step 5: Rodar testes + lint**

Run: `npm test` → todos PASS. Run: `npm run lint` → sem erros.

---

## Task 3 (Backend): `product_name`/`variant_name` nos itens do pedido

**Files:**
- Modify: `aurasync-backend/src/repositories/order.repository.ts` (`findById`, `findAll`)
- Modify: `aurasync-backend/src/schemas/order.schema.ts` (`OrderItemBaseSchema`)
- Test: `aurasync-backend/src/services/order.service.integration.test.ts`

**Interfaces:**
- Produces: `OrderItem` da resposta ganha `product_name?: string | null` e `variant_name?: string | null` (join com `product_variants` + `products`).

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `src/services/order.service.integration.test.ts` (verifique os helpers existentes do arquivo para criar pedido com item; use o padrão do arquivo):

```ts
it("returns product_name and variant_name on order items", async () => {
  // ...reusa o setup existente do arquivo (product + order + item)...
  const result: any = await orderService.getOrder(existingOrderId); // ou método equivalente do arquivo
  const item = result.items[0];
  assert.strictEqual(item.product_name, "Customer Test Product");
  assert.ok(item.variant_name != null);
});
```

(Ajuste os nomes das variáveis de acordo com o setup real do arquivo.)

Run: `npm test`
Expected: FAIL — `product_name` undefined.

- [ ] **Step 2: Enriquecer as queries de itens**

Em `src/repositories/order.repository.ts`, no `findById`, troque:

```ts
const items = await db(this.itemsTable)
  .where({ order_id: id, status: true });
```

por:

```ts
const items = await db(this.itemsTable)
  .join("product_variants", "product_variants.id", "order_items.variant_id")
  .join("products", "products.id", "product_variants.product_id")
  .where({ "order_items.order_id": id, "order_items.status": true })
  .select(
    "order_items.*",
    "products.name as product_name",
    "product_variants.name as variant_name"
  );
```

E em `findAll`, no `ordersWithItems.map`, troque:

```ts
const items = await db(this.itemsTable)
  .where({ order_id: order.id, status: true });
```

por:

```ts
const items = await db(this.itemsTable)
  .join("product_variants", "product_variants.id", "order_items.variant_id")
  .join("products", "products.id", "product_variants.product_id")
  .where({ "order_items.order_id": order.id, "order_items.status": true })
  .select(
    "order_items.*",
    "products.name as product_name",
    "product_variants.name as variant_name"
  );
```

- [ ] **Step 3: Atualizar o schema**

Em `src/schemas/order.schema.ts`, dentro de `OrderItemBaseSchema`, após `variant_id`:

```ts
product_name: z.string().nullable().optional(),
variant_name: z.string().nullable().optional(),
```

- [ ] **Step 4: Rodar testes + lint**

Run: `npm test` → todos PASS. Run: `npm run lint` → sem erros.

---

## Task 4 (Backend): `category` no top_products + busca de produto por UUID de variante

**Files:**
- Modify: `aurasync-backend/src/repositories/dashboard.repository.ts` (topProducts)
- Modify: `aurasync-backend/src/schemas/dashboard.schema.ts` (`TopProductItem`)
- Modify: `aurasync-backend/src/repositories/product.repository.ts` (search)
- Test: `aurasync-backend/src/services/dashboard.service.integration.test.ts`

**Interfaces:**
- Produces: `TopProductItem.category: string | null`. Busca de produtos (`GET /products?search=`) passa a aceitar UUID completo da variante.

- [ ] **Step 1: Escrever os testes que falham**

Em `dashboard.service.integration.test.ts` (setup existente já cria produto com `category: "Category A"`):

```ts
it("includes product category on top products", async () => {
  const result = await dashboardService.getOrdersStats(30);
  const top = result.top_products.find((p: any) => p.product_id === productId);
  assert.ok(top);
  assert.strictEqual(top.category, "Category A");
});
```

Em `product.service.integration.test.ts` (verifique o padrão do arquivo para criar variante; a busca é via `productService.listProducts`):

```ts
it("finds products by variant uuid", async () => {
  // cria produto/variante com o padrão do arquivo e guarda variant.id
  const result: any = await productService.listProducts(1, 10, { search: variantId });
  assert.strictEqual(result.total, 1);
});
```

Run: `npm test`
Expected: FAIL — `category` undefined e busca não encontra por UUID.

- [ ] **Step 2: Adicionar category ao topProducts**

Em `src/repositories/dashboard.repository.ts`, no `topProducts`: adicione `"products.category"` ao `groupBy` e ao select:

```ts
.groupBy("products.id", "products.name", "products.category", "product_variants.name")
.select(
  "products.id as product_id",
  "products.name as product_name",
  "products.category",
  "product_variants.name as variant_name",
  ...
```

Em `src/schemas/dashboard.schema.ts`, no `TopProductItem`, após `product_name`:

```ts
category: z.string().nullable(),
```

- [ ] **Step 3: Busca por UUID de variante**

Em `src/repositories/product.repository.ts`, dentro do `whereExists` de `filters.search` (bloco `b`):

```ts
b.where('product_variants.sku', 'ilike', term)
  .orWhere('product_variants.name', 'ilike', term)
  .orWhere('product_variants.nuvemshop_variant_id', 'ilike', term)
  .orWhere(db.raw('product_variants.id::text'), 'ilike', term);
```

- [ ] **Step 4: Rodar testes + lint**

Run: `npm test` → todos PASS. Run: `npm run lint` → sem erros.

---

## Task 5 (Frontend): Formatters — novos rótulos e helpers (+ testes)

**Files:**
- Modify: `aurasync-admin-portal/src/lib/formatters.ts`
- Test: `aurasync-admin-portal/src/lib/formatters.test.ts`

**Interfaces:**
- Produces (exportados para as Tasks 6–10): `roleLabel`, `utmSourceLabel`, `utmMediumLabel`, `capitalizeWords`, `effectiveOrderStatus({ status, paid_at?, shipped_at?, completed_at?, cancelled_at? }) → { key, label }`, dicionários atualizados (`statusLabels`, `typeLabels`, `storefrontLabels`, `paymentMethodLabels`).

- [ ] **Step 1: Escrever os testes que falham**

Adicione a `src/lib/formatters.test.ts` (imports: `roleLabel, utmSourceLabel, utmMediumLabel, capitalizeWords, effectiveOrderStatus`):

```ts
describe('rótulos novos', () => {
  it('traduz papéis de usuário', () => {
    expect(roleLabel('ADMIN')).toBe('Admin');
    expect(roleLabel('EMPLOYEE')).toBe('Funcionário');
    expect(roleLabel('SUPER_ADMIN')).toBe('Super Admin');
    expect(roleLabel('DESCONHECIDO')).toBe('DESCONHECIDO');
  });

  it('traduz fontes UTM', () => {
    expect(utmSourceLabel('ig')).toBe('Instagram');
    expect(utmSourceLabel('fb')).toBe('Facebook');
    expect(utmSourceLabel('IGShopping')).toBe('Instagram Shopping');
    expect(utmSourceLabel('nuvem-app')).toBe('Nuvemshop App');
    expect(utmSourceLabel('chatgpt.com')).toBe('Chat GPT');
    expect(utmSourceLabel(null)).toBe('Orgânico');
    expect(utmSourceLabel('N/A')).toBe('Orgânico');
    expect(utmSourceLabel('google ads')).toBe('Google Ads');
  });

  it('traduz mídias UTM', () => {
    expect(utmMediumLabel('paid')).toBe('Pago');
    expect(utmMediumLabel('social')).toBe('Social');
    expect(utmMediumLabel('referral')).toBe('Indicação');
    expect(utmMediumLabel(null)).toBe('Orgânico');
    expect(utmMediumLabel('unknown_medium')).toBe('Unknown Medium');
  });

  it('capitaliza palavras', () => {
    expect(capitalizeWords('nuvem-app')).toBe('Nuvem App');
    expect(capitalizeWords('foo bar')).toBe('Foo Bar');
  });

  it('deriva o status efetivo pela linha do tempo', () => {
    expect(effectiveOrderStatus({ status: 'PENDING', paid_at: 'x', shipped_at: 'x', completed_at: 'x' }).label).toBe('Entregue');
    expect(effectiveOrderStatus({ status: 'PENDING', paid_at: 'x', shipped_at: 'x' }).label).toBe('Enviado');
    expect(effectiveOrderStatus({ status: 'PENDING', paid_at: 'x' }).label).toBe('Pago');
    expect(effectiveOrderStatus({ status: 'PENDING', cancelled_at: 'x', completed_at: 'x' }).label).toBe('Cancelado');
    expect(effectiveOrderStatus({ status: 'DISPATCHED' }).label).toBe('Despachado');
    expect(effectiveOrderStatus({ status: 'UNPACKED' }).label).toBe('Empacotando');
    expect(effectiveOrderStatus({ status: 'MARKED_AS_FULFILLED' }).label).toBe('Marcado como Concluído');
  });

  it('traduz tipos novos do motor de custos', () => {
    expect(typeLabel('PACKAGING')).toBe('Embalagem');
    expect(typeLabel('MONTHLY_FIXED')).toBe('Mensal fixo');
    expect(typeLabel('MONTHLY_PERCENT')).toBe('Mensal (%)');
  });

  it('ajusta pix e storefronts', () => {
    expect(paymentMethodLabel('pix')).toBe('Pix');
    expect(storefrontLabel('mobile')).toBe('Mobile');
    expect(storefrontLabel('store')).toBe('Site');
    expect(storefrontLabel('web')).toBe('Site');
  });
});
```

Run: `npm test`
Expected: FAIL — imports inexistentes/funções ausentes.

- [ ] **Step 2: Implementar os helpers em formatters.ts**

Em `src/lib/formatters.ts`:

- `paymentMethodLabels.pix`: `'PIX'` → `'Pix'`
- `statusLabels`: adicionar `DISPATCHED: 'Despachado'`, `UNPACKED: 'Empacotando'`, `MARKED_AS_FULFILLED: 'Marcado como Concluído'`
- `typeLabels`: adicionar `PACKAGING: 'Embalagem'`, `MONTHLY_FIXED: 'Mensal fixo'`, `MONTHLY_PERCENT: 'Mensal (%)'`
- `storefrontLabels`: `{ mobile: 'Mobile', store: 'Site', web: 'Site', other_devices: 'Outros dispositivos' }`
- Adicionar ao final do arquivo:

```ts
const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  EMPLOYEE: 'Funcionário',
  SUPER_ADMIN: 'Super Admin',
};

export function roleLabel(role: string): string {
  return roleLabels[role] ?? role;
}

export function capitalizeWords(value: string): string {
  return value
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const utmSourceLabels: Record<string, string> = {
  ig: 'Instagram',
  fb: 'Facebook',
  IGShopping: 'Instagram Shopping',
  'nuvem-app': 'Nuvemshop App',
  'chatgpt.com': 'Chat GPT',
};

export function utmSourceLabel(value: string | null | undefined): string {
  if (!value || value === 'N/A') return 'Orgânico';
  return utmSourceLabels[value] ?? capitalizeWords(value);
}

const utmMediumLabels: Record<string, string> = {
  paid: 'Pago',
  social: 'Social',
  referral: 'Indicação',
};

export function utmMediumLabel(value: string | null | undefined): string {
  if (!value || value === 'N/A') return 'Orgânico';
  return utmMediumLabels[value] ?? capitalizeWords(value);
}

export interface OrderStatusLike {
  status: string;
  paid_at?: string | null;
  shipped_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export function effectiveOrderStatus(order: OrderStatusLike): { key: string; label: string } {
  if (order.cancelled_at) return { key: 'cancelled', label: 'Cancelado' };
  if (order.completed_at) return { key: 'delivered', label: 'Entregue' };
  if (order.shipped_at) return { key: 'shipped', label: 'Enviado' };
  if (order.paid_at) return { key: 'paid', label: 'Pago' };
  return { key: order.status, label: statusLabel(order.status) };
}
```

- [ ] **Step 3: Rodar testes + lint + build**

Run: `npm test` → PASS. Run: `npm run lint` → sem erros. Run: `npm run build` → OK.

---

## Task 6 (Frontend): Dashboard — filtro de datas, labels, gráficos

**Files:**
- Modify: `src/hooks/useDashboard.ts`
- Modify: `src/components/dashboard/KpiCards.tsx`
- Modify: `src/components/dashboard/RevenueChart.tsx`
- Modify: `src/components/dashboard/OrdersCharts.tsx`
- Modify: `src/components/dashboard/TopProducts.tsx`
- Modify: `src/components/dashboard/MarketingSection.tsx`
- Modify: `src/components/dashboard/StockSection.tsx`
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: `roleLabel`, `statusLabel`, `utmSourceLabel`, `utmMediumLabel`, `paymentMethodLabel`, `storefrontLabel` (Task 5); backend `TopProductItem.category` (Task 4).
- Produces: `useDashboard` passa a enviar `start_date`/`end_date` como `YYYY-MM-DD` local (contrato da Task 1).

- [ ] **Step 1: useDashboard — datas locais**

Em `src/hooks/useDashboard.ts`, adicione `import { format } from 'date-fns';` e troque `toIsoStart`/`toIsoEnd` por:

```ts
function toLocalDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
```

No `params()`:

```ts
if (range.from && range.to) {
  base.start_date = toLocalDate(range.from);
  base.end_date = toLocalDate(range.to);
  const diffDays = Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
  base.days = diffDays;
}
```

(remove as funções `toIsoStart`/`toIsoEnd`).

- [ ] **Step 2: KpiCards — roles PT-BR**

Em `src/components/dashboard/KpiCards.tsx`, importe `roleLabel` de `@/lib/formatters` e troque:

```tsx
{Object.entries(userStats.byRole).map(([role, count]) => (
  <Badge key={role} variant="outline">{role}: {count}</Badge>
))}
```

por:

```tsx
{Object.entries(userStats.byRole).map(([role, count]) => (
  <Badge key={role} variant="outline">{roleLabel(role)}: {count}</Badge>
))}
```

- [ ] **Step 3: RevenueChart — ordem crescente**

Em `src/components/dashboard/RevenueChart.tsx`, troque `data={data}` do `AreaChart` por:

```tsx
data={[...data].sort((a, b) => a.date.localeCompare(b.date))}
```

- [ ] **Step 4: OrdersCharts — status traduzidos**

Em `src/components/dashboard/OrdersCharts.tsx`, importe `statusLabel` e troque o label do `Pie`:

```tsx
label={({ status, count }) => `${statusLabel(status)}: ${count}`}
```

- [ ] **Step 5: types — category no TopProductItem**

Em `src/types/index.ts`, em `TopProductItem`, adicione:

```ts
category?: string | null;
```

- [ ] **Step 6: TopProducts — toggle Por Produto / Por Categoria**

Em `src/components/dashboard/TopProducts.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

Dentro do componente:

```tsx
const [view, setView] = useState<'product' | 'category'>('product');

const byCategory = useMemo(() => {
  const map = new Map<string, { category: string; total_sold: number; revenue: number }>();
  for (const item of data ?? []) {
    const key = item.category || 'Outros';
    const agg = map.get(key) ?? { category: key, total_sold: 0, revenue: 0 };
    agg.total_sold += item.total_sold;
    agg.revenue += item.revenue;
    map.set(key, agg);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}, [data]);
```

No `CardHeader`, junto ao título:

```tsx
<Tabs value={view} onValueChange={(v) => setView(v as 'product' | 'category')}>
  <TabsList>
    <TabsTrigger value="product">Por Produto</TabsTrigger>
    <TabsTrigger value="category">Por Categoria</TabsTrigger>
  </TabsList>
</Tabs>
```

No corpo da tabela, condicione as linhas (headers: Produto/Variante/Vendidos/Receita para produtos; Categoria/Vendidos/Receita para categorias):

```tsx
{view === 'product' ? (
  data.map((item) => (
    <TableRow key={item.product_id}>
      <TableCell className="font-medium">{item.product_name}</TableCell>
      <TableCell>{item.variant_name || '-'}</TableCell>
      <TableCell className="text-right">{item.total_sold}</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
    </TableRow>
  ))
) : (
  byCategory.map((item) => (
    <TableRow key={item.category}>
      <TableCell className="font-medium">{item.category}</TableCell>
      <TableCell className="text-right">{item.total_sold}</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
    </TableRow>
  ))
)}
```

(Header condicional: em `view === 'product'`, 4 colunas como hoje; em `view === 'category'`, 3 colunas: Categoria/Vendidos/Receita.)

- [ ] **Step 7: MarketingSection — lojas, pagamentos, campanhas, UTMs, Estado**

Em `src/components/dashboard/MarketingSection.tsx`:

1. Importe `storefrontLabel, paymentMethodLabel, utmSourceLabel, utmMediumLabel`.
2. Loja: mapeie os dados antes do BarChart:

```tsx
const storefrontData = (data.by_storefront ?? []).map((s) => ({ ...s, storefront: storefrontLabel(s.storefront) }));
```

use `storefrontData` no `<BarChart data={...}>` (com `!storefrontData.length` no check).
3. Pagamento: label do Pie:

```tsx
label={({ method }) => paymentMethodLabel(method)}
```

4. Campanhas (preencher o espaço da div): no Card de Campanhas, `className="flex flex-col"`; no `CardContent`, `className="flex-1 min-h-0"`; no container da tabela troque `max-h-[300px] overflow-y-auto` por `h-full max-h-[300px] overflow-y-auto`.
5. UTMs: células:

```tsx
<TableCell>{utmSourceLabel(src.source)}</TableCell>
<TableCell>{utmMediumLabel(src.medium)}</TableCell>
```

6. Províncias: título `Vendas por Estado`, header da coluna `Estado`.

- [ ] **Step 8: StockSection — remover card Valor em Estoque por Categoria**

Em `src/components/dashboard/StockSection.tsx`, remova todo o bloco do card `{/* Stock Value by Category */}` e limpe imports não usados (`BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, formatCurrency` — mantenha `Badge`, `Table`, `Skeleton`).

- [ ] **Step 9: Verificação**

Run: `npm test`, `npm run lint`, `npm run build` — todos sem erro.

---

## Task 7 (Frontend): Página Produtos

**Files:**
- Modify: `src/pages/Products.tsx`

- [ ] **Step 1: Coluna "Variações" → "Estoque Local"**

Em `src/pages/Products.tsx`, troque o header:

```tsx
<TableHead className="w-[11%]">Variações</TableHead>
```

por:

```tsx
<TableHead className="w-[11%]">Estoque Local</TableHead>
```

E a célula:

```tsx
<TableCell className="text-muted-foreground">
  {product.variants?.length || 0}
</TableCell>
```

por:

```tsx
<TableCell>
  <StockIndicator quantity={product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0} />
</TableCell>
```

- [ ] **Step 2: Remover coluna Ações (e dialog/mutation de exclusão)**

Remova:
- `{admin ? <TableHead className="w-[8%] text-center">Ações</TableHead> : null}` do header;
- o bloco `{admin ? (<TableCell className="text-center" ...>...</TableCell>) : null}` do corpo;
- `deleteDialogOpen`/`deletingProduct` state, `deleteMutation`, `handleDeleteClick`, `confirmDelete`;
- o `<AlertDialog ...>...</AlertDialog>` do final;
- imports não usados: `AlertDialog*`, `Trash2` (e `useMutation`, `Product`, `ApiError` se ficarem sem uso — confira).

- [ ] **Step 3: Remover coluna ID Variante**

Na tabela de variantes expandida, remova o `<th>ID Variante</th>` e o `<td>{variant.id}</td>`. Ajuste `colSpan` das duas linhas expandidas de `admin ? 6 : 5` para `5`.

- [ ] **Step 4: Verificação**

Run: `npm test`, `npm run lint`, `npm run build` — sem erros. Teste manual: busca por UUID completo de variante continua encontrando o produto (via Task 4).

---

## Task 8 (Frontend): Página Pedidos

**Files:**
- Modify: `src/types/index.ts` (`OrderItem`)
- Modify: `src/components/OrderItemsTable.tsx`
- Modify: `src/pages/Orders.tsx`

**Interfaces:**
- Consumes: backend items com `product_name`/`variant_name` (Task 3); `effectiveOrderStatus`, `utmSourceLabel`, `utmMediumLabel`, `capitalizeWords` (Task 5).

- [ ] **Step 1: types**

Em `src/types/index.ts`, em `OrderItem`, após `variant_id`:

```ts
product_name?: string | null;
variant_name?: string | null;
```

- [ ] **Step 2: OrderItemsTable — nome do produto + copiar variante**

Em `src/components/OrderItemsTable.tsx`:
- imports: `import { Copy, ChevronDown, ChevronUp } from "lucide-react";` e `import { toast } from "sonner";`
- helper no topo do arquivo:

```ts
async function copyVariantId(id: string) {
  try {
    await navigator.clipboard.writeText(id);
    toast.success('ID da variante copiado');
  } catch {
    toast.error('Falha ao copiar');
  }
}
```

- Header: `<TableHead>Variante</TableHead>` → `<TableHead>Produto</TableHead>`
- Célula do item: troque `<TableCell className="font-mono text-xs">{item.variant_id.slice(0, 8)}</TableCell>` por:

```tsx
<TableCell>
  <div className="flex items-center gap-1">
    <div className="min-w-0">
      <p className="truncate font-medium">{item.product_name ?? '-'}</p>
      {item.variant_name ? (
        <p className="truncate text-xs text-muted-foreground">{item.variant_name}</p>
      ) : null}
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
      title="Copiar ID da variante"
      onClick={() => copyVariantId(item.variant_id)}
    >
      <Copy className="h-3 w-3" />
    </Button>
  </div>
</TableCell>
```

(O breakdown expandido já usa `typeLabel`, atualizado na Task 5.)

- [ ] **Step 3: Orders.tsx — status efetivo na tabela e no drawer**

Importe `effectiveOrderStatus` de `@/lib/formatters`.

Adicione a `statusBadgeClass`:

```ts
delivered: 'bg-green-100 text-green-800 hover:bg-green-100 border-transparent',
```

Na linha da tabela principal, troque o `<Badge>` de status:

```tsx
{(() => {
  const effective = effectiveOrderStatus(order);
  return (
    <Badge className={statusBadgeClass[effective.key] || ''} variant={effective.key === 'cancelled' ? 'destructive' : 'default'}>
      {effective.label}
    </Badge>
  );
})()}
```

No drawer (`Sheet`), troque o primeiro badge:

```tsx
<Badge className={statusBadgeClass[selectedOrder.status] || ''} variant={...}>
  {preferLabel(selectedOrder.status_label, statusLabel(selectedOrder.status))}
</Badge>
```

por:

```tsx
{(() => {
  const effective = effectiveOrderStatus(selectedOrder);
  return (
    <Badge className={statusBadgeClass[effective.key] || ''} variant={effective.key === 'cancelled' ? 'destructive' : 'default'}>
      {effective.label}
    </Badge>
  );
})()}
```

(remova `preferLabel` dos imports se ficar sem uso; verifique os outros usos antes.)

- [ ] **Step 4: UTMs traduzidas e capitalizadas**

Importe `utmSourceLabel, utmMediumLabel, capitalizeWords`. Troque o bloco UTMs:

```tsx
{selectedOrder.utm_source ? <p>Source: {selectedOrder.utm_source}</p> : null}
{selectedOrder.utm_medium ? <p>Medium: {selectedOrder.utm_medium}</p> : null}
{selectedOrder.utm_campaign ? <p>Campanha: {selectedOrder.utm_campaign}</p> : null}
{selectedOrder.utm_content ? <p>Conteúdo: {selectedOrder.utm_content}</p> : null}
{selectedOrder.utm_term ? <p>Termo: {selectedOrder.utm_term}</p> : null}
```

por:

```tsx
{selectedOrder.utm_source ? <p><span className="text-muted-foreground">Fonte: </span>{utmSourceLabel(selectedOrder.utm_source)}</p> : null}
{selectedOrder.utm_medium ? <p><span className="text-muted-foreground">Mídia: </span>{utmMediumLabel(selectedOrder.utm_medium)}</p> : null}
{selectedOrder.utm_campaign ? <p><span className="text-muted-foreground">Campanha: </span>{capitalizeWords(selectedOrder.utm_campaign)}</p> : null}
{selectedOrder.utm_content ? <p><span className="text-muted-foreground">Conteúdo: </span>{capitalizeWords(selectedOrder.utm_content)}</p> : null}
{selectedOrder.utm_term ? <p><span className="text-muted-foreground">Termo: </span>{capitalizeWords(selectedOrder.utm_term)}</p> : null}
```

- [ ] **Step 5: Verificação**

Run: `npm test`, `npm run lint`, `npm run build` — sem erros.

---

## Task 9 (Frontend): Venda Externa

**Files:**
- Modify: `src/types/index.ts` (`ExternalSalePayload`, novo `CreateCustomerPayload`)
- Modify: `src/services/api.ts` (`customersApi.create`)
- Modify: `src/lib/schemas.ts` (`externalSaleSchema` + `customerCreateSchema`)
- Modify: `src/components/VariantPicker.tsx`
- Create: `src/components/sales/CreateCustomerDialog.tsx`
- Modify: `src/pages/Sales.tsx`

**Interfaces:**
- Consumes: `POST /customers` (Task 2).
- Produces: `CreateCustomerDialog({ open, onOpenChange, onCreated: (customer: Customer) => void })`.

- [ ] **Step 1: types + api + schema**

`src/types/index.ts`: em `ExternalSalePayload`, adicione `is_fair?: boolean;`. Adicione:

```ts
export interface CreateCustomerPayload {
  name: string;
  email?: string;
  city?: string;
  province?: string;
}
```

`src/services/api.ts`, em `customersApi`:

```ts
create: async (payload: CreateCustomerPayload): Promise<Customer> => {
  const response = await api.post<Customer>('/customers', payload);
  return response.data;
},
```

(importe `CreateCustomerPayload` no import de types do arquivo.)

`src/lib/schemas.ts`: em `externalSaleSchema`, adicione `is_fair: z.boolean().optional().default(false),`. Adicione:

```ts
export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  city: z.string().max(255).optional(),
  province: z.string().max(10).optional(),
});

export type CustomerCreateFormValues = z.infer<typeof customerCreateSchema>;
```

- [ ] **Step 2: VariantPicker — trigger com nome + valor**

Em `src/components/VariantPicker.tsx`, importe `formatCurrency` e troque o conteúdo do trigger:

```tsx
{value ? `${value.product_name} — ${value.variant_name} · ${formatCurrency(value.price)}` : placeholder}
```

com classes `w-full justify-between font-normal h-10 truncate` (adicione `truncate` e `h-10`).

- [ ] **Step 3: Criar CreateCustomerDialog**

`src/components/sales/CreateCustomerDialog.tsx`:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { customersApi } from '@/services/api';
import { customerCreateSchema, type CustomerCreateFormValues } from '@/lib/schemas';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Customer, ApiError } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
}

export default function CreateCustomerDialog({ open, onOpenChange, onCreated }: Props) {
  const qc = useQueryClient();
  const form = useForm<CustomerCreateFormValues>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: { name: '', email: '', city: '', province: '' },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CustomerCreateFormValues) => customersApi.create({
      name: payload.name.trim(),
      email: payload.email?.trim() ? payload.email.trim() : undefined,
      city: payload.city?.trim() ? payload.city.trim() : undefined,
      province: payload.province?.trim() ? payload.province.trim() : undefined,
    }),
    onSuccess: (customer) => {
      toast.success('Cliente criado com sucesso');
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['external-sales-customers'] });
      onCreated(customer);
      form.reset();
      onOpenChange(false);
    },
    onError: (err: ApiError) => toast.error(
      `Falha ao criar cliente: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`
    ),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar cliente</DialogTitle>
          <DialogDescription>Cadastre um novo cliente para usar nesta venda.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="new-customer-name">Nome *</Label>
            <Input id="new-customer-name" placeholder="Nome do cliente" {...form.register('name')} />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-customer-email">Email</Label>
            <Input id="new-customer-email" type="email" placeholder="email@exemplo.com" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="new-customer-city">Cidade</Label>
              <Input id="new-customer-city" placeholder="Cidade" {...form.register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-customer-province">UF</Label>
              <Input id="new-customer-province" placeholder="UF" {...form.register('province')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Sales.tsx — layout, bordas, botão cliente, is_fair**

Em `src/pages/Sales.tsx`:

1. Form: `className="space-y-6 max-w-3xl"` → `className="w-full max-w-6xl space-y-6"`.
2. Bordas: nos três sections `border rounded-lg p-4` → `border-input rounded-lg p-4`; nos cards de item `border rounded-md p-3` → `border-input rounded-md p-3`.
3. Header da seção Cliente:

```tsx
<div className="flex items-center justify-between">
  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cliente</h3>
  <Button type="button" variant="outline" size="sm" onClick={() => setCustomerDialogOpen(true)}>
    <Plus className="h-3 w-3 mr-1" />
    Adicionar cliente
  </Button>
</div>
```

(estado: `const [customerDialogOpen, setCustomerDialogOpen] = useState(false);`)

4. Itens: envolva o VariantPicker com label:

```tsx
<div className="space-y-2">
  <Label>Produto</Label>
  <VariantPicker
    value={pickedVariants[index] ?? null}
    onSelect={(variant: PickedVariant) => selectVariant(index, variant)}
  />
</div>
```

5. `is_fair`: em defaultValues e nos dois `form.reset({...})` adicione `is_fair: false`. No payload do `createMutation` adicione `is_fair: payload.is_fair ?? false,`. Na seção "Pagamento e frete", adicione:

```tsx
<div className="flex items-center gap-2 pt-1">
  <Switch
    id="sale-is-fair"
    checked={form.watch('is_fair') ?? false}
    onCheckedChange={(checked) => form.setValue('is_fair', checked)}
  />
  <Label htmlFor="sale-is-fair" className="cursor-pointer">Venda de Feira</Label>
</div>
```

(imports: `Switch` de `@/components/ui/switch`.)

6. No final do componente, antes de `SaleResultDialog`:

```tsx
<CreateCustomerDialog
  open={customerDialogOpen}
  onOpenChange={setCustomerDialogOpen}
  onCreated={(customer) => {
    form.setValue('customer_name', customer.name);
    form.setValue('customer_email', customer.email ?? '');
  }}
/>
```

(importe o componente.)

- [ ] **Step 5: Verificação**

Run: `npm test`, `npm run lint`, `npm run build` — sem erros.

---

## Task 10 (Frontend): Clientes — última compra = primeira quando única

**Files:**
- Modify: `src/pages/Customers.tsx`
- Modify: `src/components/customers/CustomerDetailDrawer.tsx`

- [ ] **Step 1: Tabela**

Em `src/pages/Customers.tsx`, na célula "Última compra":

```tsx
<TableCell className="text-right">{formatDate(customer.last_purchase_at)}</TableCell>
```

→

```tsx
<TableCell className="text-right">{formatDate(customer.last_purchase_at ?? customer.first_purchase_at)}</TableCell>
```

- [ ] **Step 2: Drawer**

Em `src/components/customers/CustomerDetailDrawer.tsx`:

```tsx
<SummaryRow label="Última compra" value={formatDate(indicators.last_purchase_at)} />
```

→

```tsx
<SummaryRow label="Última compra" value={formatDate(indicators.last_purchase_at ?? indicators.first_purchase_at)} />
```

- [ ] **Step 3: Verificação**

Run: `npm test`, `npm run lint`, `npm run build` — sem erros.
