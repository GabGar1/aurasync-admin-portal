import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PasswordForm from './PasswordForm';

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('PasswordForm', () => {
  it('asks for the current password when changing your own password', () => {
    const onSubmit = vi.fn();
    render(<PasswordForm requireCurrent isPending={false} onSubmit={onSubmit} />);
    fill('Nova senha', 'NovaSenha123');
    fill('Confirmar nova senha', 'NovaSenha123');
    expect(screen.getByRole('button', { name: 'Alterar senha' })).toBeDisabled();

    fill('Senha atual', 'Atual123');
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));
    expect(onSubmit).toHaveBeenCalledWith({ current_password: 'Atual123', new_password: 'NovaSenha123' });
  });

  it('does not ask for the current password on an admin reset', () => {
    const onSubmit = vi.fn();
    render(<PasswordForm requireCurrent={false} isPending={false} onSubmit={onSubmit} submitLabel="Redefinir senha" />);
    expect(screen.queryByLabelText('Senha atual')).toBeNull();
    fill('Nova senha', 'NovaSenha123');
    fill('Confirmar nova senha', 'NovaSenha123');
    fireEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    expect(onSubmit).toHaveBeenCalledWith({ new_password: 'NovaSenha123' });
  });

  it('blocks short or mismatched passwords', () => {
    render(<PasswordForm requireCurrent={false} isPending={false} onSubmit={vi.fn()} />);
    fill('Nova senha', 'curta');
    fill('Confirmar nova senha', 'curta');
    expect(screen.getByRole('button', { name: 'Alterar senha' })).toBeDisabled();
    fill('Nova senha', 'NovaSenha123');
    fill('Confirmar nova senha', 'Outra12345');
    expect(screen.getByText('As senhas não coincidem')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Alterar senha' })).toBeDisabled();
  });
});
