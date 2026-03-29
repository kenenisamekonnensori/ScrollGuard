import { getMotivationMessages, getRandomMotivation } from '../src/features/motivation/motivationEngine';

describe('motivationEngine', () => {
  test('returns a stable list of motivation messages', () => {
    const messages = getMotivationMessages();

    expect(messages.length).toBeGreaterThan(0);
    messages.forEach(message => {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });

  test('returns a random message from the message list', () => {
    const messages = getMotivationMessages();
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.2);

    const picked = getRandomMotivation();

    expect(messages).toContain(picked);
    randomSpy.mockRestore();
  });

  test('does not expose mutable internal message array', () => {
    const first = getMotivationMessages();
    const originalLength = first.length;

    first.push('Injected test message');

    const second = getMotivationMessages();
    expect(second.length).toBe(originalLength);
    expect(second).not.toContain('Injected test message');
  });
});
