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
import { StepIndicator } from '../components/onboarding/StepIndicator';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { AwarenessScreen } from './onboarding/AwarenessScreen';
import { HookScreen } from './onboarding/HookScreen';
import { PermissionsScreen } from './onboarding/PermissionsScreen';
import { StepContentProps, OnboardingStep } from './onboarding/types';
import { ValueScreen } from './onboarding/ValueScreen';

type AnimatedStepContentProps = {
  children: React.ReactNode;
};

function AnimatedStepContent({ children }: AnimatedStepContentProps): React.JSX.Element {
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
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'hook',
    title: 'Take Your Time Back',
    subtitle: 'Step 1 of 4 - Feel the cost',
    Component: HookScreen,
  },
  {
    key: 'awareness',
    title: 'Build Awareness',
    subtitle: 'Step 2 of 4 - See your patterns',
    Component: AwarenessScreen,
  },
  {
    key: 'value',
    title: 'Protect Your Focus',
    subtitle: 'Step 3 of 4 - Simple daily wins',
    Component: ValueScreen,
  },
  {
    key: 'permissions',
    title: 'Turn Protection On',
    subtitle: 'Step 4 of 4 - Enable permissions',
    Component: PermissionsScreen,
  },
];

export function OnboardingContainer(): React.JSX.Element {
  const navigation = useNavigation<any>();
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepPageContent}
            nestedScrollEnabled>
            <AnimatedStepContent>
              <StepComponent navigation={navigation as StepContentProps['navigation']} />
            </AnimatedStepContent>
          </ScrollView>
        </View>
      );
    },
    [navigation, pageWidth],
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

  return (
    <AppScreen title={currentStep.title} subtitle={currentStep.subtitle} noScroll>
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
          // Keep paging button-driven to avoid accidental horizontal swipes hiding permission content.
          scrollEnabled={false}
          getItemLayout={pageWidth > 0 ? getItemLayout : undefined}
          extraData={pageWidth}
        />
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.primaryActionWrap}>
          <PrimaryButton label="Continue" onPress={handleNext} />
        </View>

        <View style={styles.secondaryActionsWrap}>
          {!isFirstStep ? <PrimaryButton label="Back" variant="ghost" onPress={handleBack} /> : null}
          <PrimaryButton
            label="Continue as Guest"
            variant="ghost"
            onPress={() => navigation.navigate('PermissionsSetupScreen')}
          />
          <PrimaryButton
            label="I already have an account"
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
  stepPageContent: {
    gap: 12,
    paddingBottom: 20,
  },
  animatedStepContent: {
    gap: 12,
  },
  actionsContainer: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E6EEF2',
    gap: 8,
  },
  primaryActionWrap: {
    marginTop: 0,
  },
  secondaryActionsWrap: {
    gap: 4,
    marginTop: 0,
  },
});
