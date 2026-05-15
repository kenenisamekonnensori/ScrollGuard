import { evaluateUsageLimits } from '../src/features/limits/limitEngine';
import { refreshFocusSessions } from '../src/features/focus/focusSessionStore';

jest.mock('../src/features/focus/focusSessionStore', () => ({
  refreshFocusSessions: jest.fn(),
}));

describe('limitEngine.evaluateUsageLimits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('delegates to explicit focus sessions instead of global automatic limits', async () => {
    await evaluateUsageLimits();

    expect(refreshFocusSessions).toHaveBeenCalledTimes(1);
  });
});
