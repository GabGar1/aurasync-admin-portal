import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import api, { extractCookieValue, resetCsrfTokenCache } from './api';

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

describe('interceptor CSRF', () => {
  const originalAdapter = api.defaults.adapter;
  let calls: Array<{ method: string; url: string; headers: Record<string, unknown> }>;

  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=-1; path=/';
    resetCsrfTokenCache();
    calls = [];
    api.defaults.adapter = async (config) => {
      calls.push({ method: (config.method ?? 'get').toUpperCase(), url: config.url ?? '', headers: config.headers.toJSON() });
      if (config.url === '/auth/csrf') {
        return { data: { csrfToken: 'token-fetched' }, status: 200, statusText: 'OK', headers: {}, config };
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    };
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  it('envia X-CSRF-TOKEN do cookie sem chamar /auth/csrf', async () => {
    document.cookie = 'XSRF-TOKEN=cookie-token; path=/';
    await api.post('/products', {});
    expect(calls.some((call) => call.url === '/auth/csrf')).toBe(false);
    const post = calls.find((call) => call.url === '/products');
    expect(post?.headers['X-CSRF-TOKEN']).toBe('cookie-token');
  });

  it('busca /auth/csrf e envia X-CSRF-TOKEN quando o cookie não existe', async () => {
    await api.post('/products', {});
    expect(calls.map((call) => call.url)).toEqual(['/auth/csrf', '/products']);
    const post = calls.find((call) => call.url === '/products');
    expect(post?.headers['X-CSRF-TOKEN']).toBe('token-fetched');
  });

  it('não injeta CSRF em /auth/login', async () => {
    await api.post('/auth/login', { email: 'admin@aurasync.com', password: 'x' });
    expect(calls.map((call) => call.url)).toEqual(['/auth/login']);
    expect(calls[0].headers['X-CSRF-TOKEN']).toBeUndefined();
  });

  it('não busca CSRF em requisições GET', async () => {
    await api.get('/products');
    expect(calls.map((call) => call.url)).toEqual(['/products']);
  });
});
