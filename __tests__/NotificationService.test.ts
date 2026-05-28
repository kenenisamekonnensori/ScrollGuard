const mockGetValue = jest.fn();
const mockSetValue = jest.fn();
const mockPostLocalNotification = jest.fn();

jest.mock('../src/db/storage', () => ({
  getValue: (...args: unknown[]) => mockGetValue(...args),
  setValue: (...args: unknown[]) => mockSetValue(...args),
}));

jest.mock('../src/native/NativeBridgeService', () => ({
  postLocalNotification: (...args: unknown[]) => mockPostLocalNotification(...args),
}));

jest.mock('../src/features/motivation/motivationEngine', () => ({
  getRandomMotivation: () => 'Stay intentional.',
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValue.mockReturnValue([]);
    mockPostLocalNotification.mockResolvedValue(true);
  });

  test('posts focus warnings through the ScrollGuard native local notification module', async () => {
    const { sendWarningNotification } = require('../src/services/NotificationService');

    sendWarningNotification('Instagram', 5, 50);
    await Promise.resolve();

    expect(mockSetValue).toHaveBeenCalledTimes(1);
    expect(mockPostLocalNotification).toHaveBeenCalledWith(
      'Instagram Usage Warning',
      expect.stringContaining('Instagram is at 50%'),
    );
  });

  test('dedupes recent notifications before calling native code', async () => {
    const now = Date.now();
    mockGetValue.mockReturnValue([
      {
        id: 'instagram-warning-50-existing',
        dedupeKey: 'instagram-warning-50',
        title: 'Instagram Usage Warning',
        body: 'Already sent',
        severity: 'warning',
        createdAt: now,
      },
    ]);

    const { sendWarningNotification } = require('../src/services/NotificationService');

    sendWarningNotification('Instagram', 5, 50);
    await Promise.resolve();

    expect(mockSetValue).not.toHaveBeenCalled();
    expect(mockPostLocalNotification).not.toHaveBeenCalled();
  });
});
