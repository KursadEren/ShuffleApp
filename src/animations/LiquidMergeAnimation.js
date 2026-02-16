import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  Modal,
} from 'react-native';

const LiquidMergeAnimation = forwardRef(({ onComplete }, ref) => {
  const { width } = useWindowDimensions();
  const diceSize = Math.min(width * 0.3, 120);
  const dotSize = diceSize * 0.16;
  const bigDotSize = diceSize * 0.6;

  const [visible, setVisible] = useState(false);

  // Animation values for 5 dots
  const dot1Pos = useRef(new Animated.ValueXY({ x: -diceSize * 0.34, y: -diceSize * 0.34 })).current;
  const dot2Pos = useRef(new Animated.ValueXY({ x: diceSize * 0.34, y: -diceSize * 0.34 })).current;
  const dot3Pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dot4Pos = useRef(new Animated.ValueXY({ x: -diceSize * 0.34, y: diceSize * 0.34 })).current;
  const dot5Pos = useRef(new Animated.ValueXY({ x: diceSize * 0.34, y: diceSize * 0.34 })).current;

  const dotScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const centerDotScale = useRef(new Animated.Value(0)).current;
  const centerDotPulse = useRef(new Animated.Value(1)).current;
  const dotsOpacity = useRef(new Animated.Value(1)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  // Reset animation values
  const resetAnimationValues = () => {
    dot1Pos.setValue({ x: -diceSize * 0.34, y: -diceSize * 0.34 });
    dot2Pos.setValue({ x: diceSize * 0.34, y: -diceSize * 0.34 });
    dot3Pos.setValue({ x: 0, y: 0 });
    dot4Pos.setValue({ x: -diceSize * 0.34, y: diceSize * 0.34 });
    dot5Pos.setValue({ x: diceSize * 0.34, y: diceSize * 0.34 });
    dotScales.forEach(scale => scale.setValue(1));
    centerDotScale.setValue(0);
    centerDotPulse.setValue(1);
    dotsOpacity.setValue(1);
    backgroundOpacity.setValue(0);
  };

  // Expose play method through ref
  useImperativeHandle(ref, () => ({
    play: () => {
      resetAnimationValues();
      setVisible(true);
      runAnimation();
    },
  }));

  const runAnimation = () => {
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Create liquid flow animation for each dot
    const createLiquidFlow = (dotPos, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(dotPos.x, {
            toValue: 0,
            duration: 600,
            easing: Easing.bezier(0.68, -0.55, 0.27, 1.55),
            useNativeDriver: true,
          }),
          Animated.timing(dotPos.y, {
            toValue: 0,
            duration: 600,
            easing: Easing.bezier(0.68, -0.55, 0.27, 1.55),
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    // Dots shrink as they merge
    const shrinkDots = dotScales.map((scale, index) =>
      Animated.sequence([
        Animated.delay(index * 50),
        Animated.timing(scale, {
          toValue: 0,
          duration: 400,
          delay: 400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Run all liquid flow animations
    Animated.parallel([
      createLiquidFlow(dot1Pos, 0),
      createLiquidFlow(dot2Pos, 80),
      createLiquidFlow(dot3Pos, 160),
      createLiquidFlow(dot4Pos, 120),
      createLiquidFlow(dot5Pos, 40),
      ...shrinkDots,
      Animated.timing(dotsOpacity, {
        toValue: 0,
        duration: 300,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Center dot grows with bounce
    setTimeout(() => {
      Animated.spring(centerDotScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Pulse animation
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(centerDotPulse, {
              toValue: 1.2,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(centerDotPulse, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ).start(() => {
          // Fade out and complete
          Animated.timing(backgroundOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            resetAnimationValues();
            if (onComplete) {
              onComplete();
            }
          });
        });
      }, 200);
    }, 700);
  };

  if (!visible) return null;

  const dots = [
    { pos: dot1Pos, scale: dotScales[0] },
    { pos: dot2Pos, scale: dotScales[1] },
    { pos: dot3Pos, scale: dotScales[2] },
    { pos: dot4Pos, scale: dotScales[3] },
    { pos: dot5Pos, scale: dotScales[4] },
  ];

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: backgroundOpacity }]}>
        <View style={styles.animationContainer}>
          {/* Small dots that merge */}
          {dots.map((dot, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  opacity: dotsOpacity,
                  transform: [
                    { translateX: dot.pos.x },
                    { translateY: dot.pos.y },
                    { scale: dot.scale },
                  ],
                },
              ]}
            />
          ))}

          {/* Big center dot */}
          <Animated.View
            style={[
              styles.centerDot,
              {
                width: bigDotSize,
                height: bigDotSize,
                borderRadius: bigDotSize / 2,
                transform: [
                  {
                    scale: Animated.multiply(centerDotScale, centerDotPulse),
                  },
                ],
              },
            ]}
          />
        </View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  centerDot: {
    position: 'absolute',
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
});

export default LiquidMergeAnimation;
