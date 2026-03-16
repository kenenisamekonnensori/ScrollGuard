export type MainTabParamList = {
  DashboardScreen: undefined;
  StatsScreen: undefined;
  FocusModeScreen: undefined;
  NotificationsScreen: undefined;
  SettingsScreen: undefined;
};

export type RootStackParamList = {
  SplashScreen: undefined;
  OnboardingScreen: undefined;
  PermissionsSetupScreen: undefined;
  MainTabs: undefined;
  LockScreen:
    | {
        app?: string;
        lockedUntil?: number;
      }
    | undefined;
  ProfileScreen: undefined;
  PremiumScreen: undefined;
  LoginScreen: undefined;
  SignUpScreen: undefined;
  ForgotPasswordScreen: undefined;
};