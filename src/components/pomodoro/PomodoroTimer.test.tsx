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

  it('allows editing the selected mode duration from the timer display and persists it', () => {
    render(<PomodoroTimer />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Focus duration' }));
    const minutesInput = screen.getByLabelText('Focus minutes');
    fireEvent.change(minutesInput, { target: { value: '40' } });
    fireEvent.keyDown(minutesInput, { key: 'Enter' });

    expect(screen.getByText('40:00')).toBeInTheDocument();
    expect(storage.get('pomodoro_settings')).toContain('"work":2400');
  });

  it('uses saved mode durations and keeps the mode switcher padded inside its border', () => {
    storage.set('pomodoro_settings', JSON.stringify({ work: 1500, shortBreak: 300, longBreak: 1800 }));

    render(<PomodoroTimer />);
    fireEvent.click(screen.getByRole('button', { name: 'Long Break' }));

    expect(screen.getByText('30:00')).toBeInTheDocument();
    expect(screen.getByTestId('pomodoro-mode-switcher')).toHaveClass('p-1');
  });
});
