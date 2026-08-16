# Adaptação ao Hardening de Segurança do Backend — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar task por task. Steps usam checkboxes (`- [ ]`) para tracking.

**Goal:** Adaptar o AuraSync Admin Portal às novas regras de segurança do backend (auth em leitura de produtos, CSRF explícito no logout, WS autenticado, rate limit 429, senha mínima 8, proteção SUPER_ADMIN, traduções PT-BR e fallback genérico de erros).

**Architecture:** Segue o AGENTS.md (Page → Components → Hooks → Service → Backend). A camada `services/api.ts` continua sendo a única a falar HTTP (cookie `aurasync_token`, `withCredentials`, sem `Authorization: Bearer`). Mudanças concentradas em: `api.ts` (interceptor + CSRF + traduções), `useWebSocket.ts` (sessão no handshake), `useAuth.ts` (verificação), `Login.tsx` (429), `Users.tsx` (senha mínima, gating SUPER_ADMIN, troca de senha), `App.tsx`/`SidebarItems.tsx` (dashboard adminOnly).

**Tech Stack:** React 18, TypeScript, Vite, React Router 6, TanStack Query 5, Axios, React Hook Form + Zod, shadcn/ui, TailwindCSS, Vitest.

## Verificado no backend (`aurasync-backend`, branch develop)

- `PUT /users/:id/password` exige `{ current_password, new_password }`, `new_password` min 8, retorno `{ message: "Password changed successfully" }` ou `400 {error:"Failed to change password"}` — confirma o formulário "atual + nova".
- `POST /auth/logout` aplica `csrfProtection()` por `preHandler`; CSRF valida `x-csrf-token` = `HMAC-SHA256(aurasync_token)`. `GET /auth/csrf` (autenticado) seta cookie `XSRF-TOKEN` não-httpOnly e retorna `{ csrfToken }` no body.
- `GET /auth/me` e `GET /auth/csrf` já são chamados no init pelo `refreshAuth` (`useAuth.ts:56-66`) — o fluxo já pré-carrega o token CSRF.
- WS `verifyClient` responde 401 "Unauthorized" sem cookie JWT válido (`server.ts:140-153`).
- Produtos: `GET` requer apenas `authenticate` (qualquer role). Dashboard exige ADMIN/SUPER_ADMIN (`requireRole` em todas as rotas).
- 500 genérico: `{ error: 'Internal server error' }`; rate limit login 5/min, global 100/15min.

## Global Constraints

- Nunca usar `Authorization: Bearer` com o `token` de login — só cookie (`withCredentials`).
- Manter o nome de header `X-CSRF-TOKEN` (case-insensitive no backend).
- Não confiar em `error.message` para 500s.
- `getFriendlyError` nunca renderiza texto cru/inglês sem tradução → fallback genérico PT.
- Toda mutação de usuário continua admin-only e gated por role.
- Verificação em cada task: `npx tsc --noEmit`, `npm run lint`, `npm run test`.

**Decisões (confirmadas pelo usuário):**
- **429 no login:** toast no interceptor para todos exceto `/auth/login` (que mostra countdown inline + botão desabilitado) — evita dupla mensagem.
- **Dashboard:** rota `/` `adminOnly` **e** item do sidebar "Dashboard" `adminOnly` (EMPLOYEE não vê nem acessa).
- **`getFriendlyError`:** desconhecido vira mensagem genérica PT (muda expectativa de 1 teste existente — intencional, conforme spec §8).
- **WS handshake negado:** não-logout cego — o hook revalida a sessão (`getMe`); só desloga em `401` real da API (evita deslogar em queda de rede/WS).

---

### Task 1: Interceptor 429 + traduções/falback em `getFriendlyError`

**Files:**
- Modify: `src/services/api.ts` (interceptor 27-38; seção erros 335-366)
- Test: `src/services/api.test.ts` (modify)

**Interfaces:**
- Consumes: nada
- Produces: `getFriendlyError` com fallback genérico; constantes `GENERIC_ERROR_MESSAGE`, `INTERNAL_ERROR_MESSAGE`; interceptor dispara `toast` em 429. Usado por todas as páginas.

- [ ] **Step 1: Escrever os testes que falham**

Modificar `src/services/api.test.ts`:

```ts
it('traduz os novos erros de segurança do backend', () => {
  expect(getFriendlyError({ response: { data: { error: 'Too Many Requests' } } })).toBe('Muitas tentativas. Tente novamente em instantes.');
  expect(getFriendlyError({ response: { data: { error: 'Internal server error' } } })).toBe('Erro interno do servidor');
  expect(getFriendlyError({ response: { data: { error: 'Missing CSRF token' } } })).toBe('Sessão expirada. Faça login novamente.');
  expect(getFriendlyError({ response: { data: { error: 'Invalid CSRF token' } } })).toBe('Sessão expirada. Faça login novamente.');
  expect(getFriendlyError({ response: { data: { error: 'Password must be at least 8 characters' } } })).toBe('A senha deve ter pelo menos 8 caracteres');
  expect(getFriendlyError({ response: { data: { error: 'Forbidden: cannot modify a SUPER_ADMIN account' } } })).toBe('Não é permitido modificar uma conta SUPER_ADMIN');
  expect(getFriendlyError({ response: { data: { error: 'Forbidden: cannot delete a SUPER_ADMIN account' } } })).toBe('Não é permitido excluir uma conta SUPER_ADMIN');
});

it('nunca exibe o texto de erros 500', () => {
  expect(getFriendlyError({ response: { status: 500, data: { error: 'garbage interno' } } })).toBe('Erro interno do servidor');
});

it('retorna mensagem genérica PT para erros sem tradução', () => {
  expect(getFriendlyError({ response: { data: { error: 'Unknown backend message' } } })).toBe('Ocorreu um erro inesperado. Tente novamente.');
});

it('usa err.message quando não há response, aplicando as mesmas regras', () => {
  expect(getFriendlyError({ message: 'Invalid email or password' })).toBe('Email ou senha inválidos');
  expect(getFriendlyError({ message: 'Coisa estranha aconteceu' })).toBe('Ocorreu um erro inesperado. Tente novamente.');
});
```

Substituir o bloco do teste existente `'usa err.message quando não há response'` (linhas 17-20 de `api.test.ts`) pelo bloco equivalente acima.

- [ ] **Step 2: Rodar para ver falhar**

Run: `npm run test -- --run src/services/api.test.ts`
Expected: FAIL (novas mensagens retornam texto cru).

- [ ] **Step 3: Atualizar `src/services/api.ts`**

Cabeçalho de imports (linha 1-2):

```ts
import axios from 'axios';
import { toast } from 'sonner';
```

Interceptor (substituir bloco 27-38):

```ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !error.config?.url?.includes('/login') && !error.config?.url?.includes('/auth/')) {
      window.location.href = '/login';
    }
    if (error?.response?.status === 403 && ['GET', 'HEAD', 'OPTIONS'].includes((error.config?.method ?? '').toUpperCase())) {
      window.location.href = '/products';
    }
    if (error?.response?.status === 429 && !error.config?.url?.includes('/auth/login')) {
      toast.error('Muitas tentativas. Tente novamente em instantes.');
    }
    return Promise.reject(error);
  }
);
```

Seção de erros (substituir linhas 335-366):

```ts
export const GENERIC_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';
const INTERNAL_ERROR_MESSAGE = 'Erro interno do servidor';

const errorTranslations: Record<string, string> = {
  'Invalid email or password': 'Email ou senha inválidos',
  'User not found': 'Usuário não encontrado',
  'Product not found': 'Produto não encontrado',
  'Email already registered': 'Email já cadastrado',
  'A product with this slug already exists': 'Já existe um produto com este slug',
  'A product with this new slug already exists': 'Já existe um produto com este slug',
  'Failed to change password': 'Falha ao alterar a senha',
  'Unauthorized': 'Não autorizado',
  'Session cookie not found. Use cookie-based auth.': 'Sessão expirada. Faça login novamente.',
  'Too Many Requests': 'Muitas tentativas. Tente novamente em instantes.',
  'Internal server error': INTERNAL_ERROR_MESSAGE,
  'Missing CSRF token': 'Sessão expirada. Faça login novamente.',
  'Invalid CSRF token': 'Sessão expirada. Faça login novamente.',
  'Password must be at least 8 characters': 'A senha deve ter pelo menos 8 caracteres',
  'New password must be at least 8 characters': 'A nova senha deve ter pelo menos 8 caracteres',
  'Forbidden: cannot modify a SUPER_ADMIN account': 'Não é permitido modificar uma conta SUPER_ADMIN',
  'Forbidden: cannot delete a SUPER_ADMIN account': 'Não é permitido excluir uma conta SUPER_ADMIN',
};

interface ErrorShape {
  response?: { data?: { error?: unknown }; status?: number };
  message?: unknown;
}

export function getFriendlyError(err: unknown): string {
  const raw = readErrorMessage(err);
  const status = (err as ErrorShape)?.response?.status;
  if (typeof status === 'number' && status >= 500) return INTERNAL_ERROR_MESSAGE;
  if (!raw) return 'Erro desconhecido';
  return errorTranslations[raw] ?? GENERIC_ERROR_MESSAGE;
}
```

(`readErrorMessage` permanece como está.)

- [ ] **Step 4: Rodar para passar**

Run: `npm run test -- --run src/services/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: sem erros novos (warnings de UI pré-existentes ignorados).

---

### Task 2: Login 429 — countdown e botão desabilitado

**Files:**
- Modify: `src/pages/Login.tsx`

**Interfaces:**
- Consumes: interceptor 429 da Task 1 (toast global, exceto `/auth/login`)
- Produces: estado `cooldownSeconds`; feedback inline PT no formulário.

- [ ] **Step 1: Implementar**

Em `src/pages/Login.tsx`:

1. Imports (linha 1): `import { useState, useEffect } from 'react';`
2. Adicionar dentro do componente (após `const form = useForm...`):

```tsx
const [cooldownSeconds, setCooldownSeconds] = useState(0);

useEffect(() => {
  if (cooldownSeconds <= 0) return;
  const timer = setInterval(() => setCooldownSeconds((s) => s - 1), 1000);
  return () => clearInterval(timer);
}, [cooldownSeconds]);
```

3. `onError` (substituir bloco 40-54):

```tsx
onError: (error) => {
  form.clearErrors('root');
  if (error instanceof AxiosError) {
    if (error.response?.status === 429) {
      setCooldownSeconds(60);
      form.setError('root', { message: 'Muitas tentativas. Tente novamente em instantes.' });
    } else if (error.response?.status === 401) {
      form.setError('root', { message: getFriendlyError(error) });
    } else if (!error.response) {
      form.setError('root', { message: 'Erro de conexão. Verifique sua internet.' });
    } else {
      form.setError('root', { message: 'Ocorreu um erro inesperado. Tente novamente.' });
    }
  } else {
    form.setError('root', { message: 'Ocorreu um erro inesperado. Tente novamente.' });
  }
},
```

4. Botão (linhas 117-119):

```tsx
<Button type="submit" className="w-full" size="lg" disabled={mutation.isPending || cooldownSeconds > 0}>
  {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Entrando...</> : cooldownSeconds > 0 ? `Aguarde ${cooldownSeconds}s` : 'Entrar'}
</Button>
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: sem erros novos.

---

### Task 3: Logout com CSRF robusto

**Files:**
- Modify: `src/services/api.ts` (`authApi` 40-56; nova seção de CSRF)
- Test: `src/services/csrf.test.ts` (novo)
- Verify: `src/hooks/useAuth.ts` (sem mudança — `login` e `refreshAuth` já chamam `getCsrfToken`)

**Interfaces:**
- Consumes: nada
- Produces: `extractCookieValue(name)`, cache em memória `csrfTokenCache`, `authApi.logout` enviando `X-CSRF-TOKEN` explicitamente. Usado pela Task 4 e pelo `useAuth.logout`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/services/csrf.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { extractCookieValue } from './api';

describe('extractCookieValue', () => {
  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=-1; path=/';
  });

  it('retorna o valor de um cookie existente', () => {
    document.cookie = 'XSRF-TOKEN=abc123; path=/';
    expect(extractCookieValue('XSRF-TOKEN')).toBe('abc123');
  });

  it('retorna null quando o cookie não existe', () => {
    document.cookie = 'outro=1; path=/';
    expect(extractCookieValue('XSRF-TOKEN')).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npm run test -- --run src/services/csrf.test.ts`
Expected: FAIL — `extractCookieValue is not a function`.

- [ ] **Step 3: Implementar em `src/services/api.ts`**

Substituir o objeto `authApi` (linhas 40-56) e adicionar a seção de CSRF antes dele:

```ts
let csrfTokenCache: string | null = null;

export function extractCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const row = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return row ? row.slice(name.length + 1) : null;
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
};
```

> `useAuth.ts` não muda: `login` e `refreshAuth` já chamam `getCsrfToken` (pré-carregando cookie + cache), e `logout` já cai no `catch` limpando localStorage e navegando mesmo se a API falhar (zombie session mitigado — o cookie expira em 2h).

- [ ] **Step 4: Rodar para passar**

Run: `npm run test -- --run src/services/csrf.test.ts`
Expected: PASS.

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: sem erros novos.

---

### Task 4: WebSocket autenticado + `VITE_WS_URL`

**Files:**
- Modify: `src/hooks/useWebSocket.ts`
- Modify: `.env`, `.env.example`
- Test: `src/hooks/useWebSocket.test.ts` (novo)

**Interfaces:**
- Consumes: `useAuth` (`isAuthenticated`, `logout`), `authApi.getMe`, `isAxiosError`
- Produces: `resolveWsUrl(configured, protocol, host)` (pura, testável); hook conecta só com sessão, revalida sessão em handshake negado e desloga só em 401 real.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/hooks/useWebSocket.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveWsUrl } from './useWebSocket';

describe('resolveWsUrl', () => {
  it('usa VITE_WS_URL quando presente', () => {
    expect(resolveWsUrl('wss://lamata.tec.br', 'http:', 'x')).toBe('wss://lamata.tec.br');
  });

  it('produz wss://host quando protocolo é https', () => {
    expect(resolveWsUrl(undefined, 'https:', 'lamata.tec.br')).toBe('wss://lamata.tec.br');
  });

  it('produz ws://localhost:3333 em dev http', () => {
    expect(resolveWsUrl(undefined, 'http:', 'localhost:8080')).toBe('ws://localhost:3333');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npm run test -- --run src/hooks/useWebSocket.test.ts`
Expected: FAIL — `Cannot find module './useWebSocket'` ou `resolveWsUrl is not defined`.

- [ ] **Step 3: Reimplementar `src/hooks/useWebSocket.ts`**

```ts
import { useEffect, useRef } from 'react';
import { isAxiosError } from 'axios';
import { logger } from '@/lib/logger';
import { authApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

type WebSocketEvent = {
  event: 'products_updated' | 'orders_updated';
  message: string;
};

const MAX_RETRIES = 10;
const BASE_DELAY = 1000;

export function resolveWsUrl(configured: string | undefined, protocol: string, host: string): string {
  if (configured) return configured;
  return protocol === 'https:' ? `wss://${host}` : 'ws://localhost:3333';
}

const WS_URL = resolveWsUrl(import.meta.env.VITE_WS_URL, window.location.protocol, window.location.host);

export const useWebSocket = (eventName: WebSocketEvent['event'], onMessageReceived: () => void) => {
  const { isAuthenticated, logout } = useAuth();
  const retryCountRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    disposedRef.current = false;

    function clearReconnectTimer() {
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (disposedRef.current) return;
      const delay = BASE_DELAY * Math.pow(2, retryCountRef.current);
      retryCountRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    }

    async function verifySessionAndReconnect() {
      if (disposedRef.current) return;
      try {
        await authApi.getMe();
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          retryCountRef.current = 0;
          disposedRef.current = true;
          clearReconnectTimer();
          logger.warn('WebSocket negado e sessão inválida (401). Finalizando sessão.');
          logout();
          return;
        }
        // API fora do ar: tenta reconectar com backoff (não desloga por queda de rede)
        if (disposedRef.current) return;
        if (retryCountRef.current < MAX_RETRIES) {
          scheduleReconnect();
        }
        return;
      }
      // Sessão válida: reconecta
      if (!disposedRef.current) {
        retryCountRef.current = 0;
        reconnectTimeoutRef.current = setTimeout(connect, BASE_DELAY);
      }
    }

    function connect() {
      if (disposedRef.current) return;

      let hasOpened = false;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        hasOpened = true;
        wsRef.current = ws;
        retryCountRef.current = 0;
        clearReconnectTimer();
      };

      ws.onmessage = (messageEvent) => {
        try {
          const data: WebSocketEvent = JSON.parse(messageEvent.data);
          if (data.event === eventName) {
            onMessageReceived();
          }
        } catch (error) {
          logger.error('Erro ao processar mensagem do WebSocket:', error);
        }
      };

      ws.onclose = () => {
        if (disposedRef.current) return;
        wsRef.current = null;

        if (!hasOpened) {
          // handshake recusado (401) ou conectividade: revalida a sessão antes de decidir
          clearReconnectTimer();
          verifySessionAndReconnect();
          return;
        }

        if (retryCountRef.current < MAX_RETRIES) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      disposedRef.current = true;
      clearReconnectTimer();
      wsRef.current?.close();
    };
  }, [eventName, onMessageReceived, isAuthenticated, logout]);
};
```

> A assinatura do hook não muda — `useDashboard`, `Orders.tsx` e `Products.tsx` seguem funcionando. Em prod, `wss://lamata.tec.br` vem do default (`https:` → `wss://{host}`) ou do `VITE_WS_URL`.

- [ ] **Step 4: Atualizar `.env` e `.env.example`**

`.env`:
```
VITE_API_URL=http://localhost:3333/api
VITE_WS_URL=ws://localhost:3333
```
`.env.example`: trocar `VITE_WS_URL=wss://localhost:3333` por `VITE_WS_URL=ws://localhost:3333`.

- [ ] **Step 5: Rodar para passar**

Run: `npm run test -- --run src/hooks/useWebSocket.test.ts`
Expected: PASS.

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: sem erros novos.

---

### Task 5: Usuários — senha mínima 8, gating SUPER_ADMIN e troca de senha

**Files:**
- Modify: `src/types/index.ts` (novo `ChangePasswordPayload`)
- Modify: `src/services/api.ts` (`usersApi.changePassword`)
- Modify: `src/pages/Users.tsx`

**Interfaces:**
- Consumes: `usersApi` (base), `getFriendlyError` (Task 1), `UpdateUserPayload`/`User`
- Produces: `ChangePasswordPayload { current_password; new_password }`; `usersApi.changePassword(id, payload)`; `canManageUser(user)` e formulário de troca de senha na página Usuários.

- [ ] **Step 1: Tipos**

Em `src/types/index.ts`, após `UpdateUserPayload`:

```ts
export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}
```

- [ ] **Step 2: Serviço**

Em `src/services/api.ts`, adicionar `ChangePasswordPayload` aos imports de tipo e, em `usersApi`, após `delete`:

```ts
changePassword: async (id: string, payload: ChangePasswordPayload): Promise<void> => {
  await api.put(`/users/${id}/password`, payload);
},
```

- [ ] **Step 3: `Users.tsx` — senha mínima no Create**

Em `CreateUserForm` (linhas 354-363): placeholder `"Mínimo 8 caracteres"`, `minLength={8}`, guard no submit e no `disabled`:

```tsx
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!email.trim() || !password || password.length < 8 || !firstName.trim() || !lastName.trim()) return;
  onSubmit({
    email: email.trim(),
    password,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
  });
}
```
e no botão: `disabled={isPending || !email.trim() || !password || password.length < 8 || !firstName.trim() || !lastName.trim()}`.

- [ ] **Step 4: `Users.tsx` — gating SUPER_ADMIN + troca de senha**

No componente principal:

1. Após `const admin = isAdmin(currentUser?.role);` (linha 47):
```tsx
const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
function canManageUser(user: User): boolean {
  return admin && (user.role !== 'SUPER_ADMIN' || isSuperAdmin);
}
```
2. Estados (após `deletingUser`, linha 57):
```tsx
const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
const [passwordUser, setPasswordUser] = useState<User | null>(null);
```
3. Mutation (após `deleteMutation`):
```tsx
const passwordMutation = useMutation({
  mutationFn: ({ id, payload }: { id: string; payload: ChangePasswordPayload }) => usersApi.changePassword(id, payload),
  onSuccess: () => {
    toast.success('Senha alterada com sucesso');
    setPasswordDialogOpen(false);
    setPasswordUser(null);
  },
  onError: (err) => toast.error(
    `Falha ao alterar a senha: ${getFriendlyError(err)}`
  ),
});
```
4. Handler (após `handleDeleteClick`):
```tsx
function handlePasswordClick(user: User) {
  setPasswordUser(user);
  setPasswordDialogOpen(true);
}
```
5. Na row, trocar a coluna de ações de `{admin && (` (linha 234) por `{canManageUser(user) && (`, e adicionar o item no dropdown (após "Editar", linha 245):
```tsx
<DropdownMenuItem onClick={() => handlePasswordClick(user)}>
  Alterar senha
</DropdownMenuItem>
```
6. Novo diálogo (após o `AlertDialog` de remoção, fim do return):
```tsx
<Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Alterar senha</DialogTitle>
      <DialogDescription>Defina a nova senha de {passwordUser?.first_name} {passwordUser?.last_name}</DialogDescription>
    </DialogHeader>
    {passwordUser && (
      <ChangePasswordForm
        isPending={passwordMutation.isPending}
        onSubmit={(payload) => passwordMutation.mutate({ id: passwordUser.id, payload })}
      />
    )}
  </DialogContent>
</Dialog>
```
7. Novo componente ao final do arquivo (após `EditUserForm`):
```tsx
function ChangePasswordForm({ isPending, onSubmit }: { isPending: boolean; onSubmit: (payload: ChangePasswordPayload) => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const valid = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit({ current_password: currentPassword, new_password: newPassword });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="password-current">Senha atual</Label>
        <Input
          id="password-current"
          type="password"
          placeholder="Senha atual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-new">Nova senha</Label>
        <Input
          id="password-new"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-confirm">Confirmar nova senha</Label>
        <Input
          id="password-confirm"
          type="password"
          placeholder="Confirme a nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
        {newPassword !== confirmPassword && confirmPassword.length > 0 ? (
          <p className="text-sm text-destructive">As senhas não coincidem</p>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending || !valid}>
          {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Alterar senha'}
        </Button>
      </DialogFooter>
    </form>
  );
}
```
8. Import: adicionar `ChangePasswordPayload` aos tipos importados.

> O backend (`user.router.ts:132-162`) bloqueia `PUT /users/:id` e `DELETE /users/:id` em alvo SUPER_ADMIN por não-SUPER_ADMIN. O endpoint de senha (`165-187`) não tem essa proteção extra (aceita login de ADMIN) — o gating visual usa `canManageUser` por consistência.

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: sem erros novos.

---

### Task 6: Dashboard adminOnly (rota + sidebar)

**Files:**
- Modify: `src/App.tsx` (rota `/`, linha 42)
- Modify: `src/components/SidebarItems.tsx` (item Dashboard, linha 21)

**Interfaces:**
- Consumes: `<ProtectedRoute adminOnly>` (já existe)
- Produces: EMPLOYEE não vê nem acessa `/`.

- [ ] **Step 1: Implementar**

`App.tsx`:
```tsx
<Route path="/" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
```
`SidebarItems.tsx`:
```tsx
{ title: "Dashboard", url: "/", icon: LayoutDashboard, adminOnly: true },
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: sem erros novos.

---

### Task 7: Verificação final

- [ ] **Rodar suíte completa no portal**

Run: `npx tsc --noEmit && npm run lint && npm run test && npm run build`
Expected: tudo verde.

- [ ] **Itens confirmados (sem mudança de código)**
- `GET /api/products*` já dependem do cookie `withCredentials` (sem `Authorization`); o interceptor 401 (`api.ts:30-32`) cobre sessão expirada durante o uso dos dialogs (`VariantPicker`, `ProductAssociationsDialog`, `SubgroupProductsDialog` — todos em telas adminOnly). Ação: somente leitura/confirmação.
- Paginação: máxima usada é `limit=50` (`DataTablePagination` [10,20,50]; `Inventory` 50) — dentro do cap de 100. Nunca enviar `limit>100`.
- `refreshAuth` (`useAuth.ts:56-66`) já chama `GET /api/auth/csrf` no init do `AuthInitializer` (`App.tsx:25-27`) — o cache CSRF (Task 3) é populado na carga da página.

- [ ] **Verificação manual (dev `:8080` → `:3333`)**
- Logout após reload direto (sem `/auth/csrf` no caminho) → limpa local e redireciona para `/login` (zombie session mitigado).
- 6ª tentativa errada em 1min → 429 com PT (countdown no login + botão desabilitado).
- ADMIN edita/exclui SUPER_ADMIN → ação oculta (ou 403 com toast PT).
- Senha de 6-7 chars no cadastro → bloqueada pelo form antes de submeter.
- WS: com sessão expirada → redirect `/login`, sem loop de reconexão; queda de rede → reconecta sem deslogar.
- Leitura de produtos sem sessão → redirect `/login` (401 do interceptor).
- Em prod: `wss://lamata.tec.br` conecta; `/docs` 404; headers de segurança presentes (`curl -I`).