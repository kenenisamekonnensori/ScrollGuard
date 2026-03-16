import {
  NativeEventEmitter,
  NativeModule,
  NativeModules,
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

  /**
   * Starts native scroll detection and subscribes to onScrollDetected events.
   */
  startListening(): void {
    if (this.subscription) {
      return;
    }

    startScrollDetection();

    const scrollModule = NativeModules.ScrollDetectionModule as NativeModule | undefined;
    if (!scrollModule) {
      return;
    }

    const eventEmitter = new NativeEventEmitter(scrollModule);
    this.subscription = eventEmitter.addListener(
      SCROLL_EVENT_NAME,
      (event: ScrollEventPayload) => {
        const packageName = event.packageName;
        if (!packageName) {
          return;
        }

        useUsageStore.getState().incrementVideoCount(packageName);
      },
    );
  }

  /**
   * Stops native scroll detection and removes the active event subscription.
   */
  stopListening(): void {
    stopScrollDetection();
    this.subscription?.remove();
    this.subscription = null;
  }
}

export const scrollService = new ScrollService();
