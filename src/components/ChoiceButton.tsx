import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";

interface ChoiceButtonProps {
  title: string;
  selected: boolean;
  onPress: () => void;
}

const ChoiceButton = ({ title, selected, onPress }: ChoiceButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        selected ? styles.buttonSelected : styles.buttonDefault,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textDefault,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(20),
    borderRadius: scaleSize(10),
    borderWidth: 1,
    alignSelf: "flex-start",
    flexGrow: 1,
    alignItems: "center",
  },
  buttonDefault: {
    backgroundColor: "transparent",
    borderColor: "#D9D9D9",
  },
  buttonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  text: {
    fontSize: scaleFont(16),
  },
  textDefault: {
    color: "#757575",
  },
  textSelected: {
    color: "#FFFFFF",
  },
});

export default ChoiceButton;
