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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !error.config?.url?.includes('/login')) {
      localStorage.removeItem('aurasync_token');
      localStorage.removeItem('aurasync_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
