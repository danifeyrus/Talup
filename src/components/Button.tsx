import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  type?: "primary" | "secondary" | "disabled";
  style?: ViewStyle;
}

const Button = ({ title, onPress, type = "primary", style }: ButtonProps) => {
  const isPrimary = type === "primary";
  const isSecondary = type === "secondary";
  const isDisabled = type === "disabled";
  const radius = scaleSize(10);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isDisabled}
      style={[styles.touchable, { borderRadius: radius }, style]}
    >
      {isPrimary && (
        <View style={[styles.button, { borderRadius: radius }]}>
          <Text style={styles.text}>{title}</Text>
        </View>
      )}

      {isSecondary && (
        <View style={[styles.buttonSecondary, { borderRadius: radius }]}>
          <Text style={styles.textSecondary}>{title}</Text>
        </View>
      )}

      {isDisabled && (
        <View style={[styles.buttonDisabled, { borderRadius: radius }]}>
          <Text style={styles.textDisabled}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: scaleSize(16),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderColor: COLORS.secondary,
    borderWidth: 1,
    paddingVertical: scaleSize(16),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonDisabled: {
    backgroundColor: COLORS.step,
    paddingVertical: scaleSize(16),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  text: {
    color: COLORS.white,
    fontSize: scaleFont(16),
    fontWeight: "600",
  },
  textSecondary: {
    color: COLORS.text,
    fontSize: scaleFont(16),
    fontWeight: "600",
  },
  textDisabled: {
    color: COLORS.textSecondary,
    fontSize: scaleFont(16),
    fontWeight: "600",
  },
});

export default Button;
