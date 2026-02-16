import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { COLORS, BORDER_RADIUS } from '../../constants';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  gradient?: boolean;
  glow?: boolean;
  border?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  gradient = true,
  glow = false,
  border = true,
  intensity = 'medium',
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(glow ? 0.5 : 0);

  const intensityMap = {
    low: 'rgba(255, 255, 255, 0.04)',
    medium: 'rgba(255, 255, 255, 0.08)',
    high: 'rgba(255, 255, 255, 0.12)',
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    glowOpacity.value = withSpring(0.8, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withSpring(glow ? 0.5 : 0, { damping: 10, stiffness: 200 });
  };

  const CardContent = (
    <View style={[styles.container, style]}>
      {glow && (
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <LinearGradient
            colors={['rgba(57, 255, 20, 0.3)', 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      <LinearGradient
        colors={gradient ? [intensityMap[intensity], 'rgba(255, 255, 255, 0.02)'] : [intensityMap[intensity], intensityMap[intensity]]}
        style={[
          styles.gradient,
          border && styles.border,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle]}
        activeOpacity={0.9}
      >
        {CardContent}
      </AnimatedTouchable>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  gradient: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  border: {
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  glowContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: BORDER_RADIUS.lg + 2,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg + 2,
  },
});

import { SPACING } from '../../constants';
