import { describe, it, expect } from 'vitest';
import { getFriendlyError } from './api';

describe('getFriendlyError', () => {
  it('traduz erros conhecidos vindo de response.data.error', () => {
    expect(getFriendlyError({ response: { data: { error: 'Invalid email or password' } } })).toBe('Email ou senha inválidos');
    expect(getFriendlyError({ response: { data: { error: 'User not found' } } })).toBe('Usuário não encontrado');
    expect(getFriendlyError({ response: { data: { error: 'Product not found' } } })).toBe('Produto não encontrado');
    expect(getFriendlyError({ response: { data: { error: 'Email already registered' } } })).toBe('Email já cadastrado');
    expect(getFriendlyError({ response: { data: { error: 'A product with this slug already exists' } } })).toBe('Já existe um produto com este slug');
    expect(getFriendlyError({ response: { data: { error: 'A product with this new slug already exists' } } })).toBe('Já existe um produto com este slug');
    expect(getFriendlyError({ response: { data: { error: 'Failed to change password' } } })).toBe('Falha ao alterar a senha');
    expect(getFriendlyError({ response: { data: { error: 'Unauthorized' } } })).toBe('Não autorizado');
    expect(getFriendlyError({ response: { data: { error: 'Session cookie not found. Use cookie-based auth.' } } })).toBe('Sessão expirada. Faça login novamente.');
  });

  it('usa err.message quando não há response', () => {
    expect(getFriendlyError({ message: 'Invalid email or password' })).toBe('Email ou senha inválidos');
    expect(getFriendlyError({ message: 'Coisa estranha aconteceu' })).toBe('Coisa estranha aconteceu');
  });

  it('retorna Erro desconhecido quando não há mensagem', () => {
    expect(getFriendlyError({})).toBe('Erro desconhecido');
    expect(getFriendlyError(undefined)).toBe('Erro desconhecido');
    expect(getFriendlyError('')).toBe('Erro desconhecido');
  });
});