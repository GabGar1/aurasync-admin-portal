import { describe, it, expect } from 'vitest';
import { getFriendlyError } from './api';

describe('getFriendlyError', () => {
  it('traduz erros conhecidos vindo de response.data.error', () => {
    expect(getFriendlyError({ response: { data: { error: 'Invalid email or password' } } })).toBe('E-mail ou senha inválidos');
    expect(getFriendlyError({ response: { data: { error: 'User not found' } } })).toBe('Usuário não encontrado');
    expect(getFriendlyError({ response: { data: { error: 'Product not found' } } })).toBe('Produto não encontrado');
    expect(getFriendlyError({ response: { data: { error: 'Email already registered' } } })).toBe('E-mail já cadastrado');
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
    expect(getFriendlyError({ response: { data: { error: 'Forbidden: cannot modify a SUPER_ADMIN account' } } })).toBe('Não é permitido alterar uma conta de superadministrador');
    expect(getFriendlyError({ response: { data: { error: 'Forbidden: cannot delete a SUPER_ADMIN account' } } })).toBe('Não é permitido excluir uma conta de superadministrador');
  });

  it('traduz os demais erros de negócio da API', () => {
    const t = (error: string) => getFriendlyError({ response: { status: 400, data: { error } } });
    expect(t('Order not found')).toBe('Pedido não encontrado');
    expect(t('Order is already canceled')).toBe('Este pedido já está cancelado');
    expect(t('Customer not found')).toBe('Cliente não encontrado');
    expect(t('Subgroup not found')).toBe('Subgrupo não encontrado');
    expect(t('Cost component not found')).toBe('Componente de custo não encontrado');
    expect(t('Credit fee tier not found')).toBe('Faixa de parcelamento não encontrada');
    expect(t('Product not in subgroup')).toBe('O produto não pertence a este subgrupo');
    expect(t('One or more variants were not found')).toBe('Uma ou mais variações não foram encontradas');
    expect(t('Insufficient stock for this transaction')).toBe('Estoque insuficiente para esta movimentação');
    expect(t('SALE transactions must have a negative quantity_changed')).toBe('Vendas devem ter quantidade negativa');
    expect(t('RESTOCK transactions must have a positive quantity_changed')).toBe('Reabastecimentos devem ter quantidade positiva');
    expect(t('end_date cannot be before start_date')).toBe('A data final não pode ser anterior à inicial');
    expect(t('Only SUPER_ADMIN can set user roles')).toBe('Apenas superadministradores podem definir a função do usuário');
    expect(t('Forbidden: You do not have permission to perform this action.')).toBe('Você não tem permissão para realizar esta ação');
    expect(t('Failed to integrate with Nuvemshop')).toBe('Falha na comunicação com a Nuvemshop');
  });

  it('traduz erros com valores dinâmicos', () => {
    const t = (error: string) => getFriendlyError({ response: { status: 400, data: { error } } });
    expect(t('Insufficient stock for variant 3f2a. Available: 2, requested: 5'))
      .toBe('Estoque insuficiente: disponível 2, solicitado 5');
    expect(t('Product variant 3f2a not found')).toBe('Variação de produto não encontrada');
    expect(t('Product 3f2a not found')).toBe('Produto não encontrado');
    expect(t('Subgroup 3f2a not found')).toBe('Subgrupo não encontrado');
    expect(t('Cost component 3f2a not found')).toBe('Componente de custo não encontrado');
  });

  it('nunca exibe o texto de erros 500', () => {
    expect(getFriendlyError({ response: { status: 500, data: { error: 'garbage interno' } } })).toBe('Erro interno do servidor');
  });

  it('retorna mensagem genérica PT para erros sem tradução', () => {
    expect(getFriendlyError({ response: { data: { error: 'Unknown backend message' } } })).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });

  it('usa err.message quando não há response, aplicando as mesmas regras', () => {
    expect(getFriendlyError({ message: 'Invalid email or password' })).toBe('E-mail ou senha inválidos');
    expect(getFriendlyError({ message: 'Coisa estranha aconteceu' })).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });

  it('retorna Erro desconhecido quando não há mensagem', () => {
    expect(getFriendlyError({})).toBe('Erro desconhecido');
    expect(getFriendlyError(undefined)).toBe('Erro desconhecido');
    expect(getFriendlyError('')).toBe('Erro desconhecido');
  });
});