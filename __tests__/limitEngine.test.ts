const mockRefreshMonitoringNow = jest.fn();

jest.mock('../src/services/MonitoringService', () => ({
  refreshMonitoringNow: (...args: unknown[]) => mockRefreshMonitoringNow(...args),
}));

import { evaluateUsageLimits } from '../src/features/limits/limitEngine';

describe('limitEngine.evaluateUsageLimits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('delegates to monitoring so daily and focus limits stay in sync', async () => {
    await evaluateUsageLimits();

    expect(mockRefreshMonitoringNow).toHaveBeenCalledTimes(1);
  });
});
