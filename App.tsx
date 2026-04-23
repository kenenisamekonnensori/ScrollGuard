import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { AppState, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import {
  onAppStateChanged,
  startMonitoring,
  stopMonitoring,
} from './src/services/MonitoringService';

function App(): React.JSX.Element {
  useEffect(() => {
    startMonitoring().catch(error => {
      if (__DEV__) {
        console.warn('[App] Failed to start monitoring.', error);
      }
    });

    const appStateSubscription = AppState.addEventListener(
      'change',
      onAppStateChanged,
    );

    return () => {
      appStateSubscription.remove();
      stopMonitoring();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
        />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
