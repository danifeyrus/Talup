import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";

interface DailyGoalCardProps {
  learnedWords: number;
  goal: number;
}

const SIZE = 100;
const STROKE_WIDTH = 8;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DailyGoalCard: React.FC<DailyGoalCardProps> = ({ learnedWords, goal }) => {
  const progress = goal > 0 ? learnedWords / goal : 0;
  const clampedProgress = Math.min(progress, 1);

  const animatedValue = useRef(new Animated.Value(clampedProgress)).current;
  const [percentage, setPercentage] = useState(Math.round(clampedProgress * 100));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clampedProgress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress]);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setPercentage(Math.round(value * 100));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, []);

  const animatedStrokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.card}>
      <View style={styles.chartContainer}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={COLORS.progressBackground}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={COLORS.white}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={animatedStrokeDashoffset}
            strokeLinecap="round"
            fill="none"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <Text style={styles.wordsText}>
        <Text style={styles.learned}>{Math.min(learnedWords, goal)}</Text> / {goal}
      </Text>
      <Text style={styles.caption}>Ежедневная цель</Text>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  card: {
    borderRadius: scaleSize(16),
    padding: scaleSize(20),
    alignItems: "center",
    backgroundColor: COLORS.primary,
    gap: scaleSize(8),
  },
  chartContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  percentage: {
    position: "absolute",
    fontSize: scaleFont(16),
    fontWeight: "bold",
    color: COLORS.white,
  },
  wordsText: {
    fontSize: scaleFont(18),
    fontWeight: "600",
    color: COLORS.white,
  },
  learned: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  caption: {
    fontSize: scaleFont(14),
    color: COLORS.white,
  },
});

export default DailyGoalCard;
