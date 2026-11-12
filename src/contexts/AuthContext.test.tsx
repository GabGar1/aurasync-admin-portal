import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';

const { getMeMock, logoutMock, csrfMock } = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  logoutMock: vi.fn(),
  csrfMock: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  authApi: { getMe: getMeMock, logout: logoutMock, getCsrfToken: csrfMock },
}));

const alice: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'alice@aurasync.test',
  first_name: 'Alice',
  last_name: 'Admin',
  role: 'ADMIN',
  status: true,
  created_at: '2026-01-01T00:00:00.000Z',
} as User;

function Status({ label }: { label: string }) {
  const { isAuthenticated, getUser } = useAuth();
  return <p data-testid={label}>{isAuthenticated ? getUser()?.first_name : 'anon'}</p>;
}

function LoginButton() {
  const { login } = useAuth();
  return <button onClick={() => login(alice)}>entrar</button>;
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={() => logout()}>sair</button>;
}

function renderApp() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Status label="a" />
        <Status label="b" />
        <LoginButton />
        <LogoutButton />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    getMeMock.mockReset();
    logoutMock.mockReset().mockResolvedValue(undefined);
    csrfMock.mockReset().mockResolvedValue({ csrfToken: 'x' });
  });

  it('starts signed out when the session cookie is not valid', async () => {
    getMeMock.mockRejectedValue({ response: { status: 401 } });
    renderApp();
    await waitFor(() => expect(screen.getByTestId('a').textContent).toBe('anon'));
  });

  it('restores the session from /auth/me (the server is the source of truth)', async () => {
    getMeMock.mockResolvedValue(alice);
    renderApp();
    await waitFor(() => expect(screen.getByTestId('a').textContent).toBe('Alice'));
  });

  it('shares one session state: login and logout update every consumer at once', async () => {
    getMeMock.mockRejectedValue({ response: { status: 401 } });
    renderApp();
    await waitFor(() => expect(screen.getByTestId('a').textContent).toBe('anon'));

    await act(async () => screen.getByText('entrar').click());
    expect(screen.getByTestId('a').textContent).toBe('Alice');
    expect(screen.getByTestId('b').textContent).toBe('Alice');

    await act(async () => screen.getByText('sair').click());
    expect(screen.getByTestId('a').textContent).toBe('anon');
    expect(screen.getByTestId('b').textContent).toBe('anon');
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
