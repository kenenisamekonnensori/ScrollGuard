import React from 'react';
import { AppState } from 'react-native';
import {
  AppEntryRoute,
  RETURN_SPLASH_MIN_DURATION_MS,
  getLastActiveAt,
  hasCompletedOnboarding,
  resolveStartupRoute,
  setLastActiveAt,
  shouldShowSplashAfterInactivity,
} from '../utils/appFlow';

type AppStartupState =
  | {
      isReady: false;
      initialRouteName: undefined;
      isSplashVisible: true;
    }
  | {
      isReady: true;
      initialRouteName: AppEntryRoute;
      isSplashVisible: boolean;
    };

const LOADING_STARTUP_STATE: AppStartupState = {
  isReady: false,
  initialRouteName: undefined,
  isSplashVisible: true,
};

function getStartupFallbackRoute(): AppEntryRoute {
  return hasCompletedOnboarding() ? 'PermissionsSetupScreen' : 'OnboardingScreen';
}

export function useAppStartup(): AppStartupState {
  const [startupState, setStartupState] = React.useState<AppStartupState>(
    LOADING_STARTUP_STATE,
  );
  const splashTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearSplashTimeout = React.useCallback((): void => {
    if (splashTimeoutRef.current) {
      clearTimeout(splashTimeoutRef.current);
      splashTimeoutRef.current = null;
    }
  }, []);

  const showTimedSplash = React.useCallback((): void => {
    clearSplashTimeout();
    setStartupState(previousState => ({
      ...previousState,
      isSplashVisible: true,
    }));

    splashTimeoutRef.current = setTimeout(() => {
      splashTimeoutRef.current = null;
      setStartupState(previousState =>
        previousState.isReady
          ? {
              ...previousState,
              isSplashVisible: false,
            }
          : previousState,
      );
    }, RETURN_SPLASH_MIN_DURATION_MS);
  }, [clearSplashTimeout]);

  React.useEffect(() => {
    let isActive = true;
    const startedAtMs = Date.now();
    const shouldHoldSplash = shouldShowSplashAfterInactivity(
      getLastActiveAt(),
      startedAtMs,
    );

    resolveStartupRoute()
      .then(initialRouteName => {
        if (!isActive) {
          return;
        }

        const elapsedMs = Date.now() - startedAtMs;
        const remainingSplashMs = shouldHoldSplash
          ? Math.max(RETURN_SPLASH_MIN_DURATION_MS - elapsedMs, 0)
          : 0;

        setStartupState({
          isReady: true,
          initialRouteName,
          isSplashVisible: remainingSplashMs > 0,
        });
        setLastActiveAt();

        if (remainingSplashMs > 0) {
          clearSplashTimeout();
          splashTimeoutRef.current = setTimeout(() => {
            splashTimeoutRef.current = null;
            setStartupState(previousState =>
              previousState.isReady
                ? {
                    ...previousState,
                    isSplashVisible: false,
                  }
                : previousState,
            );
          }, remainingSplashMs);
        }
      })
      .catch(error => {
        if (__DEV__) {
          console.warn('[useAppStartup] Failed to resolve startup route.', error);
        }

        if (!isActive) {
          return;
        }

        setStartupState({
          isReady: true,
          initialRouteName: getStartupFallbackRoute(),
          isSplashVisible: shouldHoldSplash,
        });
        setLastActiveAt();

        if (shouldHoldSplash) {
          clearSplashTimeout();
          splashTimeoutRef.current = setTimeout(() => {
            splashTimeoutRef.current = null;
            setStartupState(previousState =>
              previousState.isReady
                ? {
                    ...previousState,
                    isSplashVisible: false,
                  }
                : previousState,
            );
          }, RETURN_SPLASH_MIN_DURATION_MS);
        }
      });

    return () => {
      isActive = false;
      clearSplashTimeout();
      setLastActiveAt();
    };
  }, [clearSplashTimeout]);

  React.useEffect(() => {
    let previousAppState = AppState.currentState;

    const appStateSubscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && previousAppState !== 'active') {
        if (shouldShowSplashAfterInactivity(getLastActiveAt())) {
          showTimedSplash();
        }

        setLastActiveAt();
      }

      if (nextState !== 'active') {
        setLastActiveAt();
      }

      previousAppState = nextState;
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [showTimedSplash]);

  return startupState;
}
