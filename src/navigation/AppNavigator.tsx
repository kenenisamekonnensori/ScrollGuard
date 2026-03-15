import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FocusModeScreen } from '../screens/FocusModeScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { LockScreen } from '../screens/LockScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PermissionsSetupScreen } from '../screens/PermissionsSetupScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { Text } from 'react-native';
import { colors } from '../theme/tokens';
import { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 9,
          paddingTop: 7,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, focused }) => {
          const iconMap: Record<keyof MainTabParamList, string> = {
            DashboardScreen: '⌂',
            StatsScreen: '▦',
            FocusModeScreen: '◎',
            NotificationsScreen: '◉',
            SettingsScreen: '⚙',
          };

          return (
            <Text
              style={{
                fontSize: focused ? 18 : 16,
                color,
                fontWeight: focused ? '800' : '600',
                marginBottom: 2,
              }}>
              {iconMap[route.name]}
            </Text>
          );
        },
      })}>
      <Tab.Screen name="DashboardScreen" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="StatsScreen" component={StatsScreen} options={{ title: 'Analytics' }} />
      <Tab.Screen name="FocusModeScreen" component={FocusModeScreen} options={{ title: 'Focus' }} />
      <Tab.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{ title: 'Alerts' }}
      />
      <Tab.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="SplashScreen"
      screenOptions={{
        headerTitleAlign: 'center',
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: colors.text,
        },
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="OnboardingScreen"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PermissionsSetupScreen"
        component={PermissionsSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen
        name="PremiumScreen"
        component={PremiumScreen}
        options={{
          title: 'Premium',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="SignUpScreen"
        component={SignUpScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="LockScreen"
        component={LockScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}