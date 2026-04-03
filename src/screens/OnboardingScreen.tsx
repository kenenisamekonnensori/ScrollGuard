import React from 'react';
import {
  Animated,
  Easing,
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepIndicator } from '../components/onboarding/StepIndicator';
import { Pressable, Text } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { AwarenessScreen } from './onboarding/AwarenessScreen';
import { HookScreen } from './onboarding/HookScreen';
import { PermissionsScreen } from './onboarding/PermissionsScreen';
import { StepContentProps, OnboardingStep } from './onboarding/types';
import FocusValueScreen from './onboarding/FocusValueScreen';

type AnimatedStepContentProps = {
  children: React.ReactNode;
  style?: any;
};

function AnimatedStepContent({ children, style }: AnimatedStepContentProps): React.JSX.Element {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(10)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.animatedStepContent,
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

const HOOK_STEP: OnboardingStep = {
  key: 'hook',
  title: '',
  subtitle: '',
  Component: HookScreen,
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'awareness',
    title: 'Build Awareness',
    subtitle: 'Step 1 of 3 - See your patterns',
    Component: AwarenessScreen,
  },
  {
    key: 'value',
    title: 'Protect Your Focus',
    subtitle: 'Step 2 of 3 - Simple daily wins',
    Component: FocusValueScreen,
  },
  {
    key: 'permissions',
    title: 'Turn Protection On',
    subtitle: 'Step 3 of 3 - Enable permissions',
    Component: PermissionsScreen,
  },
];

export function OnboardingContainer(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [showHookScreen, setShowHookScreen] = React.useState(true);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [pageWidth, setPageWidth] = React.useState(0);
  const listRef = React.useRef<FlatList<OnboardingStep>>(null);
  const progressValue = React.useRef(new Animated.Value(0)).current;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;
  const currentStep = ONBOARDING_STEPS[currentStepIndex];

  React.useEffect(() => {
    Animated.timing(progressValue, {
      toValue: currentStepIndex,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex, progressValue]);

  const handleContainerLayout = React.useCallback((event: LayoutChangeEvent): void => {
    const width = event.nativeEvent.layout.width;
    if (width <= 0) {
      return;
    }

    setPageWidth(previousWidth => {
      if (Math.abs(previousWidth - width) < 1) {
        return previousWidth;
      }

      return width;
    });
  }, []);

  const scrollToStep = React.useCallback((stepIndex: number): void => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollToIndex({
      index: stepIndex,
      animated: true,
    });
  }, []);

  const handleNext = React.useCallback((): void => {
    if (isLastStep) {
      navigation.navigate('PermissionsSetupScreen');
      return;
    }

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    scrollToStep(nextIndex);
  }, [currentStepIndex, isLastStep, navigation, scrollToStep]);

  const handleBack = React.useCallback((): void => {
    if (isFirstStep) {
      return;
    }

    const previousIndex = currentStepIndex - 1;
    setCurrentStepIndex(previousIndex);
    scrollToStep(previousIndex);
  }, [currentStepIndex, isFirstStep, scrollToStep]);

  const handleStartOnboarding = React.useCallback((): void => {
    setCurrentStepIndex(0);
    setShowHookScreen(false);
  }, []);

  const handleMomentumScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      if (pageWidth <= 0) {
        return;
      }

      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / pageWidth);
      if (nextIndex !== currentStepIndex && nextIndex >= 0 && nextIndex < ONBOARDING_STEPS.length) {
        setCurrentStepIndex(nextIndex);
      }
    },
    [currentStepIndex, pageWidth],
  );

  const renderStepItem = React.useCallback(
    ({ item }: { item: OnboardingStep }): React.JSX.Element => {
      const StepComponent = item.Component;
      return (
        <View style={[styles.stepPage, pageWidth > 0 ? { width: pageWidth } : null]}>
          <View style={styles.stepPageContent}>
            <AnimatedStepContent>
              <StepComponent
                navigation={navigation as StepContentProps['navigation']}
                onNext={handleNext}
                onSkip={() => navigation.navigate('PermissionsSetupScreen')}
              />
            </AnimatedStepContent>
          </View>
        </View>
      );
    },
    [handleNext, navigation, pageWidth],
  );

  const keyExtractor = React.useCallback((item: OnboardingStep): string => item.key, []);

  const getItemLayout = React.useCallback(
    (_: ArrayLike<OnboardingStep> | null | undefined, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth],
  );

  const insets = useSafeAreaInsets();

  if (showHookScreen) {
    const HookComponent = HOOK_STEP.Component;

    return (
      <View style={styles.hookStepContainer}>
        <AnimatedStepContent style={{ flex: 1 }}>
          <HookComponent
            navigation={navigation as StepContentProps['navigation']}
            onNext={handleStartOnboarding}
            onSkip={() => navigation.navigate('PermissionsSetupScreen')}
          />
        </AnimatedStepContent>
      </View>
    );
  }

  return (
    <AppScreen 
      title={currentStep.title} 
      subtitle={currentStep.subtitle} 
      noScroll
      headerLeft={
        !isFirstStep ? (
          <Pressable onPress={handleBack} hitSlop={10} style={styles.headerIconButton}>
            <View style={styles.arrowLeft} />
          </Pressable>
        ) : null
      }
      headerRight={
        <Pressable onPress={handleNext} hitSlop={10} style={styles.headerIconButton}>
          <View style={styles.arrowRight} />
        </Pressable>
      }
    >
      <StepIndicator
        stepKeys={ONBOARDING_STEPS.map(step => step.key)}
        progressValue={progressValue}
      />

      <View style={styles.flatListContainer} onLayout={handleContainerLayout}>
        <FlatList
          ref={listRef}
          data={ONBOARDING_STEPS}
          keyExtractor={keyExtractor}
          renderItem={renderStepItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEnabled
          getItemLayout={pageWidth > 0 ? getItemLayout : undefined}
          extraData={pageWidth}
        />
      </View>

      <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.secondaryActionsWrap}>
          <PrimaryButton
            label="Continue"
            variant="primary"
            onPress={() => navigation.navigate('PermissionsSetupScreen')}
          />
          <PrimaryButton
            label="Login"
            variant="ghost"
            onPress={() => navigation.navigate('LoginScreen')}
          />
        </View>
      </View>
    </AppScreen>
  );
}

export function OnboardingScreen(): React.JSX.Element {
  return <OnboardingContainer />;
}

const styles = StyleSheet.create({
  flatListContainer: {
    width: '100%',
    flex: 1,
    minHeight: 280,
  },
  stepPage: {
    width: '100%',
  },
  hookStepContainer: {
    flex: 1,
    minHeight: 0,
  },
  stepPageContent: {
    gap: 6,
    paddingBottom: 20,
  },
  animatedStepContent: {
    gap: 6,
  },
  actionsContainer: {
    paddingTop: 16,
    gap: 6,
  },
  primaryActionWrap: {
    marginTop: 0,
  },
  secondaryActionsWrap: {
    flexDirection: 'column',
    gap: 1,
    marginTop: 0,
    marginBottom: 0,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    width: 14,
    height: 14,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: '#0B1330',
    transform: [{ rotate: '-45deg' }, { translateX: 2 }, { translateY: 2 }],
  },
  arrowRight: {
    width: 14,
    height: 14,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#0B1330',
    transform: [{ rotate: '45deg' }, { translateX: -2 }, { translateY: 2 }],
  },
});
