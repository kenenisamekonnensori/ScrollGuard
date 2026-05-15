import { MonitoredAppFamily } from '../../utils/appPackages';

export type FocusSessionStatus = 'idle' | 'tracking' | 'blocked' | 'completed';

export type FocusSession = {
  id: string;
  appFamily: MonitoredAppFamily;
  packageName: string;
  packageNames: readonly string[];
  appName: string;
  status: FocusSessionStatus;
  allowedUsageSeconds: number;
  blockDurationSeconds: number;
  baselineUsageSeconds: number;
  consumedUsageSeconds: number;
  warningThresholdsSent: number[];
  startedAt: number;
  updatedAt: number;
  blockedAt: number | null;
  blockedUntil: number | null;
  completedAt: number | null;
};

export type StartFocusSessionInput = {
  appFamily: MonitoredAppFamily;
  allowedUsageMinutes: number;
  blockDurationMinutes: number;
};

export type FocusSessionRuntimeState = FocusSessionStatus;
