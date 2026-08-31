import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Option<T extends string | number> {
  label: string;
  value: T;
}

interface Props<T extends string | number> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accentColor?: string;
}

export default function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  accentColor = "#007AFF",
}: Props<T>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const hasMounted = useRef(false);

  const segmentWidth = containerWidth / options.length;
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );

  useEffect(() => {
    if (containerWidth === 0) return;
    const toValue = selectedIndex * segmentWidth;
    if (!hasMounted.current) {
      // Snap to the right spot on first layout instead of sliding in from 0.
      translateX.setValue(toValue);
      hasMounted.current = true;
    } else {
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }).start();
    }
  }, [selectedIndex, containerWidth]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.track} onLayout={onLayout}>
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: segmentWidth - 4,
              backgroundColor: accentColor,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            style={styles.segment}
            onPress={() => onChange(opt.value)}
            hitSlop={4}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: "#EEF0F5",
    borderRadius: 14,
    padding: 2,
    height: 44,
    position: "relative",
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: 2,
    left: 2,
    bottom: 2,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
