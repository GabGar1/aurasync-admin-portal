import axios from 'axios';
import type {
  LoginPayload, LoginResponse, Product, CreateProductPayload,
  GetProductsResponse, Order, CreateOrderPayload, GetOrdersResponse,
  InventoryTransaction, CreateInventoryPayload, GetInventoryResponse,
  User, CreateUserPayload, UpdateUserPayload, GetUsersResponse,
  OrdersResponse, MarketingResponse, StockResponse, UserStats,
} from '@/types';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-CSRF-TOKEN';

const api = axios.create({
  baseURL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !error.config?.url?.includes('/login') && !error.config?.url?.includes('/auth/')) {
      window.location.href = '/login';
    }
    if (error?.response?.status === 403) {
      window.location.href = '/products';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  getCsrfToken: async (): Promise<{ csrfToken: string }> => {
    const response = await api.get<{ csrfToken: string }>('/auth/csrf');
    return response.data;
  },
};

export const dashboardApi = {
  getOrders: async (days?: number): Promise<OrdersResponse> => {
    const response = await api.get<OrdersResponse>('/dashboard/orders', { params: { days } });
    return response.data;
  },
  getMarketing: async (days?: number): Promise<MarketingResponse> => {
    const response = await api.get<MarketingResponse>('/dashboard/marketing', { params: { days } });
    return response.data;
  },
  getStock: async (days?: number): Promise<StockResponse> => {
    const response = await api.get<StockResponse>('/dashboard/stock', { params: { days } });
    return response.data;
  },
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/users/stats');
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

  syncNuvemshop: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/orders/sync/nuvemshop');
    return response.data;
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
