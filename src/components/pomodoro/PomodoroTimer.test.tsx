import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PomodoroTimer } from './PomodoroTimer';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

describe('PomodoroTimer', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, String(value));
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        clear: () => {
          storage.clear();
        },
      },
      writable: true,
      configurable: true,
    });
  });

  it('defaults to 10 minutes, allows editing break duration, and persists it', () => {
    render(<PomodoroTimer />);

    expect(screen.getByText('10:00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Break duration' }));
    const minutesInput = screen.getByLabelText('Break minutes');
    fireEvent.change(minutesInput, { target: { value: '15' } });
    fireEvent.keyDown(minutesInput, { key: 'Enter' });

    expect(screen.getByText('15:00')).toBeInTheDocument();
    expect(storage.get('pomodoro_settings')).toContain('"break":900');
  });

  it('uses saved break duration and shows a static break header', () => {
    storage.set('pomodoro_settings', JSON.stringify({ break: 1800 }));

    render(<PomodoroTimer />);

    expect(screen.getByText('30:00')).toBeInTheDocument();
    expect(screen.getByTestId('pomodoro-break-header')).toHaveTextContent('Break');
    expect(screen.queryByRole('button', { name: 'Focus' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Short Break' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Long Break' })).not.toBeInTheDocument();
  });
});
