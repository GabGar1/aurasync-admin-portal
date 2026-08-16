# Alinhamento com Backend P0 — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinhar o AuraSync Admin Portal ao backend P0 (Motor de Custos, Venda Externa, Clientes, Pedidos enriquecidos, Dashboard com range de datas), seguindo a spec `docs/superpowers/specs/2026-08-01-backend-alignment-design.md`.

**Architecture:** Segue o AGENTS.md (Page → Components → Hooks → Service → Backend). React Query para estado de servidor, RHF + Zod para forms, shadcn/ui para UI, `services/api.ts` como única camada HTTP (cookie + CSRF já configurados via axios defaults). Sem cálculo de custo/lucro/margem no front — sempre exibir valores da API.

**Tech Stack:** React 18, TypeScript, Vite, React Router 6, TanStack Query 5, Axios, React Hook Form + Zod, shadcn/ui, TailwindCSS, Vitest.

## Global Constraints

- Toda mutação (POST/PUT/DELETE) é admin-only e já envia CSRF via axios (`withXSRFToken`). Não adicionar nada de CSRF.
- Endpoints de Custos, Venda Externa, Clientes, Pedidos, Dashboard: exigem ADMIN/SUPER_ADMIN. Ocultar rotas/ações para EMPLOYEE (`isAdmin` em `src/lib/utils.ts`).
- Nunca calcular custo/lucro/margem no front — exibir valores da API formatados com `formatCurrency` (`Intl.NumberFormat('pt-BR')`).
- Nunca duplicar URLs de endpoint — usar `services/api.ts`.
- Nunca chamar `fetch()` diretamente.
- Validação sempre com Zod (schemas em `src/lib/schemas.ts`, espelhando o backend).
- Sem textos em inglês visíveis — PT-BR em toda a UI.
- Verificação ao final de cada task: `npx tsc --noEmit`, `npm run lint` e `npm run test` sem erros novos. Build completo só na Task 12.
- Tipos e nomes: seguir exatamente os definidos nas tasks anteriores (Interfaces/Produces).

---

### Task 1: Tipos enriquecidos

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: nada (base do projeto)
- Produces: `CostComponent`, `CostComponentPayload`, `CostAssociation`, `CostBreakdownItem`, `CostSimulateInput`, `CostSimulateResponse`, `ExternalSalePayload`, `ExternalSaleResult`, `ExternalSaleResultItem`, `Customer`, `CustomerIndicators`, `CustomerDetail`, `CustomerOrder`, `GetCustomersResponse`, `Order` (enriquecida), `OrderItem` (enriquecida) — usados por todas as tasks seguintes. `Order` nova é superset da antiga (a página Orders atual continua compilando).

- [ ] **Step 1: Adicionar tipos novos e substituir `Order`/`OrderItem`**

Em `src/types/index.ts`:

1. Substituir o bloco `OrderItem` (linhas 67-74) por:

```ts
export interface CostBreakdownItem {
  component_id: string | null;
  name: string;
  type: string;
  category: string;
  unit_value: number;
  quantity: number;
  line_total: number;
}

export interface OrderItem {
  id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  unit_packaging_cost: number;
  unit_platform_fee: number;
  unit_tax: number;
  unit_shipping_cost: number;
  unit_operational_cost: number;
  unit_marketing_cost: number;
  unit_other_cost: number;
  unit_total_cost: number;
  unit_profit: number;
  margin_percent: number;
  cost_breakdown: CostBreakdownItem[] | null;
  has_promotional_price: boolean | null;
  status: boolean;
}
```

2. Substituir a interface `Order` (linhas 87-97) por:

```ts
export interface Order {
  id: string;
  nuvemshop_order_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  status_label?: string;
  payment_status_label?: string;
  fulfillment_status_label?: string;
  commercial_status?: string;
  total_amount: number;
  total_cost?: number;
  total_profit?: number;
  margin_percent?: number;
  source?: string;
  storefront?: string | null;
  discount_amount: number | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  payment_method: string | null;
  payment_installments: number | null;
  gateway: string | null;
  has_free_shipping: boolean | null;
  shipping_cost_customer: number | null;
  shipping_cost_owner: number | null;
  shipping_carrier: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  items: OrderItem[];
}
```

3. Adicionar ao final do arquivo (antes de `ApiError` ou após `UserStats` — ordem livre):

```ts
export type CostComponentType = 'FIXED' | 'PERCENT' | 'PER_ORDER' | 'MONTHLY';
export type CostComponentCategory = 'PACKAGING' | 'TAX' | 'FEE' | 'SHIPPING' | 'OPERATIONAL' | 'MARKETING' | 'OTHER';
export type CalculationBase = 'PRICE' | 'COST';

export interface CostComponent {
  id: string;
  name: string;
  description: string | null;
  type: CostComponentType;
  category: CostComponentCategory;
  value: number;
  calculation_base: CalculationBase;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostComponentPayload {
  name: string;
  description?: string | null;
  type: CostComponentType;
  category?: CostComponentCategory;
  value: number;
  calculation_base?: CalculationBase;
  is_active?: boolean;
}

export interface CostAssociation {
  id: string;
  product_id: string;
  cost_component_id: string;
  quantity: number;
  component?: CostComponent;
}

export interface CostSimulateInput {
  variant_id: string;
  unit_price: number;
  quantity: number;
}

export interface CostSimulateResponse {
  unit_cost: number;
  unit_packaging_cost: number;
  unit_platform_fee: number;
  unit_tax: number;
  unit_shipping_cost: number;
  unit_operational_cost: number;
  unit_marketing_cost: number;
  unit_other_cost: number;
  unit_total_cost: number;
  unit_profit: number;
  margin_percent: number;
  cost_breakdown: CostBreakdownItem[];
}

export interface ExternalSaleItemPayload {
  variant_id: string;
  quantity: number;
  unit_price: number;
}

export interface ExternalSalePayload {
  customer_name: string;
  customer_email?: string | null;
  items: ExternalSaleItemPayload[];
  discount_amount?: number;
  payment_method?: string;
  gateway?: string;
  payment_installments?: number;
  shipping_cost_owner?: number;
  shipping_cost_customer?: number;
  status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';
}

export interface ExternalSaleResultItem {
  id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  unit_total_cost: number;
  unit_profit: number;
  margin_percent: number;
  cost_breakdown: CostBreakdownItem[] | null;
  status: boolean;
}

export interface ExternalSaleResult {
  id: string;
  nuvemshop_order_id?: string | null;
  customer_name: string | null;
  status: string;
  total_amount: number;
  source?: string;
  discount_amount: number | null;
  shipping_cost_customer: number | null;
  shipping_cost_owner: number | null;
  payment_method: string | null;
  gateway: string | null;
  payment_installments: number | null;
  total_cost?: number;
  total_profit?: number;
  margin_percent?: number;
  created_at: string;
  updated_at: string;
  items: ExternalSaleResultItem[];
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  province: string | null;
  order_count: number;
  total_spent: number;
  average_ticket: number;
  first_purchase_at: string | null;
  last_purchase_at: string | null;
  created_at: string;
}

export interface CustomerIndicators {
  order_count: number;
  total_spent: number;
  average_ticket: number;
  first_purchase_at: string | null;
  last_purchase_at: string | null;
  favorite_payment_method: string | null;
  favorite_gateway: string | null;
  recurrence: number;
}

export interface CustomerDetail extends Customer {
  indicators: CustomerIndicators;
}

export interface CustomerOrder {
  id: string;
  customer_name: string | null;
  status: string;
  total_amount: number;
  created_at: string;
}

export interface GetCustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos (a página Orders atual deve continuar compilando — `Order.status` virou `string`, comparações com `=== 'cancelled'` continuam válidas).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add enriched order, cost, external sale and customer types"
```

---

### Task 2: Serviços de API

**Files:**
- Modify: `src/services/api.ts`

**Interfaces:**
- Consumes: tipos da Task 1
- Produces: `costComponentsApi.{list,create,update,delete,getByProduct,associate,removeAssociation,simulate}`, `externalSalesApi.{create,searchCustomers}`, `customersApi.{getAll,getById,getOrders}`, `dashboardApi.getOrders/getMarketing` com `(params: DashboardQueryParams)`. Usados pelas Tasks 6-11.

- [ ] **Step 1: Atualizar imports e dashboardApi**

Em `src/services/api.ts`:

1. No bloco de imports de tipos, adicionar:

```ts
  CostComponent, CostComponentPayload, CostAssociation, CostSimulateInput, CostSimulateResponse,
  ExternalSalePayload, ExternalSaleResult, Customer, CustomerDetail, CustomerOrder, GetCustomersResponse,
```

2. Substituir o objeto `dashboardApi` por:

```ts
export interface DashboardQueryParams {
  days?: number;
  start_date?: string;
  end_date?: string;
}

export const dashboardApi = {
  getOrders: async (params?: DashboardQueryParams): Promise<OrdersResponse> => {
    const response = await api.get<OrdersResponse>('/dashboard/orders', { params });
    return response.data;
  },
  getMarketing: async (params?: DashboardQueryParams): Promise<MarketingResponse> => {
    const response = await api.get<MarketingResponse>('/dashboard/marketing', { params });
    return response.data;
  },
  getStock: async (days?: number): Promise<StockResponse> => {
    const response = await api.get<StockResponse>('/dashboard/stock', { params: { days } });
    return response.data;
  },
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/users/stats');
    return response.data;
  },
};
```

- [ ] **Step 2: Adicionar os três novos grupos de métodos** (após `usersApi`, antes do `export default`)

```ts
export const costComponentsApi = {
  list: async (params?: { is_active?: boolean; search?: string }): Promise<CostComponent[]> => {
    const response = await api.get<CostComponent[]>('/cost-components', { params });
    return response.data;
  },

  create: async (payload: CostComponentPayload): Promise<CostComponent> => {
    const response = await api.post<CostComponent>('/cost-components', payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<CostComponentPayload>): Promise<CostComponent> => {
    const response = await api.put<CostComponent>(`/cost-components/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/cost-components/${id}`);
  },

  getByProduct: async (productId: string): Promise<{ associations: CostAssociation[] }> => {
    const response = await api.get<{ associations: CostAssociation[] }>(`/cost-components/product/${productId}`);
    return response.data;
  },

  associate: async (payload: { product_id: string; cost_component_id: string; quantity: number }): Promise<CostAssociation> => {
    const response = await api.post<CostAssociation>('/cost-components/associate', payload);
    return response.data;
  },

  removeAssociation: async (associationId: string): Promise<void> => {
    await api.delete(`/cost-components/associate/${associationId}`);
  },

  simulate: async (payload: CostSimulateInput): Promise<CostSimulateResponse> => {
    const response = await api.post<CostSimulateResponse>('/cost-components/simulate', payload);
    return response.data;
  },
};

export const externalSalesApi = {
  create: async (payload: ExternalSalePayload): Promise<ExternalSaleResult> => {
    const response = await api.post<ExternalSaleResult>('/external-sales', payload);
    return response.data;
  },

  searchCustomers: async (params?: { page?: number; limit?: number; search?: string }): Promise<GetCustomersResponse> => {
    const response = await api.get<GetCustomersResponse>('/external-sales/customers', { params });
    return response.data;
  },
};

export const customersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<GetCustomersResponse> => {
    const response = await api.get<GetCustomersResponse>('/customers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<CustomerDetail> => {
    const response = await api.get<CustomerDetail>(`/customers/${id}`);
    return response.data;
  },

  getOrders: async (id: string): Promise<CustomerOrder[]> => {
    const response = await api.get<CustomerOrder[]>(`/customers/${id}/orders`);
    return response.data;
  },
};
```

> Nota (desvio consciente da spec §5): o picker de variantes usará `productsApi.getAll` (busca já cobre produto + variantes, leitura pública) em vez de `GET /external-sales/products` — evita duplicar URL de endpoint (AGENTS.md §8) e é o mesmo dado (`productService.getProducts`). Não criar `externalSalesApi.searchProducts`.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/services/api.ts
git commit -m "feat(api): add cost components, external sales, customers and dashboard date params"
```

---

### Task 3: Glossário PT-BR (formatters) + testes

**Files:**
- Modify: `src/lib/formatters.ts`
- Test: `src/lib/formatters.test.ts` (novo)

**Interfaces:**
- Consumes: nada
- Produces: `typeLabel(type)`, `categoryLabel(category)`, `calculationBaseLabel(base)`, `storefrontLabel(value)`, `sourceLabel(value)`, `paymentMethodLabel(value)` (estendido), `statusLabel(status)` (estendido), `preferLabel(apiLabel, fallback)`, `marginPercent(value)`. Usados pelas Tasks 6-10.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/lib/formatters.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  typeLabel, categoryLabel, calculationBaseLabel, storefrontLabel,
  sourceLabel, paymentMethodLabel, statusLabel, preferLabel, marginPercent,
} from './formatters';

describe('glossário PT-BR', () => {
  it('traduz tipos de componente de custo', () => {
    expect(typeLabel('FIXED')).toBe('Valor fixo');
    expect(typeLabel('PERCENT')).toBe('Percentual');
    expect(typeLabel('PER_ORDER')).toBe('Por pedido');
    expect(typeLabel('MONTHLY')).toBe('Mensal (controle)');
    expect(typeLabel('desconhecido')).toBe('desconhecido');
  });

  it('traduz categorias de componente', () => {
    expect(categoryLabel('PACKAGING')).toBe('Embalagem');
    expect(categoryLabel('TAX')).toBe('Imposto');
    expect(categoryLabel('FEE')).toBe('Taxa');
    expect(categoryLabel('SHIPPING')).toBe('Frete');
    expect(categoryLabel('OPERATIONAL')).toBe('Operacional');
    expect(categoryLabel('MARKETING')).toBe('Marketing');
    expect(categoryLabel('OTHER')).toBe('Outros');
  });

  it('traduz base de cálculo', () => {
    expect(calculationBaseLabel('PRICE')).toBe('Preço de venda');
    expect(calculationBaseLabel('COST')).toBe('Custo do produto');
  });

  it('traduz storefront', () => {
    expect(storefrontLabel('mobile')).toBe('Celular');
    expect(storefrontLabel('web')).toBe('Site');
    expect(storefrontLabel('other_devices')).toBe('Outros dispositivos');
    expect(storefrontLabel(null)).toBe('-');
  });

  it('traduz origem do pedido', () => {
    expect(sourceLabel('NUVEMSHOP')).toBe('Nuvemshop');
    expect(sourceLabel('EXTERNAL')).toBe('Venda externa');
    expect(sourceLabel('EXTERNAL')).not.toBe('EXTERNAL');
  });

  it('traduz formas de pagamento estendidas', () => {
    expect(paymentMethodLabel('cash')).toBe('Dinheiro');
    expect(paymentMethodLabel('bank_transfer')).toBe('Transferência bancária');
    expect(paymentMethodLabel('credit_card')).toBe('Cartão de Crédito');
    expect(paymentMethodLabel('pix')).toBe('PIX');
  });

  it('traduz status estendidos', () => {
    expect(statusLabel('PENDING')).toBe('Pendente');
    expect(statusLabel('DELIVERED')).toBe('Entregue');
    expect(statusLabel('paid')).toBe('Pago');
  });

  it('prefere label da API, com fallback local', () => {
    expect(preferLabel('Venda concretizada', 'Em aberto')).toBe('Venda concretizada');
    expect(preferLabel(null, 'Em aberto')).toBe('Em aberto');
    expect(preferLabel(undefined, 'Em aberto')).toBe('Em aberto');
  });

  it('formata margem em percentual pt-BR', () => {
    expect(marginPercent(12.5)).toBe('12,5%');
    expect(marginPercent(0)).toBe('0%');
    expect(marginPercent(null)).toBe('-');
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

Run: `npm run test -- --run src/lib/formatters.test.ts`
Expected: FAIL — `typeLabel is not a function`.

- [ ] **Step 3: Implementar**

Em `src/lib/formatters.ts`:

1. Substituir `paymentMethodLabels` (linhas 29-35) por:

```ts
const paymentMethodLabels: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  boleto: 'Boleto',
  bank_transfer: 'Transferência bancária',
  cash: 'Dinheiro',
  nuvem_pago: 'Nuvem Pago',
};
```

2. Substituir `statusLabels` (linhas 42-48) por:

```ts
export const statusLabels: Record<string, string> = {
  open: 'Ativo',
  paid: 'Pago',
  shipped: 'Enviado',
  closed: 'Arquivado',
  cancelled: 'Cancelado',
  PENDING: 'Pendente',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
  refunded: 'Reembolsado',
  voided: 'Estornado',
};
```

3. Adicionar ao final do arquivo:

```ts
const typeLabels: Record<string, string> = {
  FIXED: 'Valor fixo',
  PERCENT: 'Percentual',
  PER_ORDER: 'Por pedido',
  MONTHLY: 'Mensal (controle)',
};

export function typeLabel(type: string): string {
  return typeLabels[type] ?? type;
}

const categoryLabels: Record<string, string> = {
  PACKAGING: 'Embalagem',
  TAX: 'Imposto',
  FEE: 'Taxa',
  SHIPPING: 'Frete',
  OPERATIONAL: 'Operacional',
  MARKETING: 'Marketing',
  OTHER: 'Outros',
};

export function categoryLabel(category: string): string {
  return categoryLabels[category] ?? category;
}

const calculationBaseLabels: Record<string, string> = {
  PRICE: 'Preço de venda',
  COST: 'Custo do produto',
};

export function calculationBaseLabel(base: string): string {
  return calculationBaseLabels[base] ?? base;
}

const storefrontLabels: Record<string, string> = {
  mobile: 'Celular',
  web: 'Site',
  other_devices: 'Outros dispositivos',
};

export function storefrontLabel(storefront: string | null | undefined): string {
  if (!storefront) return '-';
  return storefrontLabels[storefront] ?? storefront;
}

const sourceLabels: Record<string, string> = {
  NUVEMSHOP: 'Nuvemshop',
  EXTERNAL: 'Venda externa',
};

export function sourceLabel(source: string | null | undefined): string {
  if (!source) return '-';
  return sourceLabels[source] ?? source;
}

export function preferLabel(apiLabel: string | null | undefined, fallback: string): string {
  return apiLabel || fallback;
}

export function marginPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)}%`;
}
```

- [ ] **Step 4: Rodar o teste para passar**

Run: `npm run test -- --run src/lib/formatters.test.ts`
Expected: PASS (8 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/formatters.ts src/lib/formatters.test.ts
git commit -m "feat(formatters): add PT-BR glossary for costs, sales, storefront and status labels"
```

---

### Task 4: Navegação role-aware

**Files:**
- Modify: `src/components/SidebarItems.tsx`, `src/components/ProtectedRoute.tsx`, `src/pages/Layout.tsx`

**Interfaces:**
- Consumes: `isAdmin` de `src/lib/utils.ts`, `useAuth`
- Produces: `SidebarItem` com `adminOnly?: boolean` (usado nas Tasks 6-9 ao registrar rotas); `<ProtectedRoute adminOnly>`; Layout que filtra itens por role.

- [ ] **Step 1: Adicionar flag `adminOnly` nos items**

Substituir `src/components/SidebarItems.tsx` por:

```tsx
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Wallet,
  BadgePercent,
  UserRound,
} from "lucide-react";

export interface SidebarItem {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Pedidos", url: "/orders", icon: ShoppingCart },
  { title: "Inventário", url: "/inventory", icon: BarChart3 },
  { title: "Custos", url: "/costs", icon: BadgePercent, adminOnly: true },
  { title: "Venda Externa", url: "/sales", icon: Wallet, adminOnly: true },
  { title: "Clientes", url: "/customers", icon: UserRound, adminOnly: true },
  { title: "Usuários", url: "/users", icon: Users },
];
```

> A página `/users` do backend exige ADMIN? Não — `user.router.ts` não exige role para leitura (verificar se quiser), por isso sem `adminOnly`. As rotas `/costs`, `/sales`, `/customers` e `/users` ainda não existem em `App.tsx` — o Sidebar não renderiza botão quebrando, apenas itens; as rotas serão adicionadas nas Tasks 6-9. O item "Custos" só funciona após a Task 6 adicionar a rota; como o Layout filtra por role, o risco é nulo para EMPLOYEE, e para ADMIN as rotas serão adicionadas na mesma ordem do plano.

- [ ] **Step 2: Filtrar itens no Layout**

Em `src/pages/Layout.tsx`, no `import { sidebarItems }`, mudar para importar `sidebarItems` + `isAdmin`:

```tsx
import { sidebarItems } from "@/components/SidebarItems";
import { isAdmin } from "@/lib/utils";
```

E na linha `{sidebarItems.map((item) => (` (linha 45), substituir por:

```tsx
{sidebarItems.filter((item) => !item.adminOnly || isAdmin(user?.role)).map((item) => (
```

- [ ] **Step 3: Prop `adminOnly` no ProtectedRoute**

Substituir `src/components/ProtectedRoute.tsx` por:

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, getUser } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && !isAdmin(getUser()?.role)) {
    return <Navigate to="/products" replace />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros (`ComponentType` importado como type; `isAdmin` em `src/lib/utils.ts` já existe e aceita `User['role'] | undefined`).

- [ ] **Step 5: Commit**

```bash
git add src/components/SidebarItems.tsx src/components/ProtectedRoute.tsx src/pages/Layout.tsx
git commit -m "feat(auth): role-aware sidebar and admin-only route guard"
```

---

### Task 5: Padrão compartilhado de listas

**Files:**
- Create: `src/hooks/useTableFilters.ts`
- Create: `src/components/DataTablePagination.tsx`

**Interfaces:**
- Consumes: `useDebounce` (`src/hooks/useDebounce.ts`, 500ms)
- Produces: `useTableFilters<TFilter>({ defaultLimit }) → { page, limit, search, debouncedSearch, filter, setPage, setLimit, setSearch, setFilter }`; `<DataTablePagination page limit total onPageChange onLimitChange />`. Usados pelas Tasks 6, 8, 9.

- [ ] **Step 1: Criar o hook**

Criar `src/hooks/useTableFilters.ts`:

```ts
import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface Options {
  defaultLimit?: number;
}

export function useTableFilters<TFilter>(options: Options = {}) {
  const { defaultLimit = 10 } = options;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TFilter | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 500);

  function resetPage() {
    setPage(1);
  }

  function changeSearch(value: string) {
    setSearch(value);
    resetPage();
  }

  function changeLimit(value: number) {
    setLimit(value);
    resetPage();
  }

  function changeFilter(value: TFilter | undefined) {
    setFilter(value);
    resetPage();
  }

  return { page, limit, search, debouncedSearch, filter, setPage, changeSearch, changeLimit, changeFilter };
}
```

- [ ] **Step 2: Criar o componente de paginação**

Criar `src/components/DataTablePagination.tsx`:

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function DataTablePagination({ page, limit, total, onPageChange, onLimitChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex items-center justify-between px-2 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
          <SelectTrigger className="w-[70px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useTableFilters.ts src/components/DataTablePagination.tsx
git commit -m "feat(ui): shared table filters hook and pagination component"
```

---

### Task 6: Página Custos — lista + CRUD

**Files:**
- Create: `src/lib/schemas.ts` (costComponentSchema)
- Test: `src/lib/schemas.test.ts`
- Create: `src/pages/Costs.tsx`
- Create: `src/components/costs/CostComponentFormDialog.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `costComponentsApi` (Task 2), `useTableFilters` (Task 5), glossário (Task 3), `typeLabel/categoryLabel/calculationBaseLabel`
- Produces: `costComponentSchema` (Zod), `<CostComponentFormDialog open onOpenChange component onSubmit />`, rota `/costs`. `SimulateCostDialog` e `ProductAssociationsDialog` (Task 7) se conectam à página via props `onSimulate(component)` e `onAssociations(component)`.

- [ ] **Step 1: Escrever o teste que falha (schema Zod)**

Criar `src/lib/schemas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { costComponentSchema } from './schemas';

describe('costComponentSchema', () => {
  it('aceita componente válido', () => {
    const result = costComponentSchema.safeParse({
      name: 'Embalagem premium',
      type: 'FIXED',
      category: 'PACKAGING',
      value: 2.5,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita sem nome', () => {
    const result = costComponentSchema.safeParse({ name: '', type: 'FIXED', value: 1 });
    expect(result.success).toBe(false);
  });

  it('exige base de cálculo para PERCENT', () => {
    const withoutBase = costComponentSchema.safeParse({ name: 'Taxa', type: 'PERCENT', value: 5 });
    expect(withoutBase.success).toBe(false);
    const withBase = costComponentSchema.safeParse({ name: 'Taxa', type: 'PERCENT', value: 5, calculation_base: 'PRICE' });
    expect(withBase.success).toBe(true);
  });

  it('rejeita valor negativo', () => {
    const result = costComponentSchema.safeParse({ name: 'X', type: 'FIXED', value: -1 });
    expect(result.success).toBe(false);
  });

  it('aceita FIXED sem base de cálculo', () => {
    const result = costComponentSchema.safeParse({ name: 'X', type: 'FIXED', value: 1 });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

Run: `npm run test -- --run src/lib/schemas.test.ts`
Expected: FAIL — `Cannot find module './schemas'`.

- [ ] **Step 3: Criar o schema**

Criar `src/lib/schemas.ts`:

```ts
import { z } from 'zod';

export const costComponentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo de 100 caracteres'),
  description: z.string().max(500, 'Máximo de 500 caracteres').optional().or(z.literal('')),
  type: z.enum(['FIXED', 'PERCENT', 'PER_ORDER', 'MONTHLY']),
  category: z.enum(['PACKAGING', 'TAX', 'FEE', 'SHIPPING', 'OPERATIONAL', 'MARKETING', 'OTHER']),
  value: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  calculation_base: z.enum(['PRICE', 'COST']).optional(),
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.type === 'PERCENT' && data.calculation_base === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['calculation_base'],
      message: 'Base de cálculo é obrigatória para componentes percentuais',
    });
  }
});

export type CostComponentFormValues = z.infer<typeof costComponentSchema>;
```

- [ ] **Step 4: Rodar o teste para passar**

Run: `npm run test -- --run src/lib/schemas.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Criar o dialog de criar/editar**

Criar `src/components/costs/CostComponentFormDialog.tsx`:

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { costComponentSchema, type CostComponentFormValues } from '@/lib/schemas';
import { categoryLabel, typeLabel } from '@/lib/formatters';
import type { CostComponent, CostComponentPayload } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: CostComponent | null;
  isPending: boolean;
  onSubmit: (payload: CostComponentPayload) => void;
}

export default function CostComponentFormDialog({ open, onOpenChange, component, isPending, onSubmit }: Props) {
  const form = useForm<CostComponentFormValues>({
    resolver: zodResolver(costComponentSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'FIXED',
      category: 'OTHER',
      value: 0,
      calculation_base: 'PRICE',
      is_active: true,
    },
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    if (open) {
      form.reset(component ? {
        name: component.name,
        description: component.description ?? '',
        type: component.type,
        category: component.category,
        value: component.value,
        calculation_base: component.calculation_base,
        is_active: component.is_active,
      } : {
        name: '',
        description: '',
        type: 'FIXED',
        category: 'OTHER',
        value: 0,
        calculation_base: 'PRICE',
        is_active: true,
      });
    }
  }, [open, component, form]);

  function handleSubmit(values: CostComponentFormValues) {
    const payload: CostComponentPayload = {
      name: values.name.trim(),
      description: values.description?.trim() ? values.description.trim() : undefined,
      type: values.type,
      category: values.category,
      value: values.value,
      is_active: values.is_active,
    };
    if (values.type === 'PERCENT' && values.calculation_base) {
      payload.calculation_base = values.calculation_base;
    }
    onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{component ? 'Editar Componente de Custo' : 'Novo Componente de Custo'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Embalagem premium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(['FIXED', 'PERCENT', 'PER_ORDER', 'MONTHLY'] as const).map((type) => (
                          <SelectItem key={type} value={type}>{typeLabel(type)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(['PACKAGING', 'TAX', 'FEE', 'SHIPPING', 'OPERATIONAL', 'MARKETING', 'OTHER'] as const).map((category) => (
                          <SelectItem key={category} value={category}>{categoryLabel(category)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$ ou %)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedType === 'PERCENT' ? (
                <FormField
                  control={form.control}
                  name="calculation_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base de cálculo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PRICE">Preço de venda</SelectItem>
                          <SelectItem value="COST">Custo do produto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">Componente participa do cálculo de custos</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : (component ? 'Salvar' : 'Criar Componente')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

> `src/components/ui/form.tsx` exporta `Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage` — o código acima está correto.

- [ ] **Step 6: Criar a página Custos (lista + CRUD)**

Criar `src/pages/Costs.tsx`:

```tsx
import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, MoreHorizontal, AlertTriangle, Loader2, BadgePercent } from 'lucide-react';
import { toast } from 'sonner';
import { costComponentsApi } from '@/services/api';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { typeLabel, categoryLabel, calculationBaseLabel, formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DataTablePagination from '@/components/DataTablePagination';
import CostComponentFormDialog from '@/components/costs/CostComponentFormDialog';
import type { CostComponent, CostComponentPayload } from '@/types';

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

export default function Costs() {
  const { getUser } = useAuth();
  const admin = isAdmin(getUser()?.role);
  const qc = useQueryClient();

  const { search, debouncedSearch, changeSearch, filter, changeFilter } =
    useTableFilters<{ is_active?: boolean }>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CostComponent | null>(null);
  const [deleting, setDeleting] = useState<CostComponent | null>(null);
  const [simulating, setSimulating] = useState<CostComponent | null>(null);
  const [associationsFor, setAssociationsFor] = useState<CostComponent | null>(null);

  const { data: components, isLoading, isError, refetch } = useQuery({
    queryKey: ['cost-components', debouncedSearch, filter],
    queryFn: () => costComponentsApi.list({
      search: debouncedSearch || undefined,
      is_active: filter?.is_active,
    }),
    placeholderData: (previousData) => previousData,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['cost-components'] });
  }, [qc]);

  const createMutation = useMutation({
    mutationFn: (payload: CostComponentPayload) => costComponentsApi.create(payload),
    onSuccess: () => {
      toast.success('Componente criado com sucesso');
      setFormOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(`Falha ao criar: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CostComponentPayload> }) => costComponentsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Componente atualizado');
      setFormOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(`Falha ao atualizar: ${err?.response?.data?.error || err?.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => costComponentsApi.delete(id),
    onSuccess: () => {
      toast.success('Componente excluído');
      setDeleting(null);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(`Falha ao excluir: ${err?.response?.data?.error || err?.message}`),
  });

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Custos</h1>
        <p className="text-sm text-muted-foreground">Componentes que compõem o custo dos produtos</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar componente..."
            className="pl-9"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>
        <Select
          value={filter?.is_active === undefined ? 'all' : String(filter.is_active)}
          onValueChange={(value) => changeFilter(value === 'all' ? undefined : { is_active: value === 'true' })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>
        {admin ? (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Componente
          </Button>
        ) : null}
      </div>

      <div>
        {isError ? (
          <div className="flex items-center justify-center py-16">
            <Alert variant="destructive" className="w-full max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar componentes</AlertTitle>
              <AlertDescription>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : components?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BadgePercent className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhum componente encontrado</p>
            <p className="text-sm">Tente ajustar a busca ou crie um novo componente.</p>
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Nome</TableHead>
                <TableHead className="w-[14%]">Tipo</TableHead>
                <TableHead className="w-[14%]">Categoria</TableHead>
                <TableHead className="w-[14%] text-right">Valor</TableHead>
                <TableHead className="w-[14%]">Base de cálculo</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
                <TableHead className="w-[12%] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(components ?? []).map((component) => (
                <TableRow key={component.id}>
                  <TableCell>
                    <span className="font-medium truncate block">{component.name}</span>
                    {component.description ? (
                      <span className="text-xs text-muted-foreground truncate block">{component.description}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{typeLabel(component.type)}</TableCell>
                  <TableCell>{categoryLabel(component.category)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(component.value)}</TableCell>
                  <TableCell>
                    {component.type === 'PERCENT' ? calculationBaseLabel(component.calculation_base) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={component.is_active ? 'default' : 'secondary'} className={component.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 border-transparent' : ''}>
                      {component.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    {admin ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(component); setFormOpen(true); }}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSimulating(component)}>
                            Simular custo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAssociationsFor(component)}>
                            Associações
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(component)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CostComponentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        component={editing}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(payload) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, payload });
          } else {
            createMutation.mutate(payload);
          }
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir componente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleting?.name}"? A ação pode afetar o cálculo de custos dos produtos associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

> Os states `simulating` e `associationsFor` e os itens do dropdown "Simular custo"/"Associações" permanecem nesta task (compilam e não fazem nada); a Task 7 cria `SimulateCostDialog` e `ProductAssociationsDialog` e os renderiza após o `AlertDialog`.

- [ ] **Step 7: Registrar rota em App.tsx**

Em `src/App.tsx`, adicionar import `import Costs from '@/pages/Costs';` e a rota dentro do `<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>`:

```tsx
<Route path="/costs" element={<ProtectedRoute adminOnly><Costs /></ProtectedRoute>} />
```

- [ ] **Step 8: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/lib/schemas.ts src/lib/schemas.test.ts src/pages/Costs.tsx src/components/costs/CostComponentFormDialog.tsx src/App.tsx
git commit -m "feat(costs): cost components list with create, edit and delete"
```

---

### Task 7: Custos — Simular custo e Associações

**Files:**
- Create: `src/components/VariantPicker.tsx`
- Create: `src/components/costs/SimulateCostDialog.tsx`
- Create: `src/components/costs/ProductAssociationsDialog.tsx`
- Modify: `src/pages/Costs.tsx` (renderizar os dois dialogs)

**Interfaces:**
- Consumes: `costComponentsApi` (Task 2), `productsApi` (existente), glossário (Task 3)
- Produces: `<VariantPicker value onSelect />` (reusado na Task 8 — Venda Externa); `PickedVariant = { variant_id, product_name, variant_name, sku, price, stock_quantity }`.

- [ ] **Step 1: Criar o VariantPicker (combobox de produto + variante)**

Criar `src/components/VariantPicker.tsx`:

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { productsApi } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';

export interface PickedVariant {
  variant_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  price: number;
  stock_quantity: number;
}

interface Props {
  value: PickedVariant | null;
  onSelect: (variant: PickedVariant) => void;
  placeholder?: string;
}

export default function VariantPicker({ value, onSelect, placeholder = 'Buscar produto ou variante...' }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data } = useQuery({
    queryKey: ['products', debouncedSearch],
    queryFn: () => productsApi.getAll({ search: debouncedSearch || undefined, limit: 10 }),
    enabled: open,
    placeholderData: (previousData) => previousData,
  });

  const options: PickedVariant[] = (data?.products ?? []).flatMap((product) =>
    product.variants.map((variant) => ({
      variant_id: variant.id,
      product_name: product.name,
      variant_name: variant.name,
      sku: variant.sku,
      price: variant.price,
      stock_quantity: variant.stock_quantity,
    }))
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? `${value.product_name} — ${value.variant_name}` : placeholder}
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <CommandInput
              placeholder="Pesquisar produto ou variante..."
              value={search}
              onValueChange={setSearch}
              className="h-9 border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.variant_id}
                  value={`${option.product_name} ${option.variant_name} ${option.sku}`}
                  onSelect={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value?.variant_id === option.variant_id ? 'opacity-100' : 'opacity-0')} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{option.product_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {option.variant_name} · {option.sku} · {option.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

> `src/components/ui/command.tsx` exporta `Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem` — o código acima está correto.

- [ ] **Step 2: Criar SimulateCostDialog**

Criar `src/components/costs/SimulateCostDialog.tsx`:

```tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { costComponentsApi } from '@/services/api';
import { formatCurrency, marginPercent } from '@/lib/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import VariantPicker, { type PickedVariant } from '@/components/VariantPicker';
import type { CostSimulateResponse } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

export default function SimulateCostDialog({ open, onOpenChange }: Props) {
  const [variant, setVariant] = useState<PickedVariant | null>(null);
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('1');

  const simulateMutation = useMutation({
    mutationFn: () => costComponentsApi.simulate({
      variant_id: variant!.variant_id,
      unit_price: parseFloat(unitPrice) || 0,
      quantity: parseInt(quantity) || 1,
    }),
    onError: (err: ApiError) => toast.error(`Falha ao simular: ${err?.response?.data?.error || err?.message}`),
  });

  const result: CostSimulateResponse | undefined = simulateMutation.data;

  function handleVariantSelect(picked: PickedVariant) {
    setVariant(picked);
    setUnitPrice(String(picked.price));
    setQuantity('1');
    simulateMutation.reset();
  }

  const breakdownRows = result
    ? [
        { label: 'Custo do produto', value: result.unit_cost },
        { label: 'Embalagem', value: result.unit_packaging_cost },
        { label: 'Taxa da plataforma', value: result.unit_platform_fee },
        { label: 'Impostos', value: result.unit_tax },
        { label: 'Frete', value: result.unit_shipping_cost },
        { label: 'Operacional', value: result.unit_operational_cost },
        { label: 'Marketing', value: result.unit_marketing_cost },
        { label: 'Outros', value: result.unit_other_cost },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Simular Custo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Produto / Variante</Label>
            <VariantPicker value={variant} onSelect={handleVariantSelect} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sim-unit-price">Preço de venda (R$)</Label>
              <Input
                id="sim-unit-price"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => { setUnitPrice(e.target.value); simulateMutation.reset(); }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sim-quantity">Quantidade</Label>
              <Input
                id="sim-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); simulateMutation.reset(); }}
              />
            </div>
          </div>
          <Button
            disabled={!variant || !unitPrice || simulateMutation.isPending}
            onClick={() => simulateMutation.mutate()}
          >
            {simulateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
            Simular
          </Button>

          {result ? (
            <div className="space-y-3 border rounded-lg p-4">
              <h4 className="text-sm font-semibold">Resultado por unidade</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdownRows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.value)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">Custo total</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(result.unit_total_cost)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Lucro unitário</TableCell>
                    <TableCell className="text-right font-semibold text-green-700">{formatCurrency(result.unit_profit)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Margem</TableCell>
                    <TableCell className="text-right font-semibold">{marginPercent(result.margin_percent)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {result.cost_breakdown.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Detalhamento por componente</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Componente</TableHead>
                        <TableHead className="text-right">Tipo</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.cost_breakdown.map((item) => (
                        <TableRow key={item.component_id ?? item.name}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{item.type}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.line_total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Criar ProductAssociationsDialog**

Criar `src/components/costs/ProductAssociationsDialog.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { costComponentsApi, productsApi } from '@/services/api';
import { categoryLabel, typeLabel, formatCurrency } from '@/lib/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { CostAssociation, CostComponent } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

export default function ProductAssociationsDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [productId, setProductId] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [componentId, setComponentId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.getAll({ search: search || undefined, limit: 10 }),
    enabled: open,
  });

  const { data: componentsData, isLoading: componentsLoading } = useQuery({
    queryKey: ['cost-components'],
    queryFn: () => costComponentsApi.list({ is_active: true }),
    enabled: open && addOpen,
  });

  const { data: associationsData, isLoading: associationsLoading, isError } = useQuery({
    queryKey: ['cost-associations', productId],
    queryFn: () => costComponentsApi.getByProduct(productId),
    enabled: open && !!productId,
  });

  useEffect(() => {
    if (!open) {
      setProductId('');
      setProductName('');
      setSearch('');
      setAddOpen(false);
      setComponentId('');
      setQuantity('1');
    }
  }, [open]);

  const addMutation = useMutation({
    mutationFn: () => costComponentsApi.associate({ product_id: productId, cost_component_id: componentId, quantity: parseInt(quantity) || 1 }),
    onSuccess: () => {
      toast.success('Componente associado ao produto');
      setAddOpen(false);
      setComponentId('');
      setQuantity('1');
      qc.invalidateQueries({ queryKey: ['cost-associations', productId] });
    },
    onError: (err: ApiError) => toast.error(`Falha ao associar: ${err?.response?.data?.error || err?.message}`),
  });

  const removeMutation = useMutation({
    mutationFn: (associationId: string) => costComponentsApi.removeAssociation(associationId),
    onSuccess: () => {
      toast.success('Associação removida');
      qc.invalidateQueries({ queryKey: ['cost-associations', productId] });
    },
    onError: (err: ApiError) => toast.error(`Falha ao remover: ${err?.response?.data?.error || err?.message}`),
  });

  const availableComponents = (componentsData ?? []).filter(
    (component: CostComponent) => !(associationsData?.associations ?? []).some(
      (association) => association.cost_component_id === component.id
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Associações de Componentes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assoc-product-search">Produto</Label>
            <Input
              id="assoc-product-search"
              placeholder="Buscar produto..."
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                setSearch(e.target.value);
              }}
              list="assoc-products-list"
            />
            {productsLoading ? <Skeleton className="h-10 w-full" /> : productsData?.products.length ? (
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {productsData.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setProductId(product.id);
                      setProductName(product.name);
                      setSearch('');
                    }}
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {productId ? (
            <div className="space-y-3">
              {associationsLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : isError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro ao carregar associações</AlertTitle>
                </Alert>
              ) : (associationsData?.associations ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum componente associado a este produto
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Componente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-center">Remover</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(associationsData?.associations ?? []).map((association: CostAssociation) => (
                      <TableRow key={association.id}>
                        <TableCell className="font-medium">{association.component?.name ?? association.cost_component_id}</TableCell>
                        <TableCell>{association.component ? typeLabel(association.component.type) : '-'}</TableCell>
                        <TableCell>{association.component ? categoryLabel(association.component.category) : '-'}</TableCell>
                        <TableCell className="text-right">{association.quantity}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeMutation.mutate(association.id)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {addOpen ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-[1fr_90px] gap-3">
                    <div className="space-y-2">
                      <Label>Componente</Label>
                      {componentsLoading ? <Skeleton className="h-10 w-full" /> : (
                        <Select value={componentId} onValueChange={setComponentId}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {availableComponents.map((component) => (
                              <SelectItem key={component.id} value={component.id}>
                                {component.name} ({formatCurrency(component.value)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assoc-qty">Qtd</Label>
                      <Input id="assoc-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancelar</Button>
                    <Button size="sm" disabled={!componentId || addMutation.isPending} onClick={() => addMutation.mutate()}>
                      {addMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                      Associar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Componente
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Renderizar os dialogs na página**

Em `src/pages/Costs.tsx`, adicionar imports e renderizar:

```tsx
import SimulateCostDialog from '@/components/costs/SimulateCostDialog';
import ProductAssociationsDialog from '@/components/costs/ProductAssociationsDialog';
```

E no JSX, após o `AlertDialog`:

```tsx
<SimulateCostDialog open={simulating !== null} onOpenChange={(open) => { if (!open) setSimulating(null); }} />
<ProductAssociationsDialog open={associationsFor !== null} onOpenChange={(open) => { if (!open) setAssociationsFor(null); }} />
```

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/components/VariantPicker.tsx src/components/costs/ src/pages/Costs.tsx
git commit -m "feat(costs): cost simulation dialog and product-component associations"
```

---

### Task 8: Página Venda Externa

**Files:**
- Modify: `src/lib/schemas.ts` (externalSaleSchema)
- Test: `src/lib/schemas.test.ts`
- Create: `src/pages/Sales.tsx`
- Create: `src/components/sales/CustomerPicker.tsx`
- Create: `src/components/sales/SaleResultDialog.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `externalSalesApi` (Task 2), `VariantPicker` (Task 7), glossário (Task 3)
- Produces: `externalSaleSchema` (Zod), rota `/sales`, `<SaleResultDialog open onOpenChange sale />`.

- [ ] **Step 1: Escrever o teste que falha (schema de venda externa)**

Em `src/lib/schemas.test.ts`, adicionar:

```ts
import { externalSaleSchema } from './schemas';

describe('externalSaleSchema', () => {
  it('aceita venda válida', () => {
    const result = externalSaleSchema.safeParse({
      customer_name: 'João',
      items: [{ variant_id: 'uuid-a', quantity: 2, unit_price: 10 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejeita sem nome do cliente', () => {
    const result = externalSaleSchema.safeParse({
      customer_name: '',
      items: [{ variant_id: 'uuid-a', quantity: 1, unit_price: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejeita sem itens', () => {
    const result = externalSaleSchema.safeParse({ customer_name: 'João', items: [] });
    expect(result.success).toBe(false);
  });

  it('rejeita item sem variante', () => {
    const result = externalSaleSchema.safeParse({
      customer_name: 'João',
      items: [{ quantity: 1, unit_price: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejeita email inválido', () => {
    const result = externalSaleSchema.safeParse({
      customer_name: 'João',
      customer_email: 'invalido',
      items: [{ variant_id: 'uuid-a', quantity: 1, unit_price: 10 }],
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

Run: `npm run test -- --run src/lib/schemas.test.ts`
Expected: FAIL — `externalSaleSchema is not defined`.

- [ ] **Step 3: Implementar o schema**

Em `src/lib/schemas.ts`, adicionar ao final:

```ts
export const externalSaleSchema = z.object({
  customer_name: z.string().min(1, 'Nome do cliente é obrigatório').max(255),
  customer_email: z.string().email('Email inválido').optional().or(z.literal('')),
  items: z.array(z.object({
    variant_id: z.string().min(1, 'Selecione uma variante'),
    quantity: z.coerce.number().int().positive('Quantidade deve ser ao menos 1'),
    unit_price: z.coerce.number().min(0, 'Preço não pode ser negativo'),
  })).min(1, 'Adicione ao menos um item'),
  discount_amount: z.coerce.number().min(0).optional(),
  payment_method: z.string().optional(),
  gateway: z.string().optional(),
  payment_installments: z.coerce.number().int().positive().optional(),
  shipping_cost_owner: z.coerce.number().min(0).optional(),
  shipping_cost_customer: z.coerce.number().min(0).optional(),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED']).default('PAID'),
});

export type ExternalSaleFormValues = z.infer<typeof externalSaleSchema>;
```

- [ ] **Step 4: Rodar o teste para passar**

Run: `npm run test -- --run src/lib/schemas.test.ts`
Expected: PASS (10 testes no total).

- [ ] **Step 5: Criar CustomerPicker**

Criar `src/components/sales/CustomerPicker.tsx`:

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { externalSalesApi } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import type { Customer } from '@/types';

interface Props {
  onSelect: (customer: Customer) => void;
}

export default function CustomerPicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data } = useQuery({
    queryKey: ['external-sales-customers', debouncedSearch],
    queryFn: () => externalSalesApi.searchCustomers({ search: debouncedSearch || undefined, limit: 10 }),
    enabled: open,
    placeholderData: (previousData) => previousData,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          Buscar cliente existente...
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <CommandInput
              placeholder="Buscar por nome ou email..."
              value={search}
              onValueChange={setSearch}
              className="h-9 border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>
            <CommandGroup>
              {(data?.customers ?? []).map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.name} ${customer.email ?? ''}`}
                  onSelect={() => {
                    onSelect(customer);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4 opacity-0')} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{customer.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 6: Criar SaleResultDialog**

Criar `src/components/sales/SaleResultDialog.tsx`:

```tsx
import { BadgeCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, marginPercent, sourceLabel, statusLabel } from '@/lib/formatters';
import type { ExternalSaleResult } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: ExternalSaleResult | null;
}

export default function SaleResultDialog({ open, onOpenChange, sale }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-green-600" />
            Venda registrada
          </DialogTitle>
        </DialogHeader>
        {sale ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedido</span>
              <span className="font-mono text-xs pt-0.5">#{sale.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={sale.status === 'CANCELED' ? 'destructive' : 'default'}>
                {statusLabel(sale.status)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Origem</span>
              <span>{sourceLabel(sale.source)}</span>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total da venda</span>
                <span className="font-semibold">{formatCurrency(sale.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo total</span>
                <span>{formatCurrency(sale.total_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lucro total</span>
                <span className="font-semibold text-green-700">{formatCurrency(sale.total_profit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margem</span>
                <span className="font-semibold">{marginPercent(sale.margin_percent)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Criar a página Sales**

Criar `src/pages/Sales.tsx`:

```tsx
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Wallet, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { externalSalesApi } from '@/services/api';
import { externalSaleSchema, type ExternalSaleFormValues } from '@/lib/schemas';
import { paymentMethodLabel } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import VariantPicker, { type PickedVariant } from '@/components/VariantPicker';
import CustomerPicker from '@/components/sales/CustomerPicker';
import SaleResultDialog from '@/components/sales/SaleResultDialog';
import type { ExternalSaleResult } from '@/types';

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

const paymentMethods = ['credit_card', 'debit_card', 'pix', 'bank_transfer', 'boleto', 'cash'] as const;
const saleStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'] as const;

export default function Sales() {
  const { getUser } = useAuth();
  const admin = isAdmin(getUser()?.role);
  const qc = useQueryClient();

  const form = useForm<ExternalSaleFormValues>({
    resolver: zodResolver(externalSaleSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      items: [{ variant_id: '', quantity: 1, unit_price: 0 }],
      discount_amount: undefined,
      payment_method: '',
      gateway: '',
      payment_installments: undefined,
      shipping_cost_owner: undefined,
      shipping_cost_customer: undefined,
      status: 'PAID',
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const [pickedVariants, setPickedVariants] = useState<(PickedVariant | null)[]>([null]);
  const [resultSale, setResultSale] = useState<ExternalSaleResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  function addItem() {
    append({ variant_id: '', quantity: 1, unit_price: 0 });
    setPickedVariants((prev) => [...prev, null]);
  }

  function removeItem(index: number) {
    remove(index);
    setPickedVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function selectVariant(index: number, variant: PickedVariant) {
    form.setValue(`items.${index}.variant_id`, variant.variant_id);
    form.setValue(`items.${index}.unit_price`, variant.price);
    setPickedVariants((prev) => prev.map((picked, i) => (i === index ? variant : picked)));
  }

  const createMutation = useMutation({
    mutationFn: (payload: ExternalSaleFormValues) => externalSalesApi.create({
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email?.trim() ? payload.customer_email.trim() : undefined,
      items: payload.items.map((item) => ({
        variant_id: item.variant_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
      discount_amount: payload.discount_amount === undefined || payload.discount_amount === '' ? undefined : Number(payload.discount_amount),
      payment_method: payload.payment_method || undefined,
      gateway: payload.gateway?.trim() ? payload.gateway.trim() : undefined,
      payment_installments: payload.payment_installments === undefined || payload.payment_installments === '' ? undefined : Number(payload.payment_installments),
      shipping_cost_owner: payload.shipping_cost_owner === undefined || payload.shipping_cost_owner === '' ? undefined : Number(payload.shipping_cost_owner),
      shipping_cost_customer: payload.shipping_cost_customer === undefined || payload.shipping_cost_customer === '' ? undefined : Number(payload.shipping_cost_customer),
      status: payload.status,
    }),
    onSuccess: (sale) => {
      toast.success('Venda registrada com sucesso');
      setResultSale(sale);
      setResultOpen(true);
      form.reset({
        customer_name: '',
        customer_email: '',
        items: [{ variant_id: '', quantity: 1, unit_price: 0 }],
        discount_amount: undefined,
        payment_method: '',
        gateway: '',
        payment_installments: undefined,
        shipping_cost_owner: undefined,
        shipping_cost_customer: undefined,
        status: 'PAID',
      });
      setPickedVariants([null]);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: ApiError) => toast.error(`Falha ao registrar venda: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`),
  });

  const customerEmail = form.watch('customer_email');

  if (!admin) {
    return (
      <div className="flex items-center justify-center p-16">
        <Alert className="w-full max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>Você não tem permissão para registrar vendas externas.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Realizar Venda</h1>
        <p className="text-sm text-muted-foreground">Registrar venda externa fora da loja online</p>
      </div>

      <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="space-y-6 max-w-3xl">
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cliente</h3>
          <CustomerPicker
            onSelect={(customer) => {
              form.setValue('customer_name', customer.name);
              form.setValue('customer_email', customer.email ?? '');
            }}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale-customer-name">Nome *</Label>
              <Input
                id="sale-customer-name"
                placeholder="Nome do cliente"
                {...form.register('customer_name')}
              />
              {form.formState.errors.customer_name ? (
                <p className="text-sm text-destructive">{form.formState.errors.customer_name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-customer-email">Email</Label>
              <Input
                id="sale-customer-email"
                type="email"
                placeholder="email@exemplo.com"
                {...form.register('customer_email')}
              />
              {form.formState.errors.customer_email ? (
                <p className="text-sm text-destructive">{form.formState.errors.customer_email.message}</p>
              ) : null}
            </div>
          </div>
          {!customerEmail ? (
            <p className="text-xs text-muted-foreground">
              Cliente sem email não será salvo no cadastro de clientes.
            </p>
          ) : null}
        </div>

        <div className="space-y-4 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Itens</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Item
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 border rounded-md p-3">
              <VariantPicker
                value={pickedVariants[index] ?? null}
                onSelect={(variant: PickedVariant) => selectVariant(index, variant)}
              />
              {form.formState.errors.items?.[index]?.variant_id ? (
                <p className="text-sm text-destructive">{form.formState.errors.items[index].variant_id.message}</p>
              ) : null}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...form.register(`items.${index}.unit_price`)}
                  />
                </div>
                <div className="w-24">
                  <Label>Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`items.${index}.quantity`)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 h-9 w-9 text-destructive shrink-0"
                  onClick={() => removeItem(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {form.formState.errors.items?.root?.message ? (
            <p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>
          ) : null}
        </div>

        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pagamento e frete</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={form.watch('payment_method')} onValueChange={(value) => form.setValue('payment_method', value)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>{paymentMethodLabel(method)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-gateway">Gateway</Label>
              <Input id="sale-gateway" placeholder="Ex: Mercado Pago" {...form.register('gateway')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale-discount">Desconto (R$)</Label>
              <Input id="sale-discount" type="number" step="0.01" min="0" placeholder="0,00" {...form.register('discount_amount')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-installments">Parcelas</Label>
              <Input id="sale-installments" type="number" min="1" placeholder="1" {...form.register('payment_installments')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-status">Status</Label>
              <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as ExternalSaleFormValues['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {saleStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale-shipping-owner">Frete pago pela loja (R$)</Label>
              <Input id="sale-shipping-owner" type="number" step="0.01" min="0" placeholder="0,00" {...form.register('shipping_cost_owner')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-shipping-customer">Frete pago pelo cliente (R$)</Label>
              <Input id="sale-shipping-customer" type="number" step="0.01" min="0" placeholder="0,00" {...form.register('shipping_cost_customer')} />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
          {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
          Registrar Venda
        </Button>
      </form>

      <SaleResultDialog open={resultOpen} onOpenChange={setResultOpen} sale={resultSale} />
    </div>
  );
}
```

- [ ] **Step 8: Registrar rota em App.tsx**

Em `src/App.tsx`, adicionar `import Sales from '@/pages/Sales';` e:

```tsx
<Route path="/sales" element={<ProtectedRoute adminOnly><Sales /></ProtectedRoute>} />
```

- [ ] **Step 9: Verificar**

Run: `npm run test -- --run src/lib/schemas.test.ts && npx tsc --noEmit && npm run lint`
Expected: testes PASS, sem erros TS/ESLint.

- [ ] **Step 10: Commit**

```bash
git add src/lib/schemas.ts src/lib/schemas.test.ts src/pages/Sales.tsx src/components/sales/ src/App.tsx
git commit -m "feat(sales): external sale form with customer/variant pickers and API result dialog"
```

---

### Task 9: Página Clientes

**Files:**
- Create: `src/pages/Customers.tsx`
- Create: `src/components/customers/CustomerDetailDrawer.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `customersApi` (Task 2), `useTableFilters` (Task 5), glossário (Task 3)
- Produces: rota `/customers`.

- [ ] **Step 1: Criar o drawer de detalhe**

Criar `src/components/customers/CustomerDetailDrawer.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query';
import { Loader2, User, CreditCard, Globe, Repeat, AlertTriangle } from 'lucide-react';
import { customersApi } from '@/services/api';
import { formatCurrency, formatDate, paymentMethodLabel, statusLabel } from '@/lib/formatters';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Customer } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export default function CustomerDetailDrawer({ open, onOpenChange, customer }: Props) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer', customer?.id],
    queryFn: () => customersApi.getById(customer!.id),
    enabled: open && !!customer,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', customer?.id],
    queryFn: () => customersApi.getOrders(customer!.id),
    enabled: open && !!customer,
  });

  const indicators = data?.indicators;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[560px] sm:max-w-[560px] overflow-y-auto">
        {customer ? (
          <>
            <SheetHeader>
              <SheetTitle>{customer.name}</SheetTitle>
              <SheetDescription>
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                ) : 'Sem email cadastrado'}
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-8">
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resumo</h3>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                  </div>
                ) : isError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar cliente</AlertTitle>
                    <AlertDescription>
                      <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
                    </AlertDescription>
                  </Alert>
                ) : indicators ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <SummaryRow label="Pedidos" value={String(indicators.order_count)} />
                    <SummaryRow label="Total gasto" value={formatCurrency(indicators.total_spent)} />
                    <SummaryRow label="Ticket médio" value={formatCurrency(indicators.average_ticket)} />
                    <SummaryRow label="Primeira compra" value={formatDate(indicators.first_purchase_at)} />
                    <SummaryRow label="Última compra" value={formatDate(indicators.last_purchase_at)} />
                    {customer.city || customer.province ? (
                      <SummaryRow label="Cidade / UF" value={[customer.city, customer.province].filter(Boolean).join(' - ')} />
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Indicadores</h3>
                {indicators ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Pagamento favorito:</span>
                      <span className="font-medium">{paymentMethodLabel(indicators.favorite_payment_method)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Gateway preferido:</span>
                      <span className="font-medium">{indicators.favorite_gateway ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cliente recorrente:</span>
                      <span className="font-medium">{indicators.recurrence > 0 ? 'Sim' : 'Não'}</span>
                    </div>
                  </div>
                ) : null}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Histórico de Pedidos</h3>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum pedido encontrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell><Badge variant="secondary">{statusLabel(order.status)}</Badge></TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-md border p-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: Criar a página Customers**

Criar `src/pages/Customers.tsx`:

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, UsersIcon } from 'lucide-react';
import { customersApi } from '@/services/api';
import { useTableFilters } from '@/hooks/useTableFilters';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import DataTablePagination from '@/components/DataTablePagination';
import CustomerDetailDrawer from '@/components/customers/CustomerDetailDrawer';
import type { Customer } from '@/types';

export default function Customers() {
  const { page, limit, search, debouncedSearch, setPage, changeSearch, changeLimit } = useTableFilters();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customers', page, limit, debouncedSearch],
    queryFn: () => customersApi.getAll({
      page, limit,
      search: debouncedSearch || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const customers = data?.customers || [];

  function handleRowClick(customer: Customer) {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  }

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Base de clientes cadastrada a partir dos pedidos</p>
      </div>

      <div className="relative max-w-md shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou email..."
          className="pl-9"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
        />
      </div>

      <div>
        {isError ? (
          <div className="flex items-center justify-center py-16">
            <Alert variant="destructive" className="w-full max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar clientes</AlertTitle>
              <AlertDescription>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <UsersIcon className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm">Tente ajustar a busca.</p>
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Nome</TableHead>
                <TableHead className="w-[22%]">Email</TableHead>
                <TableHead className="w-[10%]">Cidade</TableHead>
                <TableHead className="w-[8%]">UF</TableHead>
                <TableHead className="w-[8%] text-right">Pedidos</TableHead>
                <TableHead className="w-[14%] text-right">Total gasto</TableHead>
                <TableHead className="w-[12%] text-right">Ticket médio</TableHead>
                <TableHead className="w-[12%] text-right">Última compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className="cursor-pointer" onClick={() => handleRowClick(customer)}>
                  <TableCell className="font-medium truncate block">{customer.name}</TableCell>
                  <TableCell className="truncate block text-sm text-muted-foreground">{customer.email ?? '-'}</TableCell>
                  <TableCell>{customer.city ?? '-'}</TableCell>
                  <TableCell>{customer.province ?? '-'}</TableCell>
                  <TableCell className="text-right">{customer.order_count}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(customer.total_spent)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.average_ticket)}</TableCell>
                  <TableCell className="text-right">{formatDate(customer.last_purchase_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {data ? (
        <DataTablePagination
          page={data.page}
          limit={data.limit}
          total={data.total}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      ) : null}

      <CustomerDetailDrawer open={detailOpen} onOpenChange={setDetailOpen} customer={selectedCustomer} />
    </div>
  );
}
```

- [ ] **Step 3: Registrar rota em App.tsx**

Em `src/App.tsx`, adicionar `import Customers from '@/pages/Customers';` e:

```tsx
<Route path="/customers" element={<ProtectedRoute adminOnly><Customers /></ProtectedRoute>} />
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Customers.tsx src/components/customers/ src/App.tsx
git commit -m "feat(customers): customer list with detail drawer and order history"
```

---

### Task 10: Drawer de Pedidos enriquecido + remoção do "Novo Pedido"

**Files:**
- Modify: `src/pages/Orders.tsx`
- Modify: `src/components/OrderCustomerInfo.tsx`
- Modify: `src/components/OrderShippingInfo.tsx`
- Modify: `src/components/OrderFinancialSummary.tsx`
- Modify: `src/components/OrderItemsTable.tsx`
- Modify: `src/components/OrderTimeline.tsx`
- Modify: `src/types/index.ts` (remover `CreateOrderPayload`)

**Interfaces:**
- Consumes: tipos enriquecidos (Task 1), glossário (Task 3)
- Produces: drawer com as 10 seções da spec; `Order`/`OrderItem` passam a ser usados em toda parte.

- [ ] **Step 1: Atualizar OrderCustomerInfo**

Substituir `src/components/OrderCustomerInfo.tsx` por:

```tsx
import { User } from "lucide-react";

interface Props {
  customer_name: string | null;
  customer_email?: string | null;
}

export default function OrderCustomerInfo({ customer_name, customer_email }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-primary/10 p-2">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold">{customer_name ?? '-'}</p>
        {customer_email ? (
          <a href={`mailto:${customer_email}`} className="text-sm text-muted-foreground hover:underline">
            {customer_email}
          </a>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Atualizar OrderShippingInfo (custos + transportadora)**

Substituir `src/components/OrderShippingInfo.tsx` por:

```tsx
import { Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  shipping_cost_customer?: number | null;
  shipping_cost_owner?: number | null;
  shipping_carrier?: string | null;
  has_free_shipping?: boolean | null;
  shipping_city?: string | null;
  shipping_province?: string | null;
}

export default function OrderShippingInfo({
  shipping_cost_customer, shipping_cost_owner, shipping_carrier, has_free_shipping,
  shipping_city, shipping_province,
}: Props) {
  const hasAny = shipping_cost_customer || shipping_cost_owner || shipping_carrier || has_free_shipping || shipping_city || shipping_province;

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
        <Truck className="h-8 w-8" />
        <p className="text-sm">Nenhuma informação de frete disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 text-sm">
      {shipping_city || shipping_province ? (
        <p className="font-medium">
          {[shipping_city, shipping_province].filter(Boolean).join(', ')}
        </p>
      ) : null}
      {shipping_carrier ? (
        <p className="text-muted-foreground">
          Transportadora: {shipping_carrier}
        </p>
      ) : null}
      {shipping_cost_owner !== null && shipping_cost_owner !== undefined && shipping_cost_owner > 0 ? (
        <p className="text-muted-foreground">
          Custo de frete (loja): {formatCurrency(shipping_cost_owner)}
        </p>
      ) : null}
      {shipping_cost_customer !== null && shipping_cost_customer !== undefined && shipping_cost_customer > 0 ? (
        <p className="text-muted-foreground">
          Frete pago pelo cliente: {formatCurrency(shipping_cost_customer)}
        </p>
      ) : null}
      {has_free_shipping ? (
        <div className="flex items-center gap-1.5 pt-1">
          <Truck className="h-4 w-4 text-green-600" />
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent">
            Frete Grátis
          </Badge>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Atualizar OrderFinancialSummary (valores da API)**

Substituir `src/components/OrderFinancialSummary.tsx` por:

```tsx
import type { Order } from "@/types";
import { formatCurrency, marginPercent } from "@/lib/formatters";

interface Props {
  order: Order;
}

export default function OrderFinancialSummary({ order }: Props) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total da venda</span>
        <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
      </div>
      {order.discount_amount && order.discount_amount > 0 ? (
        <div className="flex justify-between text-red-500">
          <span>Desconto</span>
          <span>-{formatCurrency(order.discount_amount)}</span>
        </div>
      ) : null}
      <div className="flex justify-between">
        <span className="text-muted-foreground">Custo total</span>
        <span>{formatCurrency(order.total_cost)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Lucro total</span>
        <span className="font-semibold text-green-700">{formatCurrency(order.total_profit)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Margem</span>
        <span className="font-semibold">{marginPercent(order.margin_percent)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Atualizar OrderItemsTable (custos + margem + breakdown expansível)**

Substituir `src/components/OrderItemsTable.tsx` por:

```tsx
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrderItem } from "@/types";
import { formatCurrency, marginPercent, typeLabel } from "@/lib/formatters";

interface Props {
  items: OrderItem[];
}

export default function OrderItemsTable({ items }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Nenhum item neste pedido</p>;
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[10px]" />
            <TableHead>Variante</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead className="text-right">Preço Unit.</TableHead>
            <TableHead className="text-right">Custo Unit.</TableHead>
            <TableHead className="text-right">Lucro Unit.</TableHead>
            <TableHead className="text-right">Margem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="align-top">
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  disabled={!item.cost_breakdown || item.cost_breakdown.length === 0}
                >
                  {expanded === item.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </TableCell>
              <TableCell className="font-mono text-xs">{item.variant_id.slice(0, 8)}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.unit_total_cost)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.unit_profit)}</TableCell>
              <TableCell className="text-right">{marginPercent(item.margin_percent)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {expanded && items.find((item) => item.id === expanded)?.cost_breakdown ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Componente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor unit.</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.find((item) => item.id === expanded)?.cost_breakdown?.map((breakdown) => (
                <TableRow key={breakdown.component_id ?? breakdown.name}>
                  <TableCell className="font-medium">{breakdown.name}</TableCell>
                  <TableCell>{typeLabel(breakdown.type)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(breakdown.unit_value)}</TableCell>
                  <TableCell className="text-right">{breakdown.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(breakdown.line_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Atualizar OrderTimeline (data de criação)**

Substituir o arquivo inteiro `src/components/OrderTimeline.tsx` por:

```tsx
import { CheckCircle2, XCircle } from "lucide-react";
import { formatTime } from "@/lib/formatters";

interface Props {
  created_at?: string | null;
  paid_at?: string | null;
  shipped_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export default function OrderTimeline({ created_at, paid_at, shipped_at, completed_at, cancelled_at }: Props) {
  if (cancelled_at) {
    return (
      <div className="space-y-3">
        {created_at ? (
          <TimelineStep icon={CheckCircle2} color="text-blue-500" label="Criado" time={formatTime(created_at)} />
        ) : null}
        <TimelineStep icon={XCircle} color="text-red-500" label="Cancelado" time={formatTime(cancelled_at)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {created_at ? (
        <TimelineStep icon={CheckCircle2} color="text-blue-500" label="Criado" time={formatTime(created_at)} />
      ) : null}
      <TimelineStep icon={CheckCircle2} color={paid_at ? "text-green-500" : "text-gray-300"} label="Pago" time={paid_at ? formatTime(paid_at) : "Pendente"} />
      <TimelineStep icon={CheckCircle2} color={shipped_at ? "text-green-500" : "text-gray-300"} label="Enviado" time={shipped_at ? formatTime(shipped_at) : "Pendente"} />
      <TimelineStep icon={CheckCircle2} color={completed_at ? "text-green-500" : "text-gray-300"} label="Entregue" time={completed_at ? formatTime(completed_at) : "Pendente"} />
    </div>
  );
}

function TimelineStep({ icon: Icon, color, label, time }: { icon: React.ComponentType<{ className?: string }>; color: string; label: string; time: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Rework da página Orders**

Em `src/pages/Orders.tsx`:

1. **Remover**: o import de `CreateOrderPayload` (trocar por `Order` apenas — manter `GetOrdersResponse`), o estado `createSheetOpen`, o `createMutation`, a função `CreateOrderForm` inteira (linhas 509-637), o `<Sheet open={createSheetOpen}>` (linhas 475-487), o botão "Novo Pedido" (linhas 217-222 e 244-249), o ícone `Plus` e o `Label` dos imports (se não usados em outro lugar — `Label` era usado no form; remover).

2. **Atualizar o drawer** (substituir o bloco dentro de `<SheetContent>` — linhas 379-473) por:

```tsx
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent side="right" className="w-[640px] sm:max-w-[640px] overflow-y-auto">
          {selectedOrder ? (
            <>
              <SheetHeader>
                <SheetTitle>Pedido #{selectedOrder.id.slice(0, 8)}</SheetTitle>
                <SheetDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={statusBadgeClass[selectedOrder.status] || ''} variant={selectedOrder.status === 'cancelled' || selectedOrder.status === 'CANCELED' ? 'destructive' : 'default'}>
                      {preferLabel(selectedOrder.status_label, statusLabel(selectedOrder.status))}
                    </Badge>
                    {selectedOrder.commercial_status ? (
                      <Badge variant="secondary">{selectedOrder.commercial_status}</Badge>
                    ) : null}
                    {selectedOrder.payment_status_label ? (
                      <Badge className={paymentBadgeClass[selectedOrder.payment_status ?? ''] || ''}>{selectedOrder.payment_status_label}</Badge>
                    ) : null}
                    {selectedOrder.fulfillment_status_label ? (
                      <Badge variant="outline">{selectedOrder.fulfillment_status_label}</Badge>
                    ) : null}
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-8">
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cliente</h3>
                  <OrderCustomerInfo customer_name={selectedOrder.customer_name} customer_email={selectedOrder.customer_email} />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Origem</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Fonte: </span>{sourceLabel(selectedOrder.source)}</p>
                    {selectedOrder.storefront ? (
                      <p><span className="text-muted-foreground">Storefront: </span>{storefrontLabel(selectedOrder.storefront)}</p>
                    ) : null}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Itens</h3>
                  <OrderItemsTable items={selectedOrder.items} />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pagamento</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      {selectedOrder.payment_method ? paymentMethodLabel(selectedOrder.payment_method) : '-'}
                      {selectedOrder.payment_installments ? ` (${selectedOrder.payment_installments}x)` : ''}
                    </p>
                    {selectedOrder.gateway ? (
                      <p className="text-muted-foreground">Gateway: {selectedOrder.gateway}</p>
                    ) : null}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Frete</h3>
                  <OrderShippingInfo
                    shipping_cost_customer={selectedOrder.shipping_cost_customer}
                    shipping_cost_owner={selectedOrder.shipping_cost_owner}
                    shipping_carrier={selectedOrder.shipping_carrier}
                    has_free_shipping={selectedOrder.has_free_shipping}
                    shipping_city={selectedOrder.shipping_city}
                    shipping_province={selectedOrder.shipping_province}
                  />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Endereço</h3>
                  <p className="text-sm">
                    {[selectedOrder.shipping_city, selectedOrder.shipping_province].filter(Boolean).join(' - ') || '-'}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">UTMs</h3>
                  {selectedOrder.utm_source || selectedOrder.utm_medium || selectedOrder.utm_campaign ? (
                    <div className="space-y-1 text-sm">
                      {selectedOrder.utm_source ? <p>Source: {selectedOrder.utm_source}</p> : null}
                      {selectedOrder.utm_medium ? <p>Medium: {selectedOrder.utm_medium}</p> : null}
                      {selectedOrder.utm_campaign ? <p>Campanha: {selectedOrder.utm_campaign}</p> : null}
                      {selectedOrder.utm_content ? <p>Conteúdo: {selectedOrder.utm_content}</p> : null}
                      {selectedOrder.utm_term ? <p>Termo: {selectedOrder.utm_term}</p> : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma UTM registrada</p>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financeiro</h3>
                  <OrderFinancialSummary order={selectedOrder} />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Linha do Tempo</h3>
                  <OrderTimeline
                    created_at={selectedOrder.created_at}
                    paid_at={selectedOrder.paid_at}
                    shipped_at={selectedOrder.shipped_at}
                    completed_at={selectedOrder.completed_at}
                    cancelled_at={selectedOrder.cancelled_at}
                  />
                </section>

                {admin ? (
                  <div className="flex gap-2 pt-4 border-t">
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => {
                        updateMutation.mutate({ id: selectedOrder.id, status: value });
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((s) => (
                          <SelectItem key={s} value={s} disabled={s === selectedOrder.status}>
                            {statusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      disabled={selectedOrder.status === 'cancelled' || selectedOrder.status === 'CANCELED'}
                      onClick={() => handleCancelClick(selectedOrder.id)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
```

3. **Atualizar imports** do drawer: adicionar `preferLabel`, `sourceLabel`, `storefrontLabel`, `paymentMethodLabel` ao import de `@/lib/formatters`.

- [ ] **Step 7: Remover CreateOrderPayload de types**

Em `src/types/index.ts`, remover a interface `CreateOrderPayload` (linhas 50-65) e a interface `CreateInventoryPayload` apenas se nada mais usar (não remover — o Inventory ainda usa). Remover só `CreateOrderPayload`.

- [ ] **Step 8: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros. Atenção a imports não usados após a remoção do form (`Plus`, `Label`, `CreateOrderPayload`).

- [ ] **Step 9: Commit**

```bash
git add src/pages/Orders.tsx src/components/OrderCustomerInfo.tsx src/components/OrderShippingInfo.tsx src/components/OrderFinancialSummary.tsx src/components/OrderItemsTable.tsx src/components/OrderTimeline.tsx src/types/index.ts
git commit -m "feat(orders): enriched order drawer with cost breakdown, UTMs and API financials; remove manual order form"
```

---

### Task 11: Dashboard com range de datas

**Files:**
- Create: `src/components/DateRangePicker.tsx`
- Modify: `src/hooks/useDashboard.ts`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/components/dashboard/StockSection.tsx` (nota de período fixo)

**Interfaces:**
- Consumes: `dashboardApi` (Task 2), `useQuery`/`useWebSocket` (existentes)
- Produces: `DateRange` = `{ from: Date | null; to: Date | null }`; `useDashboard()` retorna `{ range, setRange, orders, marketing, stock, userStats }`.
- [ ] **Step 1: Criar DateRangePicker**

Criar `src/components/DateRangePicker.tsx`:

```tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface Props {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const presets: { label: string; days: number }[] = [
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '60 dias', days: 60 },
  { label: '90 dias', days: 90 },
];

export default function DateRangePicker({ range, onRangeChange }: Props) {
  const [open, setOpen] = useState(false);

  function applyPreset(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));
    onRangeChange({ from, to });
    setOpen(false);
  }

  const label = range.from && range.to
    ? `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} — ${format(range.to, 'dd/MM/yyyy', { locale: ptBR })}`
    : 'Selecionar período';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('justify-start text-left font-normal w-[260px]', !range.from && !range.to && 'text-muted-foreground')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex gap-1 p-2 border-b">
          {presets.map((preset) => (
            <Button key={preset.days} variant="ghost" size="sm" onClick={() => applyPreset(preset.days)}>
              {preset.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={range.from && range.to ? { from: range.from, to: range.to } : undefined}
          onSelect={(selected) => {
            if (selected?.from && selected?.to) {
              onRangeChange({ from: selected.from, to: selected.to });
            }
          }}
          numberOfMonths={2}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}
```

> `date-fns` v3.6 e `react-day-picker` 8.10 já estão instalados; o `Calendar` do shadcn (`src/components/ui/calendar.tsx`) aceita `mode="range"` (repassa props ao react-day-picker). Se o locale `ptBR` falhar no tipo, usar `import { ptBR } from 'date-fns/locale'` — válido no v3.

- [ ] **Step 2: Rework do useDashboard**

Substituir `src/hooks/useDashboard.ts` por:

```ts
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { DateRange } from '@/components/DateRangePicker';

function toIsoStart(date: Date): string {
  return date.toISOString();
}

function toIsoEnd(date: Date): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

export function useDashboard() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [refetchKey, setRefetchKey] = useState(0);

  const triggerRefetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  const params = useCallback(() => {
    const base: { days?: number; start_date?: string; end_date?: string } = { days: 30 };
    if (range.from && range.to) {
      base.start_date = toIsoStart(range.from);
      base.end_date = toIsoEnd(range.to);
      const diffDays = Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
      base.days = diffDays;
    }
    return base;
  }, [range]);

  const orders = useQuery({
    queryKey: ['dashboard-orders', range, refetchKey],
    queryFn: () => dashboardApi.getOrders(params()),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const marketing = useQuery({
    queryKey: ['dashboard-marketing', range, refetchKey],
    queryFn: () => dashboardApi.getMarketing(params()),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const stock = useQuery({
    queryKey: ['dashboard-stock', refetchKey],
    queryFn: () => dashboardApi.getStock(30),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const userStats = useQuery({
    queryKey: ['dashboard-user-stats', refetchKey],
    queryFn: () => dashboardApi.getUserStats(),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  useWebSocket('products_updated', triggerRefetch);
  useWebSocket('orders_updated', triggerRefetch);

  return { range, setRange, orders, marketing, stock, userStats };
}
```

- [ ] **Step 3: Atualizar Dashboard.tsx**

Substituir `src/pages/Dashboard.tsx` por:

```tsx
import { useDashboard } from '@/hooks/useDashboard';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCards from '@/components/dashboard/KpiCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OrdersCharts from '@/components/dashboard/OrdersCharts';
import TopProducts from '@/components/dashboard/TopProducts';
import MarketingSection from '@/components/dashboard/MarketingSection';
import StockSection from '@/components/dashboard/StockSection';

export default function Dashboard() {
  const { range, setRange, orders, marketing, stock, userStats } = useDashboard();

  const isLoadingOrders = orders.isLoading && !orders.data;
  const isLoadingMarketing = marketing.isLoading && !marketing.data;
  const isLoadingStock = stock.isLoading && !stock.data;
  const isLoadingUsers = userStats.isLoading && !userStats.data;

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <DateRangePicker range={range} onRangeChange={setRange} />
      </div>

      <KpiCards orders={orders.data} userStats={userStats.data} isLoading={isLoadingOrders || isLoadingUsers} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={orders.data?.revenue_trend} isLoading={isLoadingOrders} />
        <OrdersCharts
          byHour={orders.data?.by_hour}
          byStatus={orders.data?.by_status}
          isLoading={isLoadingOrders}
        />
      </div>

      <TopProducts data={orders.data?.top_products} isLoading={isLoadingOrders} />

      <MarketingSection data={marketing.data} isLoading={isLoadingMarketing} />

      <StockSection data={stock.data} isLoading={isLoadingStock} />
    </div>
  );
}
```

- [ ] **Step 4: Nota de período fixo no StockSection**

Em `src/components/dashboard/StockSection.tsx`, no cabeçalho da seção (onde está o título, ex.: "Estoque"), adicionar logo abaixo do título:

```tsx
<p className="text-xs text-muted-foreground">Estoque: últimos 30 dias (período fixo)</p>
```

> Localizar o título da seção (grep por `Estoque` no arquivo) e inserir o parágrafo imediatamente após.

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros. Atenção: `KpiCards` recebia `orders.data` e usava `days`? Verificar props atuais de `KpiCards` (`src/components/dashboard/KpiCards.tsx`) — se aceitar só os mesmos dados, nada muda; se usava `days`, remover o uso (o componente atual não recebe `days`, conferido no render da página antiga).

- [ ] **Step 6: Commit**

```bash
git add src/components/DateRangePicker.tsx src/hooks/useDashboard.ts src/pages/Dashboard.tsx src/components/dashboard/StockSection.tsx
git commit -m "feat(dashboard): date range picker with presets, end-of-day workaround, fixed 30d stock note"
```

---

### Task 12: Passada de consistência

**Files:**
- Todos os arquivos alterados nas Tasks 1-11 (se necessário)

**Interfaces:**
- Consumes: tudo

- [ ] **Step 1: Rodar build, lint, tipos e testes**

Run:
```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test
```
Expected: tudo verde. Corrigir qualquer erro de ESLint (imports não usados, etc.) nos arquivos das tasks anteriores.

- [ ] **Step 2: Varredura PT-BR**

Verificar manualmente que nenhum texto visível em inglês foi introduzido nos arquivos novos/alterados:

```bash
rg -n 'Error|Delete|Cancel|Save|Create|Edit|Loading|No .* found|Search' src/pages/Costs.tsx src/pages/Sales.tsx src/pages/Customers.tsx src/components/costs/ src/components/sales/ src/components/customers/ src/components/VariantPicker.tsx src/components/DateRangePicker.tsx
```

Para cada ocorrência que for texto renderizado (fora de `className`, props técnicas como `isPending`, `onError`, strings do backend como `response.data.error`), substituir por PT-BR.

- [ ] **Step 3: Teste manual end-to-end (com backend local)**

Com o backend rodando (`GET /api/auth/csrf` + login), verificar:
1. Login → Dashboard com presets 7/15/30/60/90 e calendário
2. `/costs`: listar, criar (FIXED e PERCENT com/sem base), editar, excluir, simular, associações
3. `/sales`: buscar cliente preenche, itens com VariantPicker, registrar venda, resultado com custo/lucro/margem
4. `/customers`: listar, abrir drawer com indicadores e histórico
5. `/orders`: drawer com seções completas e breakdown expansível; sem "Novo Pedido"
6. Login com EMPLOYEE: menu sem Custos/Venda Externa/Clientes; URL direta redireciona para `/products`
7. Mutação com CSRF: criar componente de custo sem erro 403

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: consistency pass — lint, types, build and PT-BR sweep"
```
