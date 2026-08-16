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