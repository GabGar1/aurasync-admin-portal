import { describe, it, expect } from 'vitest';
import { resolveWsUrl } from './useWebSocket';

describe('resolveWsUrl', () => {
  it('usa VITE_WS_URL quando presente', () => {
    expect(resolveWsUrl('wss://lamata.tec.br', undefined, 'http:', 'x')).toBe('wss://lamata.tec.br');
  });

  it('deriva wss da VITE_API_URL quando VITE_WS_URL ausente (produção)', () => {
    expect(resolveWsUrl(undefined, 'https://aurasync-api.gabrielgarbrecht.dev.br/api', 'https:', 'aurasync.gabrielgarbrecht.dev.br')).toBe('wss://aurasync-api.gabrielgarbrecht.dev.br');
  });

  it('deriva ws da VITE_API_URL http', () => {
    expect(resolveWsUrl(undefined, 'http://localhost:3333/api', 'https:', 'x')).toBe('ws://localhost:3333');
  });

  it('ignora VITE_API_URL relativa (dev proxy) e usa o host', () => {
    expect(resolveWsUrl(undefined, '/api', 'https:', 'lamata.tec.br')).toBe('wss://lamata.tec.br');
  });

  it('produz ws://localhost:3333 em dev http', () => {
    expect(resolveWsUrl(undefined, undefined, 'http:', 'localhost:8080')).toBe('ws://localhost:3333');
  });
});
