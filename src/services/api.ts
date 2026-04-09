import axios from 'axios';
import type {
  LoginPayload, LoginResponse, Product, Order,
  InventoryTransaction, DashboardStats, User
} from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:3333/api', // swap to real backend URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aurasync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Mock Data ───────────────────────────────────────────────

const mockProducts: Product[] = [
  { id: '1', name: 'Aurora Wireless Headphones', slug: 'aurora-headphones', category: 'Audio', active: true, variants: [
    { id: 'v1', sku: 'AWH-BLK-01', name: 'Black', price: 129.99, stock: 42 },
    { id: 'v2', sku: 'AWH-WHT-01', name: 'White', price: 129.99, stock: 18 },
  ]},
  { id: '2', name: 'Nebula Smart Watch', slug: 'nebula-watch', category: 'Wearables', active: true, variants: [
    { id: 'v3', sku: 'NSW-SIL-01', name: 'Silver 40mm', price: 299.99, stock: 5 },
  ]},
  { id: '3', name: 'Prism USB-C Hub', slug: 'prism-hub', category: 'Accessories', active: false, variants: [
    { id: 'v4', sku: 'PUH-GRY-01', name: 'Space Gray', price: 59.99, stock: 120 },
  ]},
  { id: '4', name: 'Zenith Mechanical Keyboard', slug: 'zenith-keyboard', category: 'Peripherals', active: true, variants: [
    { id: 'v5', sku: 'ZMK-BLK-01', name: 'Linear Black', price: 179.99, stock: 31 },
    { id: 'v6', sku: 'ZMK-WHT-01', name: 'Tactile White', price: 179.99, stock: 0 },
  ]},
];

const mockOrders: Order[] = [
  { id: 'ORD-001', customerName: 'Alice Johnson', totalAmount: 259.98, date: '2025-04-07', status: 'PAID', items: [] },
  { id: 'ORD-002', customerName: 'Bob Smith', totalAmount: 299.99, date: '2025-04-08', status: 'PENDING', items: [] },
  { id: 'ORD-003', customerName: 'Carol Lee', totalAmount: 59.99, date: '2025-04-08', status: 'CANCELED', items: [] },
  { id: 'ORD-004', customerName: 'David Kim', totalAmount: 439.97, date: '2025-04-09', status: 'PENDING', items: [] },
  { id: 'ORD-005', customerName: 'Eva Martinez', totalAmount: 179.99, date: '2025-04-09', status: 'PAID', items: [] },
];

const mockInventory: InventoryTransaction[] = [
  { id: 'tx1', variantId: 'v1', variantSku: 'AWH-BLK-01', type: 'RESTOCK', quantityChanged: 50, date: '2025-04-01' },
  { id: 'tx2', variantId: 'v1', variantSku: 'AWH-BLK-01', type: 'SALE', quantityChanged: -8, date: '2025-04-05' },
  { id: 'tx3', variantId: 'v3', variantSku: 'NSW-SIL-01', type: 'SALE', quantityChanged: -3, date: '2025-04-06' },
  { id: 'tx4', variantId: 'v6', variantSku: 'ZMK-WHT-01', type: 'OUT', quantityChanged: -15, date: '2025-04-07' },
  { id: 'tx5', variantId: 'v4', variantSku: 'PUH-GRY-01', type: 'IN', quantityChanged: 100, date: '2025-04-08' },
  { id: 'tx6', variantId: 'v2', variantSku: 'AWH-WHT-01', type: 'SALE', quantityChanged: -2, date: '2025-04-09' },
];

const mockUsers: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@aurasync.io', role: 'ADMIN', createdAt: '2025-01-01' },
  { id: 'u2', name: 'Jane Employee', email: 'jane@aurasync.io', role: 'EMPLOYEE', createdAt: '2025-02-15' },
];

// ─── Mock API Functions ──────────────────────────────────────

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    await delay(600);
    // Accept any credentials for mock
    return {
      token: 'mock-jwt-token-aurasync-2025',
      user: mockUsers[0],
    };
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    await delay();
    return { totalSales: 12847.50, activeProducts: 3, pendingOrders: 2, lowStockAlerts: 2 };
  },
};

export const productsApi = {
  getAll: async (): Promise<Product[]> => { await delay(); return mockProducts; },
  create: async (product: Partial<Product>): Promise<Product> => {
    await delay();
    return { id: String(Date.now()), name: product.name || '', slug: '', category: product.category || '', active: true, variants: [] };
  },
};

export const ordersApi = {
  getAll: async (): Promise<Order[]> => { await delay(); return mockOrders; },
};

export const inventoryApi = {
  getAll: async (): Promise<InventoryTransaction[]> => { await delay(); return mockInventory; },
};

export const usersApi = {
  getAll: async (): Promise<User[]> => { await delay(); return mockUsers; },
};

export default api;
