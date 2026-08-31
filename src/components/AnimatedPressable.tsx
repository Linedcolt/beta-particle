import React, { useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";

interface Props {
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a Pressable with a small spring-driven scale animation on
 * press-in/press-out, so every tappable control in the app gets the same
 * tactile "give" instead of the flat, instant state-change default.
 * Pure Animated (native driver) - no extra native dependency.
 */
export default function AnimatedPressable({
  onPress,
  style,
  scaleTo = 0.96,
  disabled,
  children,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
