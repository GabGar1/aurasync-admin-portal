import axios from 'axios';
import type {
  LoginPayload, LoginResponse, Product, Order,
  InventoryTransaction, DashboardStats, User
} from '@/types';
import {GetProductsResponse} from "@/types";

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

const api = axios.create({
  baseURL: 'http://localhost:3333/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aurasync_token');
  console.log("token: ", token)
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Mock Data ───────────────────────────────────────────────

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
    const response = await api.post<LoginResponse>('/login', payload);

    return response.data;
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    await delay();
    return { totalSales: 12847.50, activeProducts: 3, pendingOrders: 2, lowStockAlerts: 2 };
  },
};

export const productsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; category?: string }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  syncNuvemshop: async (): Promise<{ success: boolean; processed: number }> => {
    const response = await api.post('/products/sync/nuvemshop');
    return response.data;
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    const response = await api.post<Product>('/products', product);
    return response.data.products;
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
