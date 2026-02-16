import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleProp,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../constants';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'primary':
        return [COLORS.primary.main, COLORS.primary.light];
      case 'secondary':
        return [COLORS.secondary.main, COLORS.secondary.light];
      case 'accent':
        return [COLORS.accent.main, COLORS.accent.light];
      case 'outline':
      case 'ghost':
        return ['transparent', 'transparent'];
      default:
        return [COLORS.primary.main, COLORS.primary.light];
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return COLORS.primary.main;
      default:
        return COLORS.text.primary;
    }
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.container,
        animatedStyle,
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={[
          styles.gradient,
          getSizeStyles(),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[
              styles.text,
              { color: getTextColor() },
              textStyle,
            ]}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  disabled: {
    opacity: 0.5,
  },
});

import { SPACING } from '../../constants';
