import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';

const LiquidMergeAnimation = forwardRef(({ onComplete }, ref) => {
  const { width, height } = useWindowDimensions();

  // Zar boyutları (Dice.js ile aynı)
  const diceSize = Math.min(width * 0.3, 120);
  const dotSize = diceSize * 0.16;
  const dotOffset = diceSize * 0.16;

  // Büyük merkez nokta boyutu
  const bigDotSize = diceSize * 0.6;

  // Ekran merkezi
  const screenCenterX = width / 2;
  const screenCenterY = height / 2 - 50; // Biraz yukarıda (zar pozisyonu)

  const [visible, setVisible] = useState(false);

  // 5 nokta için animasyon değerleri
  // Başlangıç pozisyonları (zar üzerindeki gerçek pozisyonlar)
  const getInitialPositions = () => {
    const halfDice = diceSize / 2;
    const dotHalf = dotSize / 2;

    return {
      // Sol üst köşe
      dot1: {
        x: screenCenterX - halfDice + dotOffset + dotHalf,
        y: screenCenterY - halfDice + dotOffset + dotHalf
      },
      // Sağ üst köşe
      dot2: {
        x: screenCenterX + halfDice - dotOffset - dotHalf,
        y: screenCenterY - halfDice + dotOffset + dotHalf
      },
      // Merkez
      dot3: {
        x: screenCenterX,
        y: screenCenterY
      },
      // Sol alt köşe
      dot4: {
        x: screenCenterX - halfDice + dotOffset + dotHalf,
        y: screenCenterY + halfDice - dotOffset - dotHalf
      },
      // Sağ alt köşe
      dot5: {
        x: screenCenterX + halfDice - dotOffset - dotHalf,
        y: screenCenterY + halfDice - dotOffset - dotHalf
      },
    };
  };

  const positions = getInitialPositions();

  // Her nokta için pozisyon animasyonları
  const dot1Pos = useRef(new Animated.ValueXY(positions.dot1)).current;
  const dot2Pos = useRef(new Animated.ValueXY(positions.dot2)).current;
  const dot3Pos = useRef(new Animated.ValueXY(positions.dot3)).current;
  const dot4Pos = useRef(new Animated.ValueXY(positions.dot4)).current;
  const dot5Pos = useRef(new Animated.ValueXY(positions.dot5)).current;

  // Her nokta için scale
  const dotScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  // Merkez büyük nokta
  const centerDotScale = useRef(new Animated.Value(0)).current;
  const centerDotPulse = useRef(new Animated.Value(1)).current;

  // Opaklıklar
  const dotsOpacity = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Sıfırlama
  const resetAnimationValues = () => {
    const pos = getInitialPositions();
    dot1Pos.setValue(pos.dot1);
    dot2Pos.setValue(pos.dot2);
    dot3Pos.setValue(pos.dot3);
    dot4Pos.setValue(pos.dot4);
    dot5Pos.setValue(pos.dot5);
    dotScales.forEach(scale => scale.setValue(1));
    centerDotScale.setValue(0);
    centerDotPulse.setValue(1);
    dotsOpacity.setValue(1);
    overlayOpacity.setValue(0);
  };

  useImperativeHandle(ref, () => ({
    play: () => {
      resetAnimationValues();
      setVisible(true);
      runAnimation();
    },
  }));

  const runAnimation = () => {
    // Overlay fade in
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    // Hedef pozisyon (ekran merkezi)
    const target = { x: screenCenterX, y: screenCenterY };

    // Sıvı akış animasyonu
    const createLiquidFlow = (dotPos, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(dotPos.x, {
            toValue: target.x,
            duration: 450,
            easing: Easing.bezier(0.68, -0.3, 0.27, 1.3),
            useNativeDriver: true,
          }),
          Animated.timing(dotPos.y, {
            toValue: target.y,
            duration: 450,
            easing: Easing.bezier(0.68, -0.3, 0.27, 1.3),
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    // Noktalar küçülsün
    const shrinkDots = dotScales.map((scale, index) =>
      Animated.timing(scale, {
        toValue: 0,
        duration: 350,
        delay: 250 + index * 20,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      })
    );

    // Animasyonları başlat
    Animated.parallel([
      createLiquidFlow(dot1Pos, 0),
      createLiquidFlow(dot2Pos, 40),
      createLiquidFlow(dot5Pos, 20),
      createLiquidFlow(dot4Pos, 60),
      // dot3 zaten merkezde, sadece scale olacak
      ...shrinkDots,
      Animated.timing(dotsOpacity, {
        toValue: 0,
        duration: 150,
        delay: 400,
        useNativeDriver: true,
      }),
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
              toValue: 1.2,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(centerDotPulse, {
              toValue: 1,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ).start(() => {
          // Fade out ve kapat
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            resetAnimationValues();
            onComplete?.();
          });
        });
      }, 100);
    }, 450);
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
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* 5 nokta - absolute pozisyonlu */}
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
                { translateX: Animated.subtract(dot.pos.x, dotSize / 2) },
                { translateY: Animated.subtract(dot.pos.y, dotSize / 2) },
                { scale: dot.scale },
              ],
            },
          ]}
        />
      ))}

      {/* Büyük merkez nokta */}
      <Animated.View
        style={[
          styles.centerDot,
          {
            width: bigDotSize,
            height: bigDotSize,
            borderRadius: bigDotSize / 2,
            left: screenCenterX - bigDotSize / 2,
            top: screenCenterY - bigDotSize / 2,
            transform: [
              { scale: Animated.multiply(centerDotScale, centerDotPulse) },
            ],
          },
        ]}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
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
