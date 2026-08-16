# Nuvemshop Order/Product Fields — Frontend Design

**Goal:** Expose new Nuvemshop fields (`payment_status`, `fulfillment_status`, `has_free_shipping`, `items[].has_promotional_price`, `variants[].has_promotional_price`) in the admin portal, and update the `Order.status` field to use Nuvemshop values (`open`, `closed`, `cancelled`, `paid`, `shipped`) instead of the previous mapped enum.

**Architecture:** Incremental changes to existing types, formatters, pages, and components — no new files. Follows existing data flow (types → formatters → pages → components).

**Tech Stack:** TypeScript, React, TailwindCSS, shadcn/ui

## Changes

### 1. Types (`src/types/index.ts`)

- `Order.status`: Change union from `'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELED'` to `'open' | 'closed' | 'cancelled' | 'paid' | 'shipped'`
- `Order`: Add `payment_status: string | null`, `fulfillment_status: string | null`, `has_free_shipping: boolean | null`
- `OrderItem`: Add `has_promotional_price: boolean | null`
- `ProductVariant`: Add `has_promotional_price: boolean | null`
- `CreateOrderPayload.status`: Update union to new values

### 2. Formatters (`src/lib/formatters.ts`)

Replace `statusLabels` keys:
- `PENDING: 'Pendente'` → `open: 'Ativo'`
- `PAID: 'Pago'` → `paid: 'Pago'`
- `SHIPPED: 'Enviado'` → `shipped: 'Enviado'`
- `DELIVERED: 'Entregue'` → `closed: 'Arquivado'`
- `CANCELED: 'Cancelado'` → `cancelled: 'Cancelado'`

Replace `statusColors` keys with same mapping.
Remove old `DELIVERED` key.

### 3. Orders Page (`src/pages/Orders.tsx`)

- Replace `statusBadgeVariant`, `statusBadgeClass`, `orderStatuses` with new Nuvemshop values
- Update filter `Select` items (Todos, Ativas, Pago, Enviado, Arquivado, Cancelado)
- Update dropdown menu status change actions
- Detail sheet: Add `payment_status` colored badge in its own section
- Detail sheet: Add `fulfillment_status` badge in its own section
- Detail sheet: Pass `has_free_shipping` to OrderShippingInfo
- Detail sheet: Pass `has_promotional_price` items to OrderItemsTable
- Update CreateOrderForm status defaults

### 4. Products Page (`src/pages/Products.tsx`)

- Variant rows: Show `"Promoção"` badge when `has_promotional_price` is `true`
- Fix `"Add Product"` → `"Novo Produto"`

### 5. Order Detail Components

- `OrderItemsTable.tsx`: Accept `items` with `has_promotional_price`, show `"Promo"` badge column
- `OrderShippingInfo.tsx`: Accept `has_free_shipping` prop, show `Truck` icon + `"Frete Grátis"` badge
- `Orders.tsx` detail sheet: Status sections for payment (colored badge) and fulfillment (badge/progress)

### 6. Dashboard (`OrdersCharts.tsx`)

- `STATUS_COLORS` keys: `open: '#3b82f6'`, `closed: '#22c55e'`, `cancelled: '#ef4444'`, `paid: '#f59e0b'`, `shipped: '#06b6d4'`

### 7. Translation Fixes

- `Users.tsx` line 162: `"Filtrar por Role"` → `"Filtrar por Função"`
- `Users.tsx` line 165: `"Todos os Roles"` → `"Todas as Funções"`
- `Users.tsx` lines 474-475: `active` → `Ativo`, `inactive` → `Inativo`

## Badge Placement

All new badges (`payment_status`, `fulfillment_status`, `has_free_shipping`) appear only in the order detail sheet, not as table columns.

## Migration

Old orders may have `null` for new fields. All code handles `null` gracefully.
