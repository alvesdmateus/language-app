import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface TooltipProps {
  text: string;
  visible: boolean;
  x: number;
  y: number;
}

const Tooltip: React.FC<TooltipProps> = ({ text, visible, x, y }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const screenWidth = Dimensions.get('window').width;
  const tooltipWidth = 250;
  const padding = 20;

  // Calculate position to keep tooltip on screen
  let left = x - tooltipWidth / 2;
  if (left < padding) left = padding;
  if (left + tooltipWidth > screenWidth - padding) {
    left = screenWidth - tooltipWidth - padding;
  }

  return (
    <Animated.View
      style={[
        styles.tooltip,
        {
          opacity,
          transform: [{ scale }],
          position: 'absolute',
          left,
          top: y - 70, // Position above the highlighted word
        },
      ]}
    >
      <View style={styles.tooltipContainer}>
        <Text style={styles.tooltipText}>{text}</Text>
      </View>
      <View style={styles.tooltipArrow} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    zIndex: 1000,
  },
  tooltipContainer: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2C3E50',
    alignSelf: 'center',
    marginTop: -1,
  },
});

export default Tooltip;
