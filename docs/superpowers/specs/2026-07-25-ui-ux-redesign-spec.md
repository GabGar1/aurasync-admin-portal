# AuraSync Admin Portal — UI/UX Redesign

> **Date:** 2026-07-25
> **Branch:** TBD
> **Scope:** Full UI overhaul — no functionality or business logic changes

## Motivation

The current admin portal uses Ant Design with inconsistent inline styling, no micro-interactions, poor empty/loading states, and outdated visual hierarchy. The goal is a modern, warm, premium SaaS experience while preserving all existing functionality.

## Visual Direction

Warm, rounded, friendly (Duolingo/Airbnb inspired) with the existing purple brand (#9966CC). Soft shadows, pill-shaped buttons, generous spacing, spring-like animations.

## Design Tokens (CSS Variables)

| Token | Value | Notes |
|---|---|---|
| `--radius` | `0.875rem` (14px) | Card corners |
| Button radius | `9999px` | Pill-shaped |
| Input radius | `0.75rem` (12px) | Soft inputs |
| `--background` | `40 33% 97%` | Kept existing warm off-white |
| `--card` | `0 0% 100%` | White cards (unchanged) |
| `--primary` | `270 50% 60%` | Brand purple, unchanged |
| `--accent` | `270 50% 95%` | Light purple, unchanged |
| `--gradient-accent` | `linear-gradient(135deg, hsl(270 50% 60%), hsl(290 60% 65%))` | New: warm purple gradient |
| Shadow | `0 4px 24px hsl(0 0% 0% / 0.04)` | Card shadow |
| Elevated shadow | `0 8px 32px hsl(0 0% 0% / 0.08)` | Modals/dropdowns |
| Purple glow shadow | `0 2px 16px hsl(270 50% 60% / 0.06)` | Brand shadow for CTAs |

## Architecture

```
src/
├── index.css              ← Updated CSS variables, keyframes, transition utilities
├── tailwind.config.ts      ← New shadows, animations, spacing
├── components/
│   ├── ui/                 ← shadcn components (with new custom variants)
│   ├── sidebar-wrapper.tsx ← New: wraps shadcn sidebar with project menu items
│   └── ... (section components stay, refactored to shadcn)
├── pages/
│   ├── Layout.tsx          ← NEW: replaces AppLayout.tsx (shadcn sidebar + header)
│   ├── Dashboard.tsx       ← Rewritten
│   ├── Orders.tsx          ← Rewritten (with Sheet detail panel)
│   ├── Products.tsx        ← Rewritten (with Collapsible expand)
│   ├── Inventory.tsx       ← Rewritten
│   ├── Users.tsx           ← Rewritten
│   ├── Login.tsx           ← Rewritten (small)
│   └── NotFound.tsx        ← Already shadcn, minor tweaks
├── lib/
│   ├── formatters.ts       ← Preserved as-is
│   └── utils.ts            ← Preserved as-is
├── services/
│   └── api.ts              ← Preserved as-is
├── types/
│   └── index.ts            ← Preserved as-is
└── hooks/
    ├── useAuth.ts          ← Preserved
    └── useWebSocket.ts     ← Preserved
```

## Page-by-Page Changes

### New: Layout Shell (replaces AppLayout.tsx)

- shadcn `Sidebar` with 5 nav items (Dashboard, Produtos, Pedidos, Inventário, Usuários)
- lucide-react icons
- Collapsible to icon-only (Ctrl+B toggle), mobile renders as Sheet
- Sticky header with `backdrop-blur-sm`, breadcrumbs, page action buttons
- Sidebar footer with user avatar + name
- Content area: `p-8`, scrollable

### Dashboard

- Real API data (connect `dashboardApi.getStats()`)
- 3 KPI Cards: animated icon circles, value, trend indicator, hover lift effect
- PieChart (recharts) in Card, BarChart in Card — wrapped in shadcn Card + Chart
- "Ações Recomendadas" table → shadcn Table, bordered-less, badge diagnostics

### Orders

- shadcn Table: clean, no borders, hover state (light purple), status dot badges, payment badges
- Filter bar: search + status combobox, collapsible extra filters, active filter count badge
- Actions: 3-dot dropdown (Alterar status, Cancelar) instead of inline select
- Row click: opens Sheet (drawer) from right instead of full page navigation
- Create/Edit: Sheet drawer (600px+, scrollable, sections) instead of Modal
- Empty state: illustration + "Nenhum pedido encontrado"

### Order Detail (Sheet variant + standalone page)

- Sheet slides from right, 640px, sticky header/footer
- Sections: Customer, Timeline, Financial Summary, Shipping, Items, Dates
- Standalone page at `/orders/:id` preserved for direct URL access
- Status change + Cancel in sticky footer

### Products

- shadcn Table: clean, expandable rows (Collapsible with animate-in)
- Expanded: inner Card (bg-muted, rounded-xl) with variant sub-table
- Stock: green/amber/red dot indicator instead of hex colors
- Dimensions: compact muted text
- Create Product → Sheet drawer

### Inventory

- shadcn Table: clean, no borders
- Type Badges: SALE=blue, RESTOCK=green, ADJUSTMENT=amber
- Quantity: green+ / red- with font-semibold
- Ajuste Manual: Dialog (short form, stays modal)

### Users

- shadcn Table: clean, no borders
- Name+Email cell, Role badges, Status dot
- Create/Edit: Dialog (short forms)

### Login

- shadcn Card instead of Ant Card
- Gradient top border on card
- Gradient CTA button
- Fade-in entrance animation

## Micro-Interactions & Animations

| Keyframe | CSS | Usage |
|---|---|---|
| fade-in-up | opacity 0→1, y 8px→0 | Page/component enter |
| scale-in | scale 0.95→1 | Dialog/sheet enter |
| slide-in-right | x 100%→0 | Sheet drawer |
| shimmer | gradient sweep | Skeleton loading |
| pulse-soft | opacity 0.5→1→0.5 | Loading (slower pulse) |

Applied via `motion-safe:` prefix for reduced-motion support.

## States

Every component handles four states:
- **Loading:** Skeleton component (shadcn Skeleton) with shimmer
- **Error:** Alert (destructive variant) with retry button
- **Empty:** Illustration + message + optional CTA
- **Success:** Full content render

## Accessibility

- Radix UI primitives handle keyboard nav, focus management, ARIA
- `focus-visible:ring-2` ring on all interactive elements
- `sr-only` labels on icon-only buttons
- `motion-safe:` prefix for all animations (respects prefers-reduced-motion)
- Responsive breakpoints: sidebar→sheet on mobile, tables→scroll on mobile

## What Is NOT Changed

- All business logic (services, API calls, React Query, mutations)
- All types and interfaces
- All hooks (useAuth, useWebSocket)
- Formatters and utilities
- Route structure (except `/orders/:id` now opens Sheet from list)
- Authentication flow
- WebSocket realtime updates
- Admin/employee permission gates
- Color palette (keeping existing purple brand)

## Files to Delete or Rewrite

| File | Action |
|---|---|
| `src/components/AppLayout.tsx` | Delete (replaced by Layout.tsx) |
| `src/pages/OrderDetail.tsx` | Keep for direct URL access |
| `src/pages/Orders.tsx` | Rewrite |
| `src/pages/Products.tsx` | Rewrite |
| `src/pages/Dashboard.tsx` | Rewrite |
| `src/pages/Inventory.tsx` | Rewrite |
| `src/pages/Users.tsx` | Rewrite |
| `src/pages/Login.tsx` | Rewrite |
| `src/components/OrderTimeline.tsx` | Refactor to shadcn |
| `src/components/OrderFinancialSummary.tsx` | Refactor to shadcn |
| `src/components/OrderShippingInfo.tsx` | Refactor to shadcn |
| `src/components/OrderCustomerInfo.tsx` | Refactor to shadcn |
| `src/components/OrderItemsTable.tsx` | Refactor to shadcn Table |
| `src/components/CreateProductModal.tsx` | Rewrite as Sheet |
