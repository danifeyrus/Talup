import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View
} from "react-native";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";

interface ProgressBarProps {
  xp: number;
  maxXp: number;
  level: number;
}

const AnimatedProgressBar: React.FC<ProgressBarProps> = ({ xp, maxXp, level }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: xp / maxXp,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [xp, maxXp]);

  const progressBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Уровень {level}</Text>

        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressFill, { width: progressBarWidth }]} />
        </View>

        <Text style={styles.xpText}>
          <Text style={styles.xpHighlight}>{xp} xp </Text>/ {maxXp} xp
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: scaleSize(16),
    paddingHorizontal: scaleSize(10),
  },
  levelContainer: {
    flex: 1,
  },
  levelText: {
    fontSize: scaleFont(16),
    fontWeight: "600",
    color: COLORS.text,
  },
  progressBackground: {
    height: scaleSize(12),
    backgroundColor: COLORS.progressBackground,
    borderRadius: scaleSize(6),
    marginTop: scaleSize(6),
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  xpText: {
    marginTop: scaleSize(4),
    fontSize: scaleFont(14),
    color: COLORS.textSecondary,
  },
  xpHighlight: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
});

export default AnimatedProgressBar;
