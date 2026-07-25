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
