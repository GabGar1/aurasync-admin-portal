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