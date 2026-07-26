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

export interface RevenueTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface HourStats {
  hour: number;
  orders: number;
  revenue: number;
}

export interface TopProductItem {
  product_id: string;
  product_name: string;
  variant_name: string | null;
  total_sold: number;
  revenue: number;
}

export interface OrderStatusStats {
  status: string;
  count: number;
}

export interface RepeatCustomers {
  unique_customers: number;
  repeat_customers: number;
  repeat_rate: number;
}

export interface OrdersResponse {
  by_hour: HourStats[];
  top_products: TopProductItem[];
  average_order_value: number;
  revenue_trend: RevenueTrendItem[];
  by_status: OrderStatusStats[];
  repeat_customers: RepeatCustomers;
}

export interface StorefrontStats {
  storefront: string | null;
  orders: number;
  revenue: number;
}

export interface ProvinceStats {
  province: string | null;
  orders: number;
  revenue: number;
}

export interface CampaignStats {
  campaign: string | null;
  orders: number;
  revenue: number;
  aov: number;
}

export interface SourceStats {
  source: string | null;
  medium: string | null;
  orders: number;
  revenue: number;
}

export interface PaymentMethodStats {
  method: string | null;
  orders: number;
  revenue: number;
}

export interface MarketingResponse {
  by_storefront: StorefrontStats[];
  by_province: ProvinceStats[];
  by_campaign: CampaignStats[];
  by_source: SourceStats[];
  by_payment_method: PaymentMethodStats[];
}

export interface LowStockItem {
  product_id: string;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  stock: number;
}

export interface NoSalesItem {
  product_id: string;
  product_name: string;
  variant_name: string | null;
  stock: number;
}

export interface TurnoverItem {
  product_id: string;
  product_name: string;
  variant_name: string | null;
  sales_qty_30d: number;
  avg_stock: number;
  turnover: number;
}

export interface StockValueByCategory {
  category: string | null;
  total_value: number;
  variant_count: number;
}

export interface DeadStockItem {
  product_id: string;
  product_name: string;
  variant_name: string | null;
  stock: number;
  days_without_sale: number;
}

export interface StockResponse {
  low_stock: LowStockItem[];
  no_sales_30d: NoSalesItem[];
  turnover_rate: TurnoverItem[];
  stock_value_by_category: StockValueByCategory[];
  dead_stock: DeadStockItem[];
}

export interface UserStats {
  total: number;
  byRole: Record<string, number>;
  recent: number;
}
