# Enrich Orders & Products Data — Frontend Integration Design

> **Date:** 2026-07-25
> **Branch:** feat/enrich-dashboard-data

## Motivation

The `GET /orders`, `GET /orders/:id`, `GET /products`, and `GET /products/:id` API responses now include new fields extracted from Nuvemshop. The frontend must display these to operators in the order list, a new order detail page, and the product list.

## Scope

- **Priority 1 fields** (13 fields): Display in order list + new detail page
- **Priority 2 fields** (7 fields): Type-only — available via API, no UI display
- **Product variant dimensions** (4 fields): Display in product variant sub-table
- **OrderItem fields** (2 fields): Type-only `unit_packaging_cost` and `unit_platform_fee`
- **Missing existing fields**: `nuvemshop_order_id`, `updated_at` added to `Order` type

## Architecture

Follows the existing project structure (AGENTS.md /src layout):

```
Orders page (list)           Order Detail page
    ↓                              ↓
    └── lib/formatters.ts ←────────┘
                                    ↓
                          OrderTimeline (component)
                          OrderFinancialSummary (component)
                          OrderShippingInfo (component)
                          OrderCustomerInfo (component)
                          OrderItemsTable (component)
```

Consistent with existing patterns: **no separate data-fetching hooks** (pages call `useQuery` directly), **Ant Design** for all UI, **React Query** for server state.

## File Changes

### 1. `src/types/index.ts` — Update type definitions

**Order:** Add all 21 new fields (Priority 1 + Priority 2) plus missing `nuvemshop_order_id` and `updated_at`.

**OrderItem:** Add `unit_packaging_cost: number` and `unit_platform_fee: number`.

**ProductVariant:** Add `weight`, `height`, `width`, `depth` (all `number | null`).

### 2. `src/lib/formatters.ts` — New shared formatting utilities

| Function | Output |
|---|---|
| `formatCurrency(n)` | `R$ 1.234,56` |
| `formatDate(s)` | `13/05/2026` |
| `formatDateTime(s)` | `13/05/2026 14:49` |
| `paymentMethodLabel(s)` | `"Cartão de Crédito"` |
| `statusLabel(s)` | `"Pago"` |
| `statusColor(s)` | Ant Design color string |
| `storefrontLabel(s)` | Icon + label tuple |

Existing inline formatting in `Orders.tsx`, `Products.tsx`, `Inventory.tsx`, `Users.tsx` updated to call these.

### 3. `src/pages/Orders.tsx` — Table enhancements

- **Row click:** `onRow` navigates to `/orders/:id`
- **New columns:**
  - `storefront` — icon badge (mobile/desktop)
  - `payment_method` — colored tag
- **Inline formatters** replaced with `lib/formatters.ts` functions
- **Status type** updated to include `DELIVERED` (new status in API: `PENDING | PAID | SHIPPED | DELIVERED | CANCELED`)

### 4. `src/pages/OrderDetail.tsx` — New page

- Route: `/orders/:id`
- `useQuery` with key `['order', id]` calling `ordersApi.getById(id)`
- Back navigation to `/orders`
- Renders section components (see below)
- Loading → `Spin`, Error → `Result` with retry, Empty/null → meaningful fallback text
- Sidebar: `selectedKeys` logic in `AppLayout` matches `/orders` prefix so "Pedidos" highlights

### 5. `src/components/` — New section components

#### `OrderTimeline.tsx`
- Props: `paid_at`, `shipped_at`, `completed_at`, `cancelled_at`
- Ant Design `Timeline` with 3-4 nodes
- Colors: green = completed, red = cancelled, gray = pending
- Format: `Pago 13/05 14:49` → `Enviado - Pendente` → `Entregue - Pendente`
- If `cancelled_at` is present, only show the cancelled node (timeline terminated)

#### `OrderFinancialSummary.tsx`
- Props: `items`, `total_amount`, `discount_amount`, `shipping_cost_customer`, `payment_method`, `payment_installments`
- Subtotal calculated from items (qty × unit_price)
- Discount shown as negative only if > 0
- Shipping shown as positive only if > 0
- Payment method + installments row at bottom

#### `OrderShippingInfo.tsx`
- Props: `shipping_city`, `shipping_province`, `shipping_carrier`
- Renders only if at least one of city/province is present
- Format: `Belo Horizonte, Minas Gerais — Transportadora: Nuvem Envio`

#### `OrderCustomerInfo.tsx`
- Props: `customer_name`, `customer_email`, `storefront`
- Avatar icon + name on first row
- Email link on second row
- Storefront badge next to name

#### `OrderItemsTable.tsx`
- Props: `items` (array of OrderItem with variant details)
- Ant Design `Table` with columns: Variante, Qtd, Preço Unit., Custo Unit., Subtotal
- Pagination disabled

### 6. `src/pages/Products.tsx` — Variant dimensions column

- New "Dimensões" column in the expandable variant sub-table
- Format: `Peso: 0.250 kg` + `Dimensões: 15 × 9 × 23 cm (L × A × P)`
- Hide entirely if all four dimension fields are `null`

### 7. `src/App.tsx` — Route

- `<Route path="/orders/:id" element={<OrderDetail />} />` inside the protected layout

### 8. `src/components/AppLayout.tsx` — Sidebar highlight fix

- `selectedKeys={[location.pathname]}` → match on prefix so `/orders/:id` still highlights "Pedidos"

### 9. `src/services/api.ts` — No changes needed

API functions already call the correct endpoints. Types are updated in `index.ts` which the service imports.

## Payment Method Labels

```ts
const paymentMethodLabels: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  boleto: 'Boleto',
  nuvem_pago: 'Nuvem Pago',
};
```

Fallback: `method ?? '-'`.

## Status Update

| API value | Display label | Ant Design color |
|---|---|---|
| `PENDING` | Pendente | blue |
| `PAID` | Pago | green |
| `SHIPPED` | Enviado | orange |
| `DELIVERED` | Entregue | cyan |
| `CANCELED` | Cancelado | red |

`DELIVERED` is new — added to `Order.status` type union.

## Error Handling

All async operations follow the four required states per AGENTS.md:

| State | Component | Details |
|---|---|---|
| Loading | Ant Design `Spin` | Centered, message "Carregando pedido..." |
| Error | Ant Design `Result` | status="error", subtitle with error message, retry button calls `refetch()` |
| Empty (null fields) | Inline `—` or `Nenhum dado disponível` | Section components handle null individually |
| Success | Render data | Full content |

## What Is NOT Included

- No dashboard widgets for Priority 2 fields (shipping_cost_owner, UTM data)
- No new API endpoints
- No auth or route protection changes (existing ProtectedRoute wraps the layout)
- No React Router loader functions (React Query handles data fetching)
