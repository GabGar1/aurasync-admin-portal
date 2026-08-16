import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTokenExpirationWatcher from './useTokenExpirationWatcher';

const { logoutMock, getMeMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  getMeMock: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ logout: logoutMock }),
}));

vi.mock('@/services/api', () => ({
  authApi: { getMe: getMeMock },
}));

describe('useTokenExpirationWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    logoutMock.mockClear();
    getMeMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('não desloga quando getMe falha por falta de rede', async () => {
    getMeMock.mockRejectedValue({ message: 'Network Error' });
    renderHook(() => useTokenExpirationWatcher());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(logoutMock).not.toHaveBeenCalled();
  });

  it('desloga somente quando getMe confirma 401 (sessão expirada)', async () => {
    getMeMock.mockRejectedValue({ response: { status: 401 } });
    renderHook(() => useTokenExpirationWatcher());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('não desloga em erro 500 do servidor', async () => {
    getMeMock.mockRejectedValue({ response: { status: 500, data: { error: 'Internal server error' } } });
    renderHook(() => useTokenExpirationWatcher());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(logoutMock).not.toHaveBeenCalled();
  });
});