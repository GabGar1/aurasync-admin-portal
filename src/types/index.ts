export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  createdAt: string;
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
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  active: boolean;
  variants: ProductVariant[];
}

export interface OrderItem {
  id: string;
  productName: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  totalAmount: number;
  date: string;
  status: 'PENDING' | 'PAID' | 'CANCELED';
  items: OrderItem[];
}

export interface InventoryTransaction {
  id: string;
  variantId: string;
  variantSku: string;
  type: 'IN' | 'OUT' | 'SALE' | 'RESTOCK';
  quantityChanged: number;
  date: string;
}

export interface DashboardStats {
  totalSales: number;
  activeProducts: number;
  pendingOrders: number;
  lowStockAlerts: number;
}
