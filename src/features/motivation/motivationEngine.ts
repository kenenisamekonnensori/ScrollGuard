/**
 * Motivation messages used to interrupt scrolling behavior and reinforce focus.
 */
const MOTIVATION_MESSAGES = [
  'Stop scrolling. Start building.',
  'Your future is not in the feed.',
  'Focus now, thank yourself later.',
  'Attention is your most valuable asset.',
  'One less scroll, one more step forward.',
];

/**
 * Returns one random motivation message.
 */
export function getRandomMotivation(): string {
  const index = Math.floor(Math.random() * MOTIVATION_MESSAGES.length);
  return MOTIVATION_MESSAGES[index];
}

/**
 * Exposes all motivation messages for UI preview/testing.
 */
export function getMotivationMessages(): string[] {
  return [...MOTIVATION_MESSAGES];
}
