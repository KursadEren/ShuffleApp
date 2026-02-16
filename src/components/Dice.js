import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Pressable, Animated, Easing } from 'react-native';

const Dice = forwardRef(({
  size,
  color = '#6C63FF',
  dotColor = '#FFFFFF',
  onPress,
  disabled = false,
  onMergeComplete,
}, ref) => {
  const { width } = useWindowDimensions();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isMerging, setIsMerging] = useState(false);

  const diceSize = size || Math.min(width * 0.25, 100);
  const dotSize = diceSize * 0.16;
  const dotOffset = diceSize * 0.16;
  const borderRadius = diceSize * 0.16;
  const bigDotSize = diceSize * 0.5;

  // Köşe noktalarının merkeze uzaklığı
  const cornerX = diceSize / 2 - dotOffset - dotSize / 2;
  const cornerY = diceSize / 2 - dotOffset - dotSize / 2;

  // 5 nokta için pozisyon animasyonları
  const dot1Pos = useRef(new Animated.ValueXY({ x: -cornerX, y: -cornerY })).current; // Sol üst
  const dot2Pos = useRef(new Animated.ValueXY({ x: cornerX, y: -cornerY })).current;  // Sağ üst
  const dot3Pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;               // Merkez
  const dot4Pos = useRef(new Animated.ValueXY({ x: -cornerX, y: cornerY })).current;  // Sol alt
  const dot5Pos = useRef(new Animated.ValueXY({ x: cornerX, y: cornerY })).current;   // Sağ alt

  // Nokta scale'leri
  const dotScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  // Büyük merkez nokta
  const centerDotScale = useRef(new Animated.Value(0)).current;
  const centerDotPulse = useRef(new Animated.Value(1)).current;

  // Zar opacity
  const diceOpacity = useRef(new Animated.Value(1)).current;

  // Sıfırlama
  const resetAnimation = () => {
    dot1Pos.setValue({ x: -cornerX, y: -cornerY });
    dot2Pos.setValue({ x: cornerX, y: -cornerY });
    dot3Pos.setValue({ x: 0, y: 0 });
    dot4Pos.setValue({ x: -cornerX, y: cornerY });
    dot5Pos.setValue({ x: cornerX, y: cornerY });
    dotScales.forEach(s => s.setValue(1));
    centerDotScale.setValue(0);
    centerDotPulse.setValue(1);
    diceOpacity.setValue(1);
    setIsMerging(false);
  };

  // Birleşme animasyonu
  const playMergeAnimation = () => {
    setIsMerging(true);

    // Sıvı akış
    const createFlow = (dotPos, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(dotPos.x, {
            toValue: 0,
            duration: 400,
            easing: Easing.bezier(0.68, -0.3, 0.27, 1.3),
            useNativeDriver: true,
          }),
          Animated.timing(dotPos.y, {
            toValue: 0,
            duration: 400,
            easing: Easing.bezier(0.68, -0.3, 0.27, 1.3),
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    // Küçülme
    const shrinkDots = dotScales.map((scale, i) =>
      Animated.timing(scale, {
        toValue: 0,
        duration: 300,
        delay: 200 + i * 15,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      })
    );

    // Zar arka planı fade out
    Animated.timing(diceOpacity, {
      toValue: 0,
      duration: 300,
      delay: 150,
      useNativeDriver: true,
    }).start();

    // Tüm noktalar birleşsin
    Animated.parallel([
      createFlow(dot1Pos, 0),
      createFlow(dot2Pos, 30),
      createFlow(dot5Pos, 15),
      createFlow(dot4Pos, 45),
      ...shrinkDots,
    ]).start();

    // Büyük nokta
    setTimeout(() => {
      Animated.spring(centerDotScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();

      // Nabız
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(centerDotPulse, {
              toValue: 1.15,
              duration: 350,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(centerDotPulse, {
              toValue: 1,
              duration: 350,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ).start(() => {
          // Bitince callback çağır ve sıfırla
          setTimeout(() => {
            resetAnimation();
            onMergeComplete?.();
          }, 200);
        });
      }, 100);
    }, 400);
  };

  // Dışarıdan erişim
  useImperativeHandle(ref, () => ({
    playMerge: playMergeAnimation,
    reset: resetAnimation,
  }));

  const handlePressIn = () => {
    if (!isMerging) {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isMerging) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const dots = [
    { pos: dot1Pos, scale: dotScales[0] },
    { pos: dot2Pos, scale: dotScales[1] },
    { pos: dot3Pos, scale: dotScales[2] },
    { pos: dot4Pos, scale: dotScales[3] },
    { pos: dot5Pos, scale: dotScales[4] },
  ];

  const DiceContent = (
    <View style={styles.diceWrapper}>
      {/* Zar arka planı */}
      <Animated.View
        style={[
          styles.dice,
          {
            width: diceSize,
            height: diceSize,
            borderRadius: borderRadius,
            backgroundColor: disabled ? '#D1D5DB' : color,
            opacity: diceOpacity,
          },
        ]}
      />

      {/* 5 nokta */}
      <View style={[styles.dotsContainer, { width: diceSize, height: diceSize }]}>
        {dots.map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: dotColor,
                transform: [
                  { translateX: dot.pos.x },
                  { translateY: dot.pos.y },
                  { scale: dot.scale },
                ],
              },
            ]}
          />
        ))}

        {/* Büyük merkez nokta (birleşince görünür) */}
        <Animated.View
          style={[
            styles.centerDot,
            {
              width: bigDotSize,
              height: bigDotSize,
              borderRadius: bigDotSize / 2,
              backgroundColor: color,
              transform: [
                { scale: Animated.multiply(centerDotScale, centerDotPulse) },
              ],
            },
          ]}
        />
      </View>
    </View>
  );

  if (onPress && !isMerging) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isMerging}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {DiceContent}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {DiceContent}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  diceWrapper: {
    position: 'relative',
  },
  dice: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  dotsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
  },
  centerDot: {
    position: 'absolute',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default Dice;
