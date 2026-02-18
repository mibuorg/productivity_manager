import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AccountMenu } from './AccountMenu';

const { useAuthMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: useAuthMock,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" role="menuitem" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

describe('AccountMenu', () => {
  it('shows log in menu action when user is signed out', async () => {
    useAuthMock.mockReturnValue({
      user: null,
      signOut: vi.fn(),
    });

    render(<AccountMenu />);

    expect(await screen.findByRole('menuitem', { name: 'Log in / Sign up' })).toBeInTheDocument();
  });

  it('shows email and allows sign out when user is signed in', async () => {
    const signOut = vi.fn(async () => ({ error: null }));
    useAuthMock.mockReturnValue({
      user: { email: 'ethan@example.com' },
      signOut,
    });

    render(<AccountMenu />);

    expect(await screen.findByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.getByText('ethan@example.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(toastSuccessMock).toHaveBeenCalledWith('Signed out');
    });
  });
});
