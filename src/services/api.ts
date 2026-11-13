import axios from 'axios';
import { toast } from 'sonner';
import type {
  LoginPayload, LoginResponse, Product, CreateProductPayload,
  GetProductsResponse, Order, GetOrdersResponse,
  InventoryTransaction, CreateInventoryPayload, GetInventoryResponse,
  User, CreateUserPayload, UpdateUserPayload, GetUsersResponse, ChangePasswordPayload, ResetPasswordPayload,
  OrdersResponse, MarketingResponse, StockResponse, UserStats,
  CostComponent, CostComponentPayload, CostAssociation, CostSimulateInput, CostSimulateResponse,
  ExternalSalePayload, ExternalSaleResult, ExternalSalePreview, CreateCustomerPayload,
  CostClosingRecord, CreditFeeTierCreate,
  Customer, CustomerDetail, CustomerOrder, GetCustomersResponse,
  ProductSubgroup, ProductSubgroupPayload, SubgroupAssociation,
  CreditFeeTier, CreditFeeTierUpdate,
  CostClosingInput, CostClosingResponse,
} from '@/types';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-CSRF-TOKEN';

const api = axios.create({
  baseURL,
});

const csrfRetriedRequests = new WeakSet<object>();

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toUpperCase();
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);
  const isLogin = config.url?.includes('/auth/login');
  const hasHeader = config.headers.get('X-CSRF-TOKEN');
  if (isSafeMethod || isLogin || hasHeader || csrfRetriedRequests.has(config)) return config;

  csrfRetriedRequests.add(config);
  const token = await ensureCsrfHeaderValue();
  if (token) config.headers.set('X-CSRF-TOKEN', token);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !error.config?.url?.includes('/login') && !error.config?.url?.includes('/auth/')) {
      resetCsrfTokenCache();
      window.location.href = '/login';
    }
    // Pages and menu already follow lib/permissions; a 403 here means the role changed on the server.
    // Tell the user instead of reloading the whole app; mutations show their own error toast.
    if (error?.response?.status === 403 && ['GET', 'HEAD', 'OPTIONS'].includes((error.config?.method ?? '').toUpperCase())) {
      toast.error('Você não tem permissão para acessar este conteúdo.', { id: 'forbidden' });
    }
    if (error?.response?.status === 429 && !error.config?.url?.includes('/auth/login')) {
      toast.error('Muitas tentativas. Tente novamente em instantes.');
    }
    return Promise.reject(error);
  }
);

let csrfTokenCache: string | null = null;

export function extractCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const row = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return row ? row.slice(name.length + 1) : null;
}

export function resetCsrfTokenCache(): void {
  csrfTokenCache = null;
}

async function ensureCsrfHeaderValue(): Promise<string | undefined> {
  const cached = csrfTokenCache ?? extractCookieValue('XSRF-TOKEN');
  if (cached) {
    csrfTokenCache = cached;
    return cached;
  }
  try {
    const response = await api.get<{ csrfToken?: string }>('/auth/csrf');
    const token = response.data?.csrfToken ?? extractCookieValue('XSRF-TOKEN');
    if (token) csrfTokenCache = token;
    return token || undefined;
  } catch {
    return undefined;
  }
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', payload);
    csrfTokenCache = null;
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  logout: async (): Promise<void> => {
    const csrfToken = await ensureCsrfHeaderValue();
    await api.post('/auth/logout', {}, csrfToken ? { headers: { 'X-CSRF-TOKEN': csrfToken } } : undefined);
    csrfTokenCache = null;
  },
  getCsrfToken: async (): Promise<{ csrfToken: string }> => {
    const response = await api.get<{ csrfToken: string }>('/auth/csrf');
    const token = response.data?.csrfToken ?? extractCookieValue('XSRF-TOKEN');
    if (token) csrfTokenCache = token;
    return response.data;
  },
  /** Changes the signed-in user's password. The API renews the session cookie, so the CSRF token changes too. */
  changeMyPassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await api.put('/auth/me/password', payload);
    csrfTokenCache = null;
    await authApi.getCsrfToken().catch(() => undefined);
  },
};

export interface DashboardQueryParams {
  days?: number;
  start_date?: string;
  end_date?: string;
}

export const dashboardApi = {
  getOrders: async (params?: DashboardQueryParams): Promise<OrdersResponse> => {
    const response = await api.get<OrdersResponse>('/dashboard/orders', { params });
    return response.data;
  },
  getMarketing: async (params?: DashboardQueryParams): Promise<MarketingResponse> => {
    const response = await api.get<MarketingResponse>('/dashboard/marketing', { params });
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
  getAll: async (params?: { page?: number; limit?: number; fulfillment_status?: string; search?: string }): Promise<GetOrdersResponse> => {
    const response = await api.get<GetOrdersResponse>('/orders', { params });
    return response.data;
  },

  update: async (id: string, order: { status: string }): Promise<Order> => {
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
  getAll: async (params?: { page?: number; limit?: number; type?: string; search?: string }): Promise<GetInventoryResponse> => {
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

  /** Admin reset: no current password; signs the user out of every device. */
  resetPassword: async (id: string, payload: ResetPasswordPayload): Promise<void> => {
    await api.post(`/users/${id}/reset-password`, payload);
  },
};

export const costComponentsApi = {
  list: async (params?: { is_active?: boolean; search?: string }): Promise<CostComponent[]> => {
    const response = await api.get<CostComponent[]>('/cost-components', { params });
    return response.data;
  },

  create: async (payload: CostComponentPayload): Promise<CostComponent> => {
    const response = await api.post<CostComponent>('/cost-components', payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<CostComponentPayload>): Promise<CostComponent> => {
    const response = await api.put<CostComponent>(`/cost-components/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/cost-components/${id}`);
  },

  getByProduct: async (productId: string): Promise<{ associations: CostAssociation[] }> => {
    const response = await api.get<{ associations: CostAssociation[] }>(`/cost-components/product/${productId}`);
    return response.data;
  },

  associate: async (payload: { product_id: string; cost_component_id: string; quantity: number }): Promise<CostAssociation> => {
    const response = await api.post<CostAssociation>('/cost-components/associate', payload);
    return response.data;
  },

  associateSubgroup: async (payload: { subgroup_id: string; cost_component_id: string; quantity: number }): Promise<SubgroupAssociation> => {
    const response = await api.post<SubgroupAssociation>('/cost-components/associate-subgroup', payload);
    return response.data;
  },

  associateSubgroupBatch: async (payload: { subgroup_id: string; cost_component_ids: string[]; quantity: number }): Promise<{ subgroup_id: string; associations: SubgroupAssociation[] }> => {
    const response = await api.post<{ subgroup_id: string; associations: SubgroupAssociation[] }>('/cost-components/associate-subgroup-batch', payload);
    return response.data;
  },

  removeSubgroupAssociations: async (payload: { subgroup_id: string; cost_component_ids: string[] }): Promise<void> => {
    await api.delete('/cost-components/associate-subgroup-batch', { data: payload });
  },

  getBySubgroup: async (subgroupId: string): Promise<{ associations: SubgroupAssociation[] }> => {
    const response = await api.get<{ associations: SubgroupAssociation[] }>(`/cost-components/subgroup/${subgroupId}`);
    return response.data;
  },

  associateBatch: async (payload: { cost_component_id: string; product_ids?: string[]; subgroup_ids?: string[]; quantity: number }): Promise<{ product: { product_id: string }[]; subgroup: { subgroup_id: string }[] }> => {
    const response = await api.post<{ product: { product_id: string }[]; subgroup: { subgroup_id: string }[] }>('/cost-components/associate-batch', payload);
    return response.data;
  },

  associateProductBatch: async (payload: { product_id: string; cost_component_ids: string[]; quantity: number }): Promise<{ product_id: string; associations: CostAssociation[] }> => {
    const response = await api.post<{ product_id: string; associations: CostAssociation[] }>('/cost-components/associate-product-batch', payload);
    return response.data;
  },

  removeAssociation: async (associationId: string): Promise<void> => {
    await api.delete(`/cost-components/associate/${associationId}`);
  },

  simulate: async (payload: CostSimulateInput): Promise<CostSimulateResponse> => {
    const response = await api.post<CostSimulateResponse>('/cost-components/simulate', payload);
    return response.data;
  },
};

export const productSubgroupsApi = {
  list: async (params?: { is_active?: boolean; search?: string }): Promise<ProductSubgroup[]> => {
    const response = await api.get<ProductSubgroup[]>('/product-subgroups', { params });
    return response.data;
  },
  create: async (payload: ProductSubgroupPayload): Promise<ProductSubgroup> => {
    const response = await api.post<ProductSubgroup>('/product-subgroups', payload);
    return response.data;
  },
  update: async (id: string, payload: Partial<ProductSubgroupPayload>): Promise<ProductSubgroup> => {
    const response = await api.put<ProductSubgroup>(`/product-subgroups/${id}`, payload);
    return response.data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/product-subgroups/${id}`);
  },
  assignProducts: async (id: string, product_ids: string[]): Promise<{ assigned: number }> => {
    const response = await api.post<{ assigned: number }>(`/product-subgroups/${id}/products`, { product_ids });
    return response.data;
  },
  listProducts: async (id: string, params?: { page?: number; limit?: number; search?: string }): Promise<GetProductsResponse> => {
    const response = await api.get<GetProductsResponse>(`/product-subgroups/${id}/products`, { params });
    return response.data;
  },
  unassignProduct: async (id: string, productId: string): Promise<void> => {
    await api.delete(`/product-subgroups/${id}/products/${productId}`);
  },
};

export const creditFeeTiersApi = {
  list: async (): Promise<CreditFeeTier[]> => {
    const response = await api.get<CreditFeeTier[]>('/credit-fee-tiers');
    return response.data;
  },
  update: async (id: string, payload: CreditFeeTierUpdate): Promise<CreditFeeTier> => {
    const response = await api.put<CreditFeeTier>(`/credit-fee-tiers/${id}`, payload);
    return response.data;
  },
  create: async (payload: CreditFeeTierCreate): Promise<CreditFeeTier> => {
    const response = await api.post<CreditFeeTier>('/credit-fee-tiers', payload);
    return response.data;
  },
};

export const costClosingApi = {
  close: async (payload: CostClosingInput): Promise<CostClosingResponse> => {
    const response = await api.post<CostClosingResponse>('/cost-closing', payload);
    return response.data;
  },
  list: async (): Promise<CostClosingRecord[]> => {
    const response = await api.get<CostClosingRecord[]>('/cost-closing');
    return response.data;
  },
};

export const externalSalesApi = {
  create: async (payload: ExternalSalePayload): Promise<ExternalSaleResult> => {
    const response = await api.post<ExternalSaleResult>('/external-sales', payload);
    return response.data;
  },

  /** Totals, cost and margin of a sale being filled in; nothing is saved. */
  preview: async (payload: Omit<ExternalSalePayload, 'customer_name'> & { customer_name?: string }): Promise<ExternalSalePreview> => {
    const response = await api.post<ExternalSalePreview>('/external-sales/preview', payload);
    return response.data;
  },

  searchCustomers: async (params?: { page?: number; limit?: number; search?: string }): Promise<GetCustomersResponse> => {
    const response = await api.get<GetCustomersResponse>('/external-sales/customers', { params });
    return response.data;
  },
};

export const customersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<GetCustomersResponse> => {
    const response = await api.get<GetCustomersResponse>('/customers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<CustomerDetail> => {
    const response = await api.get<CustomerDetail>(`/customers/${id}`);
    return response.data;
  },

  getOrders: async (id: string): Promise<CustomerOrder[]> => {
    const response = await api.get<CustomerOrder[]>(`/customers/${id}/orders`);
    return response.data;
  },

  create: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', payload);
    return response.data;
  },
};

export default api;

export const GENERIC_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';
const INTERNAL_ERROR_MESSAGE = 'Erro interno do servidor';

const SESSION_EXPIRED_MESSAGE = 'Sessão expirada. Faça login novamente.';

// The API answers in English; every message a user can hit is translated here.
const errorTranslations: Record<string, string> = {
  'Invalid email or password': 'E-mail ou senha inválidos',
  'Validation failed': 'Dados inválidos. Verifique os campos e tente novamente.',
  'You cannot delete your own account': 'Você não pode excluir a sua própria conta',
  'You cannot deactivate your own account': 'Você não pode desativar a sua própria conta',
  'Cannot remove the last active SUPER_ADMIN': 'É preciso manter pelo menos um superadministrador ativo',
  'User not found': 'Usuário não encontrado',
  'Product not found': 'Produto não encontrado',
  'Email already registered': 'E-mail já cadastrado',
  'Order not found': 'Pedido não encontrado',
  'Order is already canceled': 'Este pedido já está cancelado',
  'Nuvemshop orders must be changed on Nuvemshop': 'Pedidos da Nuvemshop devem ser alterados na própria Nuvemshop',
  'A credit fee tier for this number of installments already exists': 'Já existe uma faixa para esse número de parcelas. Edite a faixa existente.',
  'This period overlaps a closing already made for other dates': 'Este período se sobrepõe a um fechamento já feito com outras datas. Feche exatamente o mesmo período ou escolha datas que não se cruzem.',
  'Customer not found': 'Cliente não encontrado',
  'Subgroup not found': 'Subgrupo não encontrado',
  'Product not in subgroup': 'O produto não pertence a este subgrupo',
  'Cost component not found': 'Componente de custo não encontrado',
  'Association not found': 'Associação não encontrada',
  'No associations found': 'Nenhuma associação encontrada',
  'Credit fee tier not found': 'Faixa de parcelamento não encontrada',
  'Product variant not found': 'Variação de produto não encontrada',
  'Variant ID is required': 'Informe a variação do produto',
  'One or more variants were not found': 'Uma ou mais variações não foram encontradas',
  'Insufficient stock for this transaction': 'Estoque insuficiente para esta movimentação',
  'SALE transactions must have a negative quantity_changed': 'Vendas devem ter quantidade negativa',
  'RESTOCK transactions must have a positive quantity_changed': 'Reabastecimentos devem ter quantidade positiva',
  'end_date cannot be before start_date': 'A data final não pode ser anterior à inicial',
  'Provide month or start_date+end_date': 'Informe o mês ou o período (data inicial e final)',
  'Only SUPER_ADMIN can set user roles': 'Apenas superadministradores podem definir a função do usuário',
  'Only SUPER_ADMIN can change user roles': 'Apenas superadministradores podem alterar a função do usuário',
  'Forbidden: You do not have permission to perform this action.': 'Você não tem permissão para realizar esta ação',
  'Token ausente ou inválido!': SESSION_EXPIRED_MESSAGE,
  'Failed to integrate with Nuvemshop': 'Falha na comunicação com a Nuvemshop',
  'Failed to integrate orders with Nuvemshop': 'Falha na comunicação com a Nuvemshop',
  'Failed to integrate products with Nuvemshop': 'Falha na comunicação com a Nuvemshop',
  'Synchronization already in progress': 'Já existe uma sincronização em andamento. Aguarde ela terminar.',
  'Failed to create or update order.': 'Não foi possível salvar o pedido',
  'Failed to create or update product.': 'Não foi possível salvar o produto',
  'A product with this slug already exists': 'Já existe um produto com este slug',
  'A product with this new slug already exists': 'Já existe um produto com este slug',
  'Failed to change password': 'Falha ao alterar a senha',
  'Unauthorized': 'Não autorizado',
  'Session cookie not found. Use cookie-based auth.': SESSION_EXPIRED_MESSAGE,
  'Too Many Requests': 'Muitas tentativas. Tente novamente em instantes.',
  'Internal server error': INTERNAL_ERROR_MESSAGE,
  'Missing CSRF token': SESSION_EXPIRED_MESSAGE,
  'Invalid CSRF token': SESSION_EXPIRED_MESSAGE,
  'Password must be at least 8 characters': 'A senha deve ter pelo menos 8 caracteres',
  'Current password is incorrect': 'Senha atual incorreta',
  'New password must be at least 8 characters': 'A nova senha deve ter pelo menos 8 caracteres',
  'Forbidden: cannot modify a SUPER_ADMIN account': 'Não é permitido alterar uma conta de superadministrador',
  'Forbidden: cannot delete a SUPER_ADMIN account': 'Não é permitido excluir uma conta de superadministrador',
};

// Messages that embed ids or quantities.
const errorPatterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Insufficient stock for variant .+\. Available: (-?\d+), requested: (\d+)$/, (m) => `Estoque insuficiente: disponível ${m[1]}, solicitado ${m[2]}`],
  [/^Product variant .+ not found$/, () => 'Variação de produto não encontrada'],
  [/^Product .+ not found$/, () => 'Produto não encontrado'],
  [/^Subgroup .+ not found$/, () => 'Subgrupo não encontrado'],
  [/^Cost component .+ not found$/, () => 'Componente de custo não encontrado'],
];

function translateError(raw: string): string | undefined {
  const exact = errorTranslations[raw];
  if (exact) return exact;
  for (const [pattern, build] of errorPatterns) {
    const match = raw.match(pattern);
    if (match) return build(match);
  }
  return undefined;
}

interface ErrorShape {
  response?: { data?: { error?: unknown }; status?: number };
  message?: unknown;
}

function readErrorMessage(err: unknown): string | undefined {
  if (typeof err === 'string') return err || undefined;
  if (!err || typeof err !== 'object') return undefined;
  const candidate = err as ErrorShape;
  const fromResponse = candidate.response?.data?.error;
  if (typeof fromResponse === 'string' && fromResponse) return fromResponse;
  if (typeof candidate.message === 'string' && candidate.message) return candidate.message;
  return undefined;
}

export function getFriendlyError(err: unknown): string {
  const raw = readErrorMessage(err);
  const status = (err as ErrorShape)?.response?.status;
  const translated = raw ? translateError(raw) : undefined;
  if (translated) return translated;
  // Unknown 5xx text is never shown: it may carry internal details.
  if (typeof status === 'number' && status >= 500) return INTERNAL_ERROR_MESSAGE;
  if (!raw) return 'Erro desconhecido';
  return GENERIC_ERROR_MESSAGE;
}
