import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
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
import { StatsScreen } from '../screens/StatsScreen';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme/tokens';
import { MainTabParamList, RootStackParamList } from './types';
import { AppEntryRoute } from '../utils/appFlow';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICON_MAP: Record<keyof MainTabParamList, string> = {
  DashboardScreen: '⌂',
  StatsScreen: '▦',
  FocusModeScreen: '◎',
  NotificationsScreen: '◉',
  SettingsScreen: '⚙',
};

type TabBarIconProps = {
  color: string;
  focused: boolean;
  routeName: keyof MainTabParamList;
};

function TabBarIcon({ color, focused, routeName }: TabBarIconProps): React.JSX.Element {
  return (
    <Text
      style={[
        styles.tabBarIcon,
        focused ? styles.tabBarIconFocused : styles.tabBarIconDefault,
        { color },
      ]}>
      {TAB_ICON_MAP[routeName]}
    </Text>
  );
}

function createTabBarIconRenderer(
  routeName: keyof MainTabParamList,
): NonNullable<BottomTabNavigationOptions['tabBarIcon']> {
  return ({ color, focused }) => (
    <TabBarIcon color={color} focused={focused} routeName={routeName} />
  );
}

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
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
      }}>
      <Tab.Screen
        name="DashboardScreen"
        component={DashboardScreen}
        options={{ title: 'Home', tabBarIcon: createTabBarIconRenderer('DashboardScreen') }}
      />
      <Tab.Screen
        name="StatsScreen"
        component={StatsScreen}
        options={{ title: 'Analytics', tabBarIcon: createTabBarIconRenderer('StatsScreen') }}
      />
      <Tab.Screen
        name="FocusModeScreen"
        component={FocusModeScreen}
        options={{ title: 'Focus', tabBarIcon: createTabBarIconRenderer('FocusModeScreen') }}
      />
      <Tab.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: createTabBarIconRenderer('NotificationsScreen'),
        }}
      />
      <Tab.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: createTabBarIconRenderer('SettingsScreen'),
        }}
      />
    </Tab.Navigator>
  );
}

type AppNavigatorProps = {
  initialRouteName: AppEntryRoute;
};

export function AppNavigator({ initialRouteName }: AppNavigatorProps): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
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

const styles = StyleSheet.create({
  tabBarIcon: {
    marginBottom: 2,
  },
  tabBarIconFocused: {
    fontSize: 18,
    fontWeight: '800',
  },
  tabBarIconDefault: {
    fontSize: 16,
    fontWeight: '600',
  },
});
