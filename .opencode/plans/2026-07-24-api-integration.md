# AuraSync API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan plan-by-plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock data with real API calls across Products, Orders, Inventory, and Users pages, aligning types and UI with the AuraSync API spec.

**Architecture:** Single-page React app using @tanstack/react-query for server state, Axios for HTTP (centralized in `api.ts`), Ant Design for UI. Each plan builds on the previous — types first, then endpoints, then UI, then guards.

**Tech Stack:** React 18, TypeScript, @tanstack/react-query 5, Axios, Ant Design 6

## Global Constraints

- All API calls go through `src/services/api.ts` — no direct `axios` usage in pages
- Auth token (`aurasync_token`) injected via Axios interceptor (already implemented)
- TypeScript is non-strict — don't add strict type enforcement
- Price/cost/fee fields are decimals (send `99.90`, not `9990`)
- All GET product endpoints are public (no auth needed)
- Order/Inventory/Users GET endpoints require any auth (token present)
- POST/PUT/DELETE on Orders, Inventory, Users require ADMIN role
- `SUPER_ADMIN` behaves identically to `ADMIN`
- Mock data should be removed once replaced with real calls
- Tests: files matching `src/**/*.{test,spec}.{ts,tsx}`
- Commands: `npm test` (single pass), `npm run lint` (ESLint), `npm run dev` (port 8080)

---

## Plan 1: Types & API Service Layer

**Files:**
- Modify: `src/types/index.ts` — all interfaces
- Modify: `src/services/api.ts` — all API functions
- Modify: `src/components/AppLayout.tsx` — display name from `user.name` to `user.first_name`
- Read-only: `src/hooks/useAuth.ts`, `src/pages/Login.tsx` — no changes needed

**Summary:** Rewrite every type to match the API response/request shapes, then replace every mock async function in `api.ts` with a real HTTP call. This plan touches no UI logic — only data contracts and service functions. After this plan, the app will hit real endpoints but existing pages may show stale data until their types are updated in subsequent plans.

**Verification:** `npm run lint` passes. `npm run dev` starts without TS errors.

### New Type Definitions

Replace the entire `src/types/index.ts` with:

```typescript
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
  status: string;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock_quantity: number;
  cost_price: number;
  packaging_cost: number;
  platform_fee_percent: number;
  fixed_fee: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  is_active: boolean;
  variants: ProductVariant[];
}

export interface GetProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProductPayload {
  slug: string;
  name: string;
  category: string;
  is_active: boolean;
  variants: {
    sku: string;
    name: string;
    price: number;
    stock_quantity: number;
    cost_price: number;
    packaging_cost: number;
    platform_fee_percent: number;
    fixed_fee: number;
  }[];
}

export interface OrderItem {
  id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELED';
  items: {
    variant_id: string;
    quantity: number;
    unit_price: number;
    unit_cost: number;
  }[];
}

export interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELED';
  created_at: string;
  items: OrderItem[];
}

export interface GetOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface InventoryTransaction {
  id: string;
  variant_id: string;
  type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT';
  quantity_changed: number;
  order_id?: string;
  created_at: string;
}

export interface GetInventoryResponse {
  transactions: InventoryTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateInventoryPayload {
  variant_id: string;
  type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT';
  quantity_changed: number;
  order_id?: string;
}

export interface GetUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  status?: string;
}

export interface DashboardStats {
  totalSales: number;
  activeProducts: number;
  pendingOrders: number;
  lowStockAlerts: number;
}
```

- [ ] **Step 1:** Rewrite `src/types/index.ts` with all interfaces above

- [ ] **Step 2:** Update `src/components/AppLayout.tsx:75` — change `user?.name || 'Admin'` to:
  ```tsx
  {user ? `${user.first_name} ${user.last_name}` : 'Admin'}
  ```

- [ ] **Step 3:** Rewrite `src/services/api.ts` — replace entire file with real HTTP functions (full code in plan below)

- [ ] **Step 4:** Run `npm run lint` — verify no errors

### api.ts replacement code

```typescript
import axios from 'axios';
import type {
  LoginPayload, LoginResponse, Product, CreateProductPayload,
  GetProductsResponse, Order, CreateOrderPayload, GetOrdersResponse,
  InventoryTransaction, CreateInventoryPayload, GetInventoryResponse,
  DashboardStats, User, CreateUserPayload, UpdateUserPayload, GetUsersResponse,
} from '@/types';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aurasync_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', payload);
    return response.data;
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};

export const productsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; category?: string; is_active?: boolean }): Promise<GetProductsResponse> => {
    const response = await api.get<GetProductsResponse>('/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/slug/${slug}`);
    return response.data;
  },

  create: async (product: CreateProductPayload): Promise<Product> => {
    const response = await api.post<Product>('/products', product);
    return response.data;
  },

  update: async (id: string, product: Partial<CreateProductPayload>): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, product);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  syncNuvemshop: async (): Promise<{ success: boolean; processed: number }> => {
    const response = await api.post('/products/sync/nuvemshop');
    return response.data;
  },
};

export const ordersApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<GetOrdersResponse> => {
    const response = await api.get<GetOrdersResponse>('/orders', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  create: async (order: CreateOrderPayload): Promise<Order> => {
    const response = await api.post<Order>('/orders', order);
    return response.data;
  },

  update: async (id: string, order: Partial<CreateOrderPayload>): Promise<Order> => {
    const response = await api.put<Order>(`/orders/${id}`, order);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};

export const inventoryApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<GetInventoryResponse> => {
    const response = await api.get<GetInventoryResponse>('/inventory', { params });
    return response.data;
  },

  getByVariant: async (variantId: string): Promise<InventoryTransaction[]> => {
    const response = await api.get<InventoryTransaction[]>(`/inventory/variant/${variantId}`);
    return response.data;
  },

  create: async (payload: CreateInventoryPayload): Promise<InventoryTransaction> => {
    const response = await api.post<InventoryTransaction>('/inventory', payload);
    return response.data;
  },
};

export const usersApi = {
  getAll: async (params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<GetUsersResponse> => {
    const response = await api.get<GetUsersResponse>('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const response = await api.post<User>('/users', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

export default api;
```

---

## Plan 2: Products Page — Full CRUD

**Files:**
- Modify: `src/pages/Products.tsx`
- Modify: `src/components/CreateProductModal.tsx`

**Summary:** Update Products page to use the new `Product` type with `is_active`, `stock_quantity`, cost/fee fields. Wire CreateProductModal to `productsApi.create`. Add delete with confirmation. Switch from `nuvemshop_id` to `id` as rowKey.

**Verification:** `npm run lint` passes. Can list, create, and delete products via UI.

- [ ] **Step 1:** In `Products.tsx`, replace all type references:
  - `rowKey="nuvemshop_id"` → `rowKey="id"`
  - `b.active` → `b.is_active`
  - `product.active` → `product.is_active`
  - Remove `nuvemshop_id` column or rename to `id`
  - Update variant expandable table: `stock` → `stock_quantity` (already using `stock_quantity` in render, but `ProductVariant.stock` doesn't exist anymore)

- [ ] **Step 2:** In `Products.tsx`, add a delete mutation after `syncMutation`:
  ```typescript
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      message.success('Produto excluído com sucesso');
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => message.error(`Falha ao excluir: ${err?.message || 'Erro desconhecido'}`),
  });
  ```

- [ ] **Step 3:** Add an actions column in the products table with a delete button:
  ```typescript
  {
    title: 'Ações',
    key: 'actions',
    width: 100,
    render: (_: any, record: Product) => (
      <Button
        danger
        size="small"
        loading={deleteMutation.isPending}
        onClick={() => {
          Modal.confirm({
            title: 'Excluir produto?',
            content: `Tem certeza que deseja excluir "${record.name}"?`,
            okText: 'Excluir',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: () => deleteMutation.mutate(record.id),
          });
        }}
      >
        Excluir
      </Button>
    ),
  }
  ```

- [ ] **Step 4:** Rewrite `CreateProductModal.tsx`:
  - Accept `onSuccess` callback prop in addition to `open`/`onClose`
  - Restructure unit mode form to match `CreateProductPayload`:
    - Fields: `name`, `slug`, `category`, `sku`, `price`, `stock_quantity`, `cost_price`, `packaging_cost`, `platform_fee_percent`, `fixed_fee`
    - On submit: call `productsApi.create(values)`, then `onClose()`, then `onSuccess()`
  - Remove batch/lote mode entirely (YAGNI — no API supports batch creation)
  - Import `useMutation`/`useQueryClient` or accept `onSuccess` to invalidate parent query

- [ ] **Step 5:** Pass `onSuccess` from `Products.tsx` to `CreateProductModal`:
  ```tsx
  <CreateProductModal
    open={modalOpen}
    onClose={() => setModalOpen(false)}
    onSuccess={() => qc.invalidateQueries({ queryKey: ['products'] })}
  />
  ```

- [ ] **Step 6:** Run `npm run lint` and manually test in browser

---

## Plan 3: Orders Page — Full CRUD

**Files:**
- Modify: `src/pages/Orders.tsx`

**Summary:** Replace mock data with real paginated API calls. Add create order modal, inline status update, delete with confirmation, WebSocket listener, and "Insufficient stock" error handling.

**Verification:** `npm run lint` passes. Can list (paginated), create, update status, and delete orders.

- [ ] **Step 1:** Rewrite query to use paginated params:
  ```typescript
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, limit, statusFilter, search],
    queryFn: () => ordersApi.getAll({ page, limit, status: statusFilter, search: search || undefined }),
    placeholderData: (previousData) => previousData,
  });
  ```

- [ ] **Step 2:** Add columns matching new Order type:
  ```typescript
  const statusColors: Record<string, string> = {
    PENDING: 'blue', PAID: 'green', SHIPPED: 'orange', CANCELED: 'red',
  };
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'Cliente', dataIndex: 'customer_name', key: 'customer_name' },
    { title: 'Total', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => `R$ ${v.toFixed(2)}` },
    { title: 'Data', dataIndex: 'created_at', key: 'created_at', render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    { title: 'Itens', key: 'items', render: (_: any, r: Order) => r.items?.length || 0 },
  ];
  ```

- [ ] **Step 3:** Add search/filter bar (similar to Products page pattern).

- [ ] **Step 4:** Add create order mutation and modal. Modal form fields:
  - `customer_name` (Input, required)
  - `status` (Select: PENDING, PAID, SHIPPED, CANCELED)
  - Dynamic items list: each item has `variant_id` (Input), `quantity` (InputNumber), `unit_price` (InputNumber), `unit_cost` (InputNumber)
  - On submit: `ordersApi.create(payload)`, invalidate `['orders']`, show success/error toast

- [ ] **Step 5:** Add update mutation (status change via Select dropdown in table or edit modal).

- [ ] **Step 6:** Add delete mutation with `Modal.confirm`.

- [ ] **Step 7:** Add `useWebSocket('orders_updated', ...)` to invalidate `['orders']`.

- [ ] **Step 8:** Run `npm run lint` and manually test.

---

## Plan 4: Inventory Page — List + Manual Adjustments

**Files:**
- Modify: `src/pages/Inventory.tsx`

**Summary:** Replace mock data with real paginated list. Add button/modal for manual adjustments (SALE/RESTOCK/ADJUSTMENT).

**Verification:** `npm run lint` passes. Can list paginated transactions and create manual adjustments.

- [ ] **Step 1:** Rewrite query with pagination:
  ```typescript
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, limit],
    queryFn: () => inventoryApi.getAll({ page, limit }),
    placeholderData: (previousData) => previousData,
  });
  ```

- [ ] **Step 2:** Update columns:
  ```typescript
  const typeColors: Record<string, string> = { SALE: 'orange', RESTOCK: 'blue', ADJUSTMENT: 'purple' };
  const columns = [
    { title: 'Variant ID', dataIndex: 'variant_id', key: 'variant_id' },
    { title: 'Tipo', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={typeColors[t]}>{t}</Tag> },
    { title: 'Qtd', dataIndex: 'quantity_changed', key: 'quantity_changed', render: (v: number) => (
      <span style={{ color: v < 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>{v > 0 ? `+${v}` : v}</span>
    )},
    { title: 'Data', dataIndex: 'created_at', key: 'created_at', render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm') },
  ];
  ```

- [ ] **Step 3:** Add "Ajuste Manual" button and modal:
  - Fields: `variant_id` (Input, required), `type` (Select: SALE/RESTOCK/ADJUSTMENT), `quantity_changed` (InputNumber, required), `order_id` (Input, optional)
  - Validation: if type=SALE, quantity must be negative; if type=RESTOCK, quantity must be positive
  - On submit: `inventoryApi.create(payload)`, invalidate `['inventory']`

- [ ] **Step 4:** Run `npm run lint` and manually test.

---

## Plan 5: Users Page — Full CRUD

**Files:**
- Modify: `src/pages/Users.tsx`

**Summary:** Replace mock users with real API calls. Paginated list with search and role filter. Create/edit/delete modals.

**Verification:** `npm run lint` passes. Can list, search, create, edit, and delete users.

- [ ] **Step 1:** Rewrite query with pagination + filters:
  ```typescript
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, debouncedSearch, roleFilter],
    queryFn: () => usersApi.getAll({ page, limit, search: debouncedSearch || undefined, role: roleFilter }),
    placeholderData: (previousData) => previousData,
  });
  ```

- [ ] **Step 2:** Update columns:
  ```typescript
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Nome', key: 'name', render: (_: any, r: User) => `${r.first_name} ${r.last_name}` },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <Tag color={r === 'ADMIN' ? 'purple' : 'default'}>{r}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s}</Tag> },
    { title: 'Criado em', dataIndex: 'created_at', key: 'created_at', render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
  ];
  ```

- [ ] **Step 3:** Add create user button + modal — form with `email`, `password`, `first_name`, `last_name`. On submit: `usersApi.create(payload)`, invalidate `['users']`.

- [ ] **Step 4:** Add edit user button + modal — form with `first_name`, `last_name`, `status`. On submit: `usersApi.update(id, payload)`.

- [ ] **Step 5:** Add delete button with `Modal.confirm` → `usersApi.delete(id)`.

- [ ] **Step 6:** Run `npm run lint` and manually test.

---

## Plan 6: Role-Based UI Guards

**Files:**
- Modify: `src/lib/utils.ts`
- Modify: `src/pages/Products.tsx`
- Modify: `src/pages/Orders.tsx`
- Modify: `src/pages/Inventory.tsx`
- Modify: `src/pages/Users.tsx`

**Summary:** Hide POST/PUT/DELETE UI from EMPLOYEE role users.

**Verification:** `npm run lint` passes. Log in as EMPLOYEE — all create/edit/delete buttons hidden.

- [ ] **Step 1:** Add helper to `src/lib/utils.ts`:
  ```typescript
  export function isAdmin(role?: string): boolean {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }
  ```

- [ ] **Step 2:** In each page, get user role:
  ```typescript
  const { getUser } = useAuth();
  const user = getUser();
  ```

- [ ] **Step 3:** Guard admin actions:
  - Products: wrap "Add Product" button, delete column in `{isAdmin(user?.role) && ...}`
  - Orders: wrap create button, status edit, delete button
  - Inventory: wrap "Ajuste Manual" button
  - Users: wrap create/edit/delete buttons

- [ ] **Step 4:** Run `npm run lint` and verify.

---

## Self-Review

- [ ] Every API endpoint from the spec has a corresponding function in `api.ts`
- [ ] `User` uses `first_name`/`last_name` consistently (AppLayout, Users page)
- [ ] `Product` uses `is_active`, variants use `stock_quantity`
- [ ] `Order` uses `customer_name`, `total_amount`, `created_at`, includes `SHIPPED`
- [ ] `InventoryTransaction` uses `SALE`|`RESTOCK`|`ADJUSTMENT`, `quantity_changed`, `variant_id`
- [ ] Mock data and `delay()` helper completely removed from `api.ts`
- [ ] No TBD/TODO placeholders in the plan
- [ ] All mutations show error toasts; "Insufficient stock" 400 handled in Orders
