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

  it('traduz os novos erros de segurança do backend', () => {
    expect(getFriendlyError({ response: { data: { error: 'Too Many Requests' } } })).toBe('Muitas tentativas. Tente novamente em instantes.');
    expect(getFriendlyError({ response: { data: { error: 'Internal server error' } } })).toBe('Erro interno do servidor');
    expect(getFriendlyError({ response: { data: { error: 'Missing CSRF token' } } })).toBe('Sessão expirada. Faça login novamente.');
    expect(getFriendlyError({ response: { data: { error: 'Invalid CSRF token' } } })).toBe('Sessão expirada. Faça login novamente.');
    expect(getFriendlyError({ response: { data: { error: 'Password must be at least 8 characters' } } })).toBe('A senha deve ter pelo menos 8 caracteres');
    expect(getFriendlyError({ response: { data: { error: 'Current password is incorrect' } } })).toBe('Senha atual incorreta');
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

  it('retorna Erro desconhecido quando não há mensagem', () => {
    expect(getFriendlyError({})).toBe('Erro desconhecido');
    expect(getFriendlyError(undefined)).toBe('Erro desconhecido');
    expect(getFriendlyError('')).toBe('Erro desconhecido');
  });
});