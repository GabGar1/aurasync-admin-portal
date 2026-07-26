# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Ant Design with shadcn/ui across the entire app, implementing warm/friendly visual style with micro-interactions, proper states, and improved UX flow.

**Architecture:** CSS-first approach. Update CSS variables and Tailwind config for the warm design tokens (radius, shadows, keyframes). Build a new layout shell using the existing shadcn sidebar (`src/components/ui/sidebar.tsx`). Rewrite pages one at a time using shadcn components and lucide-react icons. Preserve all services, types, hooks, and formatters untouched.

**Tech Stack:** shadcn/ui (Radix primitives), TailwindCSS, lucide-react, sonner (toasts), React Query (unchanged), Recharts (Dashboard, unchanged)

## Global Constraints

- 0 functionality changes — no business logic, API calls, auth, or route structure changes
- Preserve brand purple (#9966CC) — CSS variable `--primary` must stay `270 50% 60%`
- All animations MUST use `motion-safe:` prefix for reduced-motion support
- Every file MUST compile at every task boundary (no intermediate broken state)
- Ant Design package (`antd`, `@ant-design/icons`) MAY be removed only after all pages are migrated

---

### Task 1: CSS Foundation — Design Tokens, Keyframes, Shadows

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`

**Interfaces:**
- Consumes: nothing
- Produces: CSS variables `--shadow-soft`, `--shadow-card`, `--shadow-elevated`; keyframes `fade-in-up`, `scale-in`, `slide-in-right`, `shimmer`, `pulse-soft`; Tailwind animation/spacing extensions

- [ ] **Update `src/index.css` — new CSS variables**

Change `--radius` from `0.5rem` to `0.875rem` (14px for cards). Add shadow and gradient variables. Add keyframes. Remove the Ant Design override block at the bottom.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 40 33% 97%;
    --foreground: 240 10% 10%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 10%;
    --primary: 270 50% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 40 33% 97%;
    --secondary-foreground: 240 10% 20%;
    --muted: 240 5% 92%;
    --muted-foreground: 240 5% 46%;
    --accent: 270 50% 95%;
    --accent-foreground: 270 50% 30%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 6% 90%;
    --input: 240 6% 90%;
    --ring: 270 50% 60%;
    --radius: 0.875rem;
    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 240 5% 26%;
    --sidebar-primary: 270 50% 60%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 270 50% 95%;
    --sidebar-accent-foreground: 270 50% 30%;
    --sidebar-border: 240 6% 90%;
    --sidebar-ring: 270 50% 60%;
    --shadow-soft: 0 2px 16px hsl(270 50% 60% / 0.06);
    --shadow-card: 0 4px 24px hsl(0 0% 0% / 0.04);
    --shadow-elevated: 0 8px 32px hsl(0 0% 0% / 0.08);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
}

@layer utilities {
  .shadow-soft {
    box-shadow: var(--shadow-soft);
  }
  .shadow-card {
    box-shadow: var(--shadow-card);
  }
  .shadow-elevated {
    box-shadow: var(--shadow-elevated);
  }
}
```

- [ ] **Update `tailwind.config.ts` — new shadows, keyframes, animations**

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

- [ ] **Verify compile**

```bash
npx tsc --noEmit 2>&1 && npx vite build 2>&1
```

Expected: Build succeeds. No TypeScript errors from CSS changes.

- [ ] **Commit**

```bash
git add src/index.css tailwind.config.ts
git commit -m "style: update design tokens with warm radius, shadows, and keyframes"
```

---

### Task 2: Layout Shell — shadcn Sidebar

**Files:**
- Create: `src/components/SidebarItems.tsx`
- Create: `src/pages/Layout.tsx`
- Modify: `src/App.tsx`
- Delete: `src/components/AppLayout.tsx`

**Interfaces:**
- Consumes: React Router's `Outlet` and `useNavigate`/`useLocation`
- Produces: New layout wrapper that pages render inside via `App.tsx`

- [ ] **Create `src/components/SidebarItems.tsx` — shared sidebar menu items**

Standard navigation items for the sidebar. Uses lucide-react icons.

```tsx
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
} from "lucide-react";

export const sidebarItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Pedidos", url: "/orders", icon: ShoppingCart },
  { title: "Inventário", url: "/inventory", icon: BarChart3 },
  { title: "Usuários", url: "/users", icon: Users },
];
```

- [ ] **Create `src/pages/Layout.tsx` — new layout shell using shadcn sidebar**

```tsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { sidebarItems } from "@/components/SidebarItems";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User } from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUser, logout } = useAuth();
  const user = getUser();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarHeader className="h-16 border-b flex items-center px-6">
          <img src="./logo_nome.png" alt="AuraSync" className="h-8" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.url || location.pathname.startsWith(item.url + "/")}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sm">
                <User className="h-4 w-4 text-sidebar-foreground" />
                <span className="flex-1 text-left truncate">
                  {user ? `${user.first_name} ${user.last_name}` : "Admin"}
                </span>
                <ChevronDown className="h-3 w-3 text-sidebar-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-8">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <span className="font-medium text-sm text-muted-foreground">
            {sidebarItems.find((i) => location.pathname === i.url || location.pathname.startsWith(i.url + "/"))?.title || "AuraSync"}
          </span>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Update `src/App.tsx`** — replace AppLayout import and usage with Layout

Remove line `import AppLayout from '@/components/AppLayout';`
Add `import Layout from '@/pages/Layout';`
Change `<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>` to `<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>`

- [ ] **Delete `src/components/AppLayout.tsx`**

- [ ] **Verify compile**

```bash
npx tsc --noEmit 2>&1 && npx vite build 2>&1
```

Expected: App mounts, sidebar visible, clicking menu items navigates, collapse works, header shows context title, user dropdown works.

- [ ] **Commit**

```bash
git add src/pages/Layout.tsx src/components/SidebarItems.tsx src/App.tsx
git rm src/components/AppLayout.tsx
git commit -m "feat: replace Ant Layout with shadcn sidebar shell"
```

---

### Task 3: Dashboard Page

**Files:**
- Modify: `src/pages/Dashboard.tsx` (full rewrite)

**Interfaces:**
- Consumes: `dashboardApi.getStats()` from services, `Recharts` for charts
- Produces: Working dashboard with real data, KPI cards, charts, recommendations table

- [ ] **Rewrite `src/pages/Dashboard.tsx`**

Replace the entire file. Structure:

```tsx
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, AlertCircle, TrendingDown, DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
```

Key sections to implement:
1. **Page header** — h1 "Inteligência de Estoque", subtitle, search + category + date filters (same pattern)
2. **3 KPI cards** — using `Card` with `hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 motion-safe:animate-fade-in-up`
   - Each card: icon circle (DollarSign/TrendingDown/AlertCircle with bg-primary/10, rounded-full p-2), value (text-3xl font-bold), label (text-sm text-muted-foreground)
   - Skeleton loading state for each KPI
   - Connect `dashboardApi.getStats()` for real data
3. **Charts row** — 2 column grid, PieChart (composition by category) + BarChart (top margins)
   - Same recharts components as current, but wrapped in shadcn Card
   - Colors array: `['#9966CC', '#52c41a', '#faad14', '#1890ff']`
4. **Recommendations table** — shadcn Table, columns: Diagnóstico (Badge `variant="warning"`), Produto, Ação, Impacto (Badge green/red)

**Starting point from current file:** Keep the same mock data pattern for charts (mockProducts, categoryData, topMarginData, actionableInsights) BUT also connect the real API for KPI stats. The mock data for charts can be replaced later when the backend has endpoints.

**Error state:** Alert with retry button if `getStats()` fails
**Loading state:** 3 skeleton cards in a row for KPIs, skeleton chart areas
**Empty state:** No recommendations → "Nenhuma ação recomendada no momento"

- [ ] **Verify compile**

```bash
npx tsc --noEmit 2>&1 && npx vite build 2>&1
```

Expected: Dashboard renders with warm cards, KPIs show real data (or 0 if API unavailable), chart grids show, no Ant Design imports remain in this file.

- [ ] **Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: redesign Dashboard with shadcn cards, stat indicators, and loading states"
```

---

### Task 4: Orders Page + Detail Sheet

**Files:**
- Modify: `src/pages/Orders.tsx` (full rewrite)
- Modify: `src/components/OrderTimeline.tsx` (refactor from Ant)
- Modify: `src/components/OrderFinancialSummary.tsx` (refactor from Ant)
- Modify: `src/components/OrderShippingInfo.tsx` (refactor from Ant)
- Modify: `src/components/OrderCustomerInfo.tsx` (refactor from Ant)
- Modify: `src/components/OrderItemsTable.tsx` (refactor to shadcn Table)

**Interfaces:**
- Consumes: `ordersApi` from services, `useQuery` for data, `useWebSocket` for realtime
- Produces: Order list with Sheet detail panel, refactored section components

- [ ] **Refactor `src/components/OrderTimeline.tsx`** — replace Ant `Timeline` with custom divs

```tsx
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatTime } from "@/lib/formatters";

interface Props {
  paid_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export default function OrderTimeline({ paid_at, shipped_at, completed_at, cancelled_at }: Props) {
  if (cancelled_at) {
    return (
      <div className="space-y-3">
        <TimelineStep icon={XCircle} color="text-red-500" label="Cancelado" time={formatTime(cancelled_at)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TimelineStep icon={CheckCircle2} color={paid_at ? "text-green-500" : "text-gray-300"} label="Pago" time={paid_at ? formatTime(paid_at) : "Pendente"} />
      <TimelineStep icon={CheckCircle2} color={shipped_at ? "text-green-500" : "text-gray-300"} label="Enviado" time={shipped_at ? formatTime(shipped_at) : "Pendente"} />
      <TimelineStep icon={CheckCircle2} color={completed_at ? "text-green-500" : "text-gray-300"} label="Entregue" time={completed_at ? formatTime(completed_at) : "Pendente"} />
    </div>
  );
}

function TimelineStep({ icon: Icon, color, label, time }: { icon: any; color: string; label: string; time: string }) {
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

- [ ] **Refactor `src/components/OrderFinancialSummary.tsx`** — replace Ant `Descriptions` with div grid

Use a simple grid layout with labels and values. Same pattern: subtotal from items, discount as negative (red), shipping as positive, total bold, payment method + installments.

- [ ] **Refactor `src/components/OrderShippingInfo.tsx`** — replace Ant `Empty`/`Descriptions` with custom fallback

If no data: <div className="text-sm text-muted-foreground py-4 text-center">Nenhuma informação de frete disponível</div>
If data: div with flex layout showing city, province, carrier.

- [ ] **Refactor `src/components/OrderCustomerInfo.tsx`** — replace Ant components with shadcn-style

Replace Ant `Avatar` with lucide `User` + rounded-full bg div.
Replace Ant `Tag` with shadcn `Badge`.
Replace Ant `Link` with `<a>` styled with `text-primary hover:underline`.

- [ ] **Refactor `src/components/OrderItemsTable.tsx`** — replace Ant `Table` with shadcn `Table`

Use `<Table>` wrapper, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>`.
Same columns: Variante, Qtd, Preço Unit., Custo Unit., Subtotal.

- [ ] **Rewrite `src/pages/Orders.tsx`** — full replacement

Structure:
```tsx
// Imports: React, hooks (useState, useNavigate), lucide icons
// Imports: useQuery, useMutation, useQueryClient from @tanstack/react-query
// Imports: shadcn Table, Badge, Button, Card, Input, Select, Sheet components
// Imports: DropdownMenu components for actions

// Main component:
// 1. Filter bar (search Input + status Select + date range)
// 2. Toolbar (result count + Sync button + New Order button)
// 3. shadcn Table with columns: ID, Cliente, Data, Pagamento, Status, Canal, Total, Ações
//    - Row click via onRow → opens Sheet, not navigation
//    - Status as Badge with dot variant
//    - Payment as double Badge (method + installments)
//    - Storefront as MobileOutlined/DesktopOutlined icon
// 4. Sheet slides from right (640px) with OrderDetail content
//    - SheetHeader with close button, title, status badge
//    - SheetContent with scrollable sections
//    - Composes refactored OrderTimeline, OrderFinancialSummary, etc.
//    - SheetFooter with status select + cancel button (admin)
// 5. Create Order Sheet (instead of Modal)
//    - Same form fields, same logic, new UI
// 6. Sync mutation, delete mutation, update mutation — same as current
```

**Loading state:** Table shows `loading` prop with skeleton rows
**Empty state:** When no orders, show a centered div with ShoppingCart icon + "Nenhum pedido encontrado" + CTA button
**Error state:** Alert with retry

- [ ] **Verify compile**

```bash
npx tsc --noEmit 2>&1 && npx vite build 2>&1
```

Expected: Orders table renders with new shadcn components. Clicking a row opens a Sheet with order details. Back button still works for direct `/orders/:id` navigation.

- [ ] **Commit**

```bash
git add src/pages/Orders.tsx src/components/Order*.tsx
git commit -m "feat: redesign Orders with shadcn Table and Sheet detail panel"
```

---

### Task 5: Products Page

**Files:**
- Modify: `src/pages/Products.tsx` (full rewrite)
- Modify: `src/components/CreateProductModal.tsx` (rewrite as Sheet)

**Interfaces:**
- Consumes: `productsApi` from services
- Produces: Product list with collapsible variant rows, Sheet for create

- [ ] **Rewrite `src/components/CreateProductModal.tsx` as a Sheet**

Replace Ant `Modal` + Ant `Form` with shadcn `Sheet` + shadcn `Input`/`Select`. Keep same form fields and validation logic.

```tsx
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productsApi } from "@/services/api";
import type { CreateProductPayload } from "@/types";
import { message } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = ["Brincos", "Anéis", "Braceletes", "Chokers", "Conjuntos", "Pingentes", "Chaveiros", "Decoração", "Pulseiras", "Geral"];

export default function CreateProductSheet({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  // ... form state and submit handler (same logic as current CreateProductModal)
}
```

Keep the same shape for `CreateProductPayload` — no functional changes.

- [ ] **Rewrite `src/pages/Products.tsx`** — full replacement

Structure:
```tsx
// Imports: shadcn components (Table, Card, Badge, Button, Input, Select, Collapsible, etc.)
// Imports: lucide icons (Package, Search, ChevronDown, Plus, RefreshCw)
// Imports: hooks, services, types same as before

// Main component:
// 1. Page header + Filter bar (search + category Select)
// 2. Toolbar (result count + Sync button + Add Product button)
// 3. shadcn Table with expandable rows using Collapsible
//    - Main columns: Nome (bold) + Slug (muted below), Categoria (Badge), Status (Badge dot), Variações count
//    - Expanded row: inner Card (bg-muted rounded-xl) with variant sub-table
//      - Variant columns: Nome, SKU (Badge), Preço, Estoque (color dot + number), Dimensões
//    - Row hover: bg-accent/20 transition
//    - Expand animation: animate-fade-in-up
// 4. Create Product Sheet component
// 5. Delete mutation with AlertDialog confirmation
```

**Stock indicator colors** (replace inline hex):
- `> 10`: `text-green-600` + green dot
- `5-10`: `text-amber-600` + amber dot  
- `<= 5`: `text-red-600 font-semibold` + red dot + "Repor" Badge

**Dimensions display** (preserve existing logic):
```
Peso: 0.250 kg
Dim.: 15 × 9 × 23 cm
```

- [ ] **Verify compile**

```bash
npx tsc --noEmit 2>&1 && npx vite build 2>&1
```

Expected: Products list renders, expand/collapse works with animation, create sheet opens, create saves successfully.

- [ ] **Commit**

```bash
git add src/pages/Products.tsx src/components/CreateProductModal.tsx
git commit -m "feat: redesign Products with shadcn Table and Sheet create form"
```

---

### Task 6: Inventory + Users Pages

**Files:**
- Modify: `src/pages/Inventory.tsx` (full rewrite)
- Modify: `src/pages/Users.tsx` (full rewrite)

**Interfaces:**
- Consumes: `inventoryApi` / `usersApi` from services
- Produces: Working list + CRUD pages using shadcn components

- [ ] **Rewrite `src/pages/Inventory.tsx`**

Replace Ant `Table` with shadcn `Table`, Ant `Tag` with shadcn `Badge`, Ant `Modal` with shadcn `Dialog` for Ajuste Manual.

Same columns: Data, Variant ID (mono), Tipo (Badge: SALE=blue, RESTOCK=green, ADJUSTMENT=amber), Quantidade (+green/-red, font-semibold), Pedido ID, Ações.

Same mutations: getTransactions, createTransaction.
Same delete/confirm logic using shadcn `AlertDialog`.

- [ ] **Rewrite `src/pages/Users.tsx`**

Replace Ant `Table` with shadcn `Table`, Ant `Modal` with shadcn `Dialog` for create/edit.

Same columns: Nome + Email (name bold, email muted below), Role (Badge: ADMIN=purple, EMPLOYEE=default, SUPER_ADMIN=purple outline), Status (Badge dot: green=active, gray=inactive), Criado em, Ações (dropdown: Editar, Desativar).

Same mutations: create, update, delete user.
Create/Edit dialog: shadcn `Dialog` with `Input` fields, same validation as current.

- [ ] **Verify compile**

```bash
npx tsc --noEmit 2>&1 && npx vite build 2>&1
```

Expected: Both pages work identically to before, just with new shadcn components.

- [ ] **Commit**

```bash
git add src/pages/Inventory.tsx src/pages/Users.tsx
git commit -m "feat: redesign Inventory and Users with shadcn components"
```

---

### Task 7: Login + Cleanup

**Files:**
- Modify: `src/pages/Login.tsx` (rewrite)
- Modify: `src/pages/NotFound.tsx` (minor tweaks)
- Modify: `package.json` (remove antd, @ant-design/icons)
- Possibly delete: `src/App.css`

**Interfaces:**
- Consumes: nothing from Ant Design anymore
- Produces: Clean migration, verified build

- [ ] **Rewrite `src/pages/Login.tsx`**

Replace Ant `Card` with shadcn `Card` (with `CardHeader`, `CardContent`). Replace Ant `Form` with native form + shadcn `Input`. Replace Ant `Button` with shadcn `Button`. Replace Ant icons with lucide icons (Mail, Lock).

Add gradient top border to card (`border-t-4 border-t-primary bg-gradient-to-r`). Add `motion-safe:animate-fade-in-up` entrance.

Same auth logic: `authApi.login()`, localStorage token save, redirect to `/`.

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api";
import { Mail, Lock, LogIn } from "lucide-react";
import { message } from "sonner";
```

- [ ] **Remove Ant Design from `package.json`**

```bash
npm uninstall antd @ant-design/icons
```

- [ ] **Delete `src/App.css`** (Vite boilerplate, overridden by layout)

- [ ] **Verify compile** — full build, no Ant imports remain

```bash
npx tsc --noEmit 2>&1 && npx vite build 2>&1
```

Expected: Build succeeds with zero Ant Design imports. All pages functional with shadcn equivalents.

- [ ] **Commit**

```bash
git add src/pages/Login.tsx src/pages/NotFound.tsx package.json
git rm src/App.css 2>/dev/null || true
git commit -m "feat: redesign Login page and remove Ant Design dependency"
```
