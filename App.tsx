import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStartup } from './src/hooks/useAppStartup';
import { AppNavigator } from './src/navigation/AppNavigator';
import {
  onAppStateChanged,
  startMonitoring,
  stopMonitoring,
} from './src/services/MonitoringService';
import { StartupSplash } from './src/screens/SplashScreen';

function App(): React.JSX.Element {
  const { isReady, initialRouteName, isSplashVisible } = useAppStartup();

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
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />
      <View style={styles.container}>
        {isReady ? (
          <NavigationContainer>
            <AppNavigator initialRouteName={initialRouteName} />
          </NavigationContainer>
        ) : null}
        {isSplashVisible ? (
          <View style={styles.splashOverlay}>
            <StartupSplash />
          </View>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default App;
