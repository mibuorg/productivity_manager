import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiChatPanel } from './AiChatPanel';

describe('AiChatPanel', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('disables AI interactions when server internet check reports offline', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ online: false }),
    });

    render(
      <AiChatPanel
        open
        onClose={() => {}}
        board={null}
        tasks={[]}
      />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/internet-status', expect.any(Object));
    });

    expect(screen.getByText(/requires internet connection/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask about your tasks/i)).toBeDisabled();
  });
});
