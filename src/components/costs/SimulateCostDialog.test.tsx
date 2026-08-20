import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SimulateCostDialog from './SimulateCostDialog';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SimulateCostDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('não entra em loop infinito ao montar fechado', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let schedulerCalls = 0;
    const originalScheduler = notifyManager.scheduler;
    notifyManager.setScheduler((cb) => {
      schedulerCalls += 1;
      setTimeout(cb, 1);
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <SimulateCostDialog open={false} onOpenChange={() => {}} />
      </QueryClientProvider>
    );

    await sleep(100);
    unmount();
    await sleep(20);

    notifyManager.setScheduler(originalScheduler);

    expect(schedulerCalls).toBeLessThanOrEqual(3);
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Maximum update depth exceeded')
    );
  });
});