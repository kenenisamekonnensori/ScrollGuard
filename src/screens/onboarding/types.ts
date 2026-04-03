export type StepContentProps = {
  navigation: any;
  onNext?: () => void;
  onSkip?: () => void;
};

export type OnboardingStep = {
  key: string;
  title: string;
  subtitle: string;
  Component: React.ComponentType<StepContentProps>;
};
