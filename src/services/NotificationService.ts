import { getValue, setValue } from '../db/storage';
import { getRandomMotivation } from '../features/motivation/motivationEngine';
import { postLocalNotification as postNativeLocalNotification } from '../native/NativeBridgeService';

const NOTIFICATION_HISTORY_STORAGE_KEY = 'notificationHistory';
const MAX_NOTIFICATION_HISTORY = 50;

export type NotificationSeverity = 'info' | 'warning' | 'danger';

export type NotificationHistoryItem = {
  id: string;
  dedupeKey: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  createdAt: number;
};

type NotificationPayload = {
  dedupeKey: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  dedupeWindowMs?: number;
};

function getNotificationHistory(): NotificationHistoryItem[] {
  return getValue<NotificationHistoryItem[]>(NOTIFICATION_HISTORY_STORAGE_KEY) ?? [];
}

function saveNotificationHistory(history: NotificationHistoryItem[]): void {
  setValue(NOTIFICATION_HISTORY_STORAGE_KEY, history.slice(-MAX_NOTIFICATION_HISTORY));
}

function wasRecentlySent(dedupeKey: string, dedupeWindowMs: number): boolean {
  const now = Date.now();
  return getNotificationHistory().some(item => {
    return item.dedupeKey === dedupeKey && now - item.createdAt < dedupeWindowMs;
  });
}

function persistNotification(payload: NotificationPayload): NotificationHistoryItem {
  const item: NotificationHistoryItem = {
    id: `${payload.dedupeKey}-${Date.now()}`,
    dedupeKey: payload.dedupeKey,
    title: payload.title,
    body: payload.body,
    severity: payload.severity,
    createdAt: Date.now(),
  };

  saveNotificationHistory([...getNotificationHistory(), item]);
  return item;
}

function postLocalNotification(payload: NotificationPayload): void {
  const dedupeWindowMs = payload.dedupeWindowMs ?? 15 * 60_000;
  if (wasRecentlySent(payload.dedupeKey, dedupeWindowMs)) {
    return;
  }

  const item = persistNotification(payload);

  try {
    postNativeLocalNotification(item.title, item.body).catch(error => {
      if (__DEV__) {
        console.warn('[NotificationService] Failed to post local notification.', error);
      }
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[NotificationService] Failed to post local notification.', error);
    }
  }
}

export function getDeliveredNotificationHistory(): NotificationHistoryItem[] {
  return getNotificationHistory().sort((first, second) => second.createdAt - first.createdAt);
}

export function sendWarningNotification(
  appName: string,
  usageMinutes: number,
  thresholdPercent: 50 | 75,
): void {
  postLocalNotification({
    dedupeKey: `${appName.toLowerCase()}-warning-${thresholdPercent}`,
    title: `${appName} Usage Warning`,
    body: `${appName} is at ${thresholdPercent}% of your daily limit (${Math.floor(usageMinutes)} min). ${getRandomMotivation()}`,
    severity: 'warning',
    dedupeWindowMs: 12 * 60 * 60_000,
  });
}

export function sendLimitReachedNotification(appName: string): void {
  postLocalNotification({
    dedupeKey: `${appName.toLowerCase()}-limit-reached`,
    title: `${appName} Limit Reached`,
    body: `${appName} has reached its daily limit and is now blocked. ${getRandomMotivation()}`,
    severity: 'danger',
    dedupeWindowMs: 12 * 60 * 60_000,
  });
}

export function sendLockReleasedNotification(appName: string): void {
  postLocalNotification({
    dedupeKey: `${appName.toLowerCase()}-lock-released`,
    title: `${appName} Unblocked`,
    body: `${appName} is available again. Stay intentional as you go back in.`,
    severity: 'info',
    dedupeWindowMs: 5 * 60_000,
  });
}
