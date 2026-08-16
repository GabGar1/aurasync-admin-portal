# Design — Alinhamento do Frontend AuraSync com o Backend P0

Data: 2026-08-01 · Status: aprovado pelo usuário (seções 1, 2 e 3)

## 1. Objetivo

Alinhar o AuraSync Admin Portal ao backend P0 implementado (Motor de Custos, Venda
Externa, Clientes, Pedidos enriquecidos, Dashboard com range de datas) e às regras
técnicas (cookie + CSRF, roles, paginação, glossário PT-BR). O documento
"Frontend — Complemento ao Prompt" (2026-08-01) é a fonte de requisitos; este
design define como o frontend será implementado.

## 2. Decisões de escopo (acordadas com o usuário)

1. Execução em **um plano completo, faseado** (Fase 0 a 6).
2. Venda Externa é **página própria no menu** (`/sales`), sem botão em Pedidos.
3. Dashboard usa **range picker com presets** (substitui o select de dias);
   cards de estoque ficam fixos em 30 dias (gap do backend) com nota visual.
4. Tela de Custos **oculta a coluna "Qtd. de produtos"** (gap do backend).
5. Form "Novo Pedido" (com `unit_cost` manual) é **removido** de Pedidos;
   criação manual de venda passa a ser exclusivamente via Venda Externa.
6. Novos módulos usam **padrão compartilhado de listas**
   (`useTableFilters` + `DataTablePagination`).
7. Drawer de pedidos consome a **lista enriquecida direto** (sem fetch por
   pedido — evita N+1).
8. "Simular custo" em Custos é um **modal** com variante + preço + quantidade.

## 3. Arquitetura

Segue a arquitetura do AGENTS.md (Page → Components → Hooks → Service → Backend).
Sem nova pattern: react-query para estado de servidor, RHF + Zod para forms,
shadcn/ui para componentes, `services/api.ts` como única camada HTTP.

### 3.1 Tipos (`src/types/index.ts` — adicionar)

- `CostComponent`: `{ id, name, description: string|null, type: 'FIXED'|'PERCENT'|'PER_ORDER'|'MONTHLY', category: 'PACKAGING'|'TAX'|'FEE'|'SHIPPING'|'OPERATIONAL'|'MARKETING'|'OTHER', value: number, calculation_base: 'PRICE'|'COST', is_active: boolean, created_at, updated_at }`
- `CostAssociation`: `{ id, product_id, cost_component_id, quantity, component?: CostComponent }`
- `CostBreakdownItem`: `{ component_id: string|null, name, type, category, unit_value, quantity, line_total }`
- `CostSimulateInput`: `{ variant_id, unit_price, quantity }`
- `CostSimulateResponse`: custos por categoria (packaging, platform fee, tax, shipping, operational, marketing, other), `unit_total_cost`, `unit_profit`, `margin_percent`, `cost_breakdown: CostBreakdownItem[]`
- `ExternalSalePayload`: `{ customer_name, customer_email?, items: {variant_id, quantity, unit_price}[], discount_amount?, payment_method?, gateway?, payment_installments?, shipping_cost_owner?, shipping_cost_customer?, status? }` — **sem `customer_id`**
- `ExternalSaleResult`: resposta com `id`, `status`, `total_amount`, `total_cost`, `total_profit`, `margin_percent`, `items[]`
- `Customer`: `{ id, name, email, city, province, order_count, total_spent, average_ticket, first_purchase_at, last_purchase_at }`
- `CustomerIndicators`: `{ order_count, total_spent, average_ticket, first_purchase_at, last_purchase_at, favorite_payment_method: string|null, favorite_gateway: string|null, recurrence: number }`
- `CustomerDetail`: `Customer & { indicators: CustomerIndicators }`
- `Order` (substituir forma antiga pela enriquecida): labels (`status_label`, `payment_status_label`, `fulfillment_status_label`, `commercial_status`), `source`, `storefront`, itens com `unit_total_cost`, `unit_profit`, `margin_percent`, `cost_breakdown`, `total_cost`, `total_profit`, `margin_percent`, `discount_amount`, `payment_method`, `gateway`, `payment_installments`, `shipping_cost_customer/owner`, `shipping_carrier`, `has_free_shipping`, `shipping_city/province`, `utm_*` (5), `paid_at/shipped_at/completed_at/cancelled_at`, `customer_email`

### 3.2 Serviços (`src/services/api.ts` — adicionar)

- `costComponentsApi`:
  - `list({ is_active?, search? })` → `GET /cost-components`
  - `create(payload)` / `update(id, payload)` / `delete(id)` → POST/PUT/DELETE `/cost-components[/:id]`
  - `getByProduct(productId)` → `GET /cost-components/product/:productId`
  - `associate({product_id, cost_component_id, quantity})` → `POST /cost-components/associate`
  - `removeAssociation(id)` → `DELETE /cost-components/associate/:id`
  - `simulate({variant_id, unit_price, quantity})` → `POST /cost-components/simulate`
- `externalSalesApi`:
  - `create(payload)` → `POST /external-sales`
  - `searchProducts({search, page?, limit?})` → `GET /external-sales/products`
  - `searchCustomers({search, page?, limit?})` → `GET /external-sales/customers`
- `customersApi`: `getAll({page, limit, search})`, `getById(id)`, `getOrders(id)`
- `dashboardApi.getOrders/getMarketing`: assinatura `(params: { days?: number; start_date?: string; end_date?: string })`; `getStock` inalterado

### 3.3 Glossário (`src/lib/formatters.ts` — estender)

- `typeLabel` (FIXED/PERCENT/PER_ORDER/MONTHLY), `categoryLabel` (7), `calculationBaseLabel` (PRICE/COST)
- `storefrontLabel` (mobile→Celular, web→Site, other_devices→Outros dispositivos)
- `sourceLabel` (NUVEMSHOP→Nuvemshop, EXTERNAL→Venda externa)
- `paymentMethodLabel`: estender com `bank_transfer`→Transferência bancária, `cash`→Dinheiro
- `statusLabel`: estender com PENDING→Pendente, DELIVERED→Entregue, etc.
- Helper `preferLabel(apiLabel: string|null|undefined, fallback: string): string` — usa `status_label`/`payment_status_label`/`fulfillment_status_label`/`commercial_status` quando presentes; fallback local
- UTMs e província: exibidos crus (sem mapa)

### 3.4 Role e rotas

- `SidebarItems`: itens ganham `adminOnly?: boolean`; Layout filtra por `isAdmin(role)` — EMPLOYEE não vê Custos, Venda Externa, Clientes
- `ProtectedRoute`: prop opcional `adminOnly` — redireciona usuário não-admin para `/products` em `/costs`, `/sales`, `/customers`
- `App.tsx`: novas rotas `/costs`, `/sales`, `/customers`
- Interceptor 403 existente (`window.location.href = '/products'`) permanece

### 3.5 Padrão compartilhado de listas (novos arquivos)

- `src/hooks/useTableFilters.ts`: `{ page, limit, search (debounced 500ms), extraFilter?, setPage, setLimit, setSearch, setExtraFilter }` — reset de página ao mudar qualquer filtro
- `src/components/DataTablePagination.tsx`: "Página X de Y", select de limit (10/20/50), Anterior/Próximo, usa props `{ page, limit, total, onPageChange, onLimitChange }`
- Aplicado aos 3 módulos novos; Orders mantém a lógica inline atual (sem refactor)

## 4. Módulo de Custos (`/costs`)

- **Header**: "Custos" + subtítulo + botão "Novo Componente" (admin only)
- **Filtros**: busca por nome (`search`) + select `is_active` (Todos/Ativos/Inativos)
- **Tabela**: Nome, Tipo, Categoria, Valor, Base de cálculo, Status (badge), Ações (dropdown: Editar, Simular custo, Associações, Excluir). Sem coluna de contagem de produtos
- **Dialog criar/editar** (RHF + Zod, schema espelha backend):
  - nome (obrigatório, ≤100), descrição (opcional, ≤500)
  - tipo: 4 opções PT-BR; categoria: 7 opções PT-BR
  - valor (≥0); base de cálculo visível **somente quando tipo = PERCENT** (Zod: `superRefine` obriga para PERCENT)
  - status ativo (switch)
- **Dialog "Simular custo"**: busca de produto (`GET /products?search=`) → select de variante → preço (pré-preenchido do preço da variante, editável) → quantidade (≥1) → `POST /cost-components/simulate` → tabela de resultado: custo por categoria, custo unitário total, lucro unitário, margem % e breakdown. **Zero cálculo no front**
- **Dialog "Associações"**: busca de produto → lista `GET /cost-components/product/:productId` (componente, categoria, valor, quantidade) → "Adicionar componente" (select de componente + quantidade) → `POST /cost-components/associate`; remoção por linha → `DELETE /cost-components/associate/:id`. View é produto→componentes (backend não tem a inversa)
- **Exclusão**: AlertDialog de confirmação → `DELETE /cost-components/:id`
- Estados: skeleton em loading, Alert + "Tentar novamente" em erro, empty state PT-BR
- WebSocket: nada novo (sem eventos específicos; invalidação manual após mutações)

## 5. Módulo Venda Externa (`/sales`)

- **Form** (RHF + Zod):
  - Cliente: nome (obrigatório) + email (opcional) com aviso "Cliente sem email não será salvo no cadastro" quando vazio
  - Combobox "Buscar cliente" → `GET /external-sales/customers?search=` → selecionar preenche nome/email
  - Itens: linhas com combobox de variante (`GET /external-sales/products?search=`, agrupado por produto; preço pré-preenchido da variante), quantidade (≥1); adicionar/remover linhas; mínimo 1 item
  - Desconto (`discount_amount`, ≥0), forma de pagamento (select com 6 opções PT-BR enviando valor cru), gateway (input texto), parcelas (número ≥1), `shipping_cost_owner`, `shipping_cost_customer`, status (select PENDING/PAID/SHIPPED/DELIVERED/CANCELED, default PAID)
  - Submit → `POST /external-sales` (admin only)
- **Resultado**: painel/dialog de sucesso com resposta da API: `total_amount`, `total_cost`, `total_profit`, `margin_percent`, `status`, id — **sem cálculo no front**
- **Reset do form** após sucesso; opção de nova venda

## 6. Módulo Clientes (`/customers`)

- **Lista**: busca + paginação (padrão compartilhado); colunas Nome, Email, Cidade, UF, Pedidos, Total gasto, Ticket médio, Última compra
- **Drawer de detalhe** (`GET /customers/:id`): indicadores (forma de pagamento favorita, gateway preferido, recorrência) + resumo (pedidos, total gasto, ticket médio, primeira/última compra) + histórico de pedidos (`GET /customers/:id/orders`) em tabela (id, data, status label, total)
- **Sem formulários** de criação/edição (backend não expõe mutações de cliente)
- Estados: skeleton/erro/empty conforme padrão

## 7. Drawer de Pedidos (rework — enriquecido)

`Order` usa a forma enriquecida; drawer consome o objeto da lista (sem N+1). Seções:

1. **Cliente**: nome, email, cidade, UF
2. **Status**: badges com `status_label`, `commercial_status`, `payment_status_label`, `fulfillment_status_label` (via `preferLabel`)
3. **Origem**: `source` (`sourceLabel`) + `storefront` (`storefrontLabel`)
4. **Itens**: por item — `unit_price`, `quantity`, `unit_total_cost`, `unit_profit`, `margin_percent` + **breakdown expansível** (tabela componente/tipo/categoria/valor/qtd/total de `cost_breakdown`)
5. **Pagamento**: `payment_method` (`paymentMethodLabel`), `gateway`, `payment_installments`
6. **Frete**: `shipping_cost_customer`, `shipping_cost_owner`, `shipping_carrier`, `has_free_shipping`
7. **Endereço**: `shipping_city`, `shipping_province`
8. **UTMs**: 5 campos crus (somente preenchidos)
9. **Financeiro**: `total_amount`, `discount_amount`, `total_cost`, `total_profit`, `margin_percent` (da API)
10. **Timeline**: `created_at` + apenas `paid_at`/`shipped_at`/`completed_at`/`cancelled_at` preenchidos

Componentes afetados: `OrderCustomerInfo`, `OrderShippingInfo`, `OrderFinancialSummary`
(valores da API, sem cálculo), `OrderItemsTable` (breakdown expansível),
`OrderTimeline` (já recebe timestamps). Novos: `OrderSourceSection`,
`OrderPaymentSection`, `OrderUtmSection` (ou seções agrupadas nos existentes).
Ações de status/cancelar mantidas (admin only). Remoção do form "Novo Pedido"
(CreateOrderForm, createMutation, sheet de criação e imports associados).

## 8. Dashboard (range de datas)

- Novo `src/components/DateRangePicker.tsx`: Popover + Calendar do react-day-picker (já instalado) com seleção de range + presets 7/15/30/60/90 dias
- `useDashboard`: estado `{ startDate: Date|null, endDate: Date|null }`; deriva `days` quando range vazio (default 30)
- Envio: `days` + `start_date`/`end_date` em ISO (`toISOString()`), `end_date` com hora `T23:59:59` (contorna gap de data pura no backend)
- `getStock`: fixo em 30 dias, com nota visual "Estoque: últimos 30 dias" (gap do backend)
- KPI cards, gráficos, rankings e tabelas respondem ao mesmo range

## 9. Passada de consistência (fase final)

- Varredura PT-BR em todos os textos visíveis (login → páginas → drawer → empty states → erros/sucesso)
- Loading/error/empty states nos 3 módulos novos (padrão de Orders)
- Verificação: `npm run lint`, `tsc --noEmit`, `npm run build`, `npm run test`
- Sem textos em inglês visíveis; valores monetários com `Intl.NumberFormat('pt-BR')`

## 10. Gaps do backend (impacto contornado no front)

| Gap | Contorno no front |
|---|---|
| Sem endpoint componente→nº de produtos | Coluna oculta na tela de Custos |
| `/dashboard/stock` sem datas | Cards de estoque fixos em 30 dias + nota |
| `storefront`/`payment_method`/`gateway`/UTMs crus | Glossário local (seção 3.3) |
| `end_date` puro exclui o resto do dia | Envio de `end_date` com `T23:59:59` |

## 11. Fora de escopo

- Alterações no backend (agregação de contagem, datas no stock)
- Refactor das listas existentes (Orders/Products/Inventory/Users) para o padrão compartilhado
- Novos endpoints de cliente (mutação) — inexistentes no backend
