export type StepContentProps = {
  navigation: any;
};

export type OnboardingStep = {
  key: string;
  title: string;
  subtitle: string;
  Component: React.ComponentType<StepContentProps>;
};
