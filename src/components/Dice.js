import { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Pressable, Animated } from 'react-native';

const Dice = ({
  size,
  color = '#6C63FF',
  dotColor = '#FFFFFF',
  onPress,
  disabled = false,
}) => {
  const { width } = useWindowDimensions();
  const [scaleAnim] = useState(new Animated.Value(1));

  const diceSize = size || Math.min(width * 0.25, 100);
  const dotSize = diceSize * 0.16;
  const dotOffset = diceSize * 0.16;
  const borderRadius = diceSize * 0.16;

  const dotStyle = {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: dotColor,
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const DiceContent = (
    <View
      style={[
        styles.dice,
        {
          width: diceSize,
          height: diceSize,
          borderRadius: borderRadius,
          backgroundColor: disabled ? '#D1D5DB' : color,
        },
      ]}>
      <View style={[styles.dot, dotStyle, { top: dotOffset, left: dotOffset }]} />
      <View style={[styles.dot, dotStyle, { top: dotOffset, right: dotOffset }]} />
      <View
        style={[
          styles.dot,
          dotStyle,
          {
            top: diceSize / 2 - dotSize / 2,
            left: diceSize / 2 - dotSize / 2,
          },
        ]}
      />
      <View style={[styles.dot, dotStyle, { bottom: dotOffset, left: dotOffset }]} />
      <View style={[styles.dot, dotStyle, { bottom: dotOffset, right: dotOffset }]} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {DiceContent}
        </Animated.View>
      </Pressable>
    );
  }

  return DiceContent;
};

const styles = StyleSheet.create({
  dice: {
    position: 'relative',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  dot: {
    position: 'absolute',
  },
});

export default Dice;
