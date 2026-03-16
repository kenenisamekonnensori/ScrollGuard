import { getRandomMotivation } from '../features/motivation/motivationEngine';

/**
 * Notification payload used by placeholder notification methods.
 */
type NotificationPayload = {
  title: string;
  body: string;
};

/**
 * Placeholder scheduler: currently logs notification intent.
 * This will be replaced with native notifications wiring in later phases.
 */
function scheduleNotification(payload: NotificationPayload): void {
  if (__DEV__) {
    console.info('[NotificationService]', payload.title, payload.body);
  }
}

/**
 * Sends a threshold warning notification for ongoing usage.
 */
export function sendWarningNotification(appName: string, usageMinutes: number): void {
  scheduleNotification({
    title: `${appName} Usage Warning`,
    body: `You have spent ${usageMinutes} minutes in ${appName}. ${getRandomMotivation()}`,
  });
}

/**
 * Sends a limit-reached notification when blocking should be enforced.
 */
export function sendLimitReachedNotification(appName: string): void {
  scheduleNotification({
    title: `${appName} Limit Reached`,
    body: `${appName} has reached its daily limit. ${getRandomMotivation()}`,
  });
}
