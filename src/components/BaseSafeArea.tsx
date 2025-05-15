import React from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { COLORS } from "../constants/colors";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  compact?: boolean;
}

const BaseSafeArea = ({ children, style, compact = false }: Props) => {
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={[styles.safe, style]}>
      <View
        style={[
          { flex: 1 },
          compact && {
            width: width * 0.9,
            alignSelf: "center",
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});

export default BaseSafeArea;
