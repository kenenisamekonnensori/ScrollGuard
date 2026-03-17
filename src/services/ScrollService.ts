import {
  DeviceEventEmitter,
  EmitterSubscription,
} from 'react-native';
import { startScrollDetection, stopScrollDetection } from '../native/NativeBridgeService';
import { useUsageStore } from '../store/usageStore';

const SCROLL_EVENT_NAME = 'onScrollDetected';

type ScrollEventPayload = {
  packageName?: string;
  timestamp?: number;
};

/**
 * ScrollService coordinates native scroll events and usage-store updates.
 */
class ScrollService {
  private subscription: EmitterSubscription | null = null;
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private pendingIncrements: Record<string, number> = {};

  /**
   * Flushes buffered scroll increments to the usage store in one persisted write.
   */
  private flushPendingIncrements(): void {
    const pendingEntries = Object.entries(this.pendingIncrements);
    if (pendingEntries.length === 0) {
      return;
    }

    const { videoCounts, setVideoCounts } = useUsageStore.getState();
    const nextVideoCounts = { ...videoCounts };

    pendingEntries.forEach(([packageName, count]) => {
      nextVideoCounts[packageName] = (nextVideoCounts[packageName] ?? 0) + count;
    });

    this.pendingIncrements = {};
    setVideoCounts(nextVideoCounts);
  }

  /**
   * Starts native scroll detection and subscribes to onScrollDetected events.
   */
  startListening(): void {
    if (this.subscription) {
      return;
    }

    startScrollDetection();

    this.subscription = DeviceEventEmitter.addListener(
      SCROLL_EVENT_NAME,
      (event: ScrollEventPayload) => {
        const packageName = event.packageName;
        if (!packageName) {
          return;
        }

        this.pendingIncrements[packageName] =
          (this.pendingIncrements[packageName] ?? 0) + 1;
      },
    );

    this.flushInterval = setInterval(() => {
      this.flushPendingIncrements();
    }, 1000);
  }

  /**
   * Stops native scroll detection and removes the active event subscription.
   */
  stopListening(): void {
    stopScrollDetection();
    this.subscription?.remove();
    this.subscription = null;

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    this.flushPendingIncrements();
  }
}

export const scrollService = new ScrollService();
