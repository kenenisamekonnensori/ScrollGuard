import { refreshFocusSessions } from '../focus/focusSessionStore';

/**
 * Legacy compatibility entrypoint.
 * Limit enforcement is now driven exclusively by explicit focus sessions.
 */
export async function evaluateUsageLimits(): Promise<void> {
  await refreshFocusSessions();
}
