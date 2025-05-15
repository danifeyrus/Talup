import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";

interface CustomPickerProps {
  title?: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
}

const CustomPicker = ({ title, selectedValue, onValueChange, options }: CustomPickerProps) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const buttonRef = useRef<View>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, isAbove: false });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get("window").height;

  const showDropdown = () => {
    buttonRef.current?.measure((_fx, _fy, width, height, px, py) => {
      const spaceBelow = screenHeight - (py + height);
      const dropdownHeight = Math.min(options.length * 40, 200);
      const isAbove = spaceBelow < dropdownHeight + 10;
      setPosition({ top: isAbove ? py - dropdownHeight - 5 : py + height + 5, left: px, width, isAbove });
      setDropdownVisible(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    });
  };

  const hideDropdown = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => setDropdownVisible(false));
  };

  return (
    <View style={styles.inputContainer}>
      {title && <Text style={styles.inputLabel}>{title}</Text>}

      <TouchableOpacity
        ref={buttonRef}
        style={styles.pickerContainer}
        activeOpacity={0.7}
        onPress={showDropdown}
      >
        <Text style={[styles.pickerText, !selectedValue && styles.placeholderText]}>
          {options.find(option => option.value === selectedValue)?.label || "Выберите..."}
        </Text>
        <Ionicons name="chevron-down" size={scaleSize(20)} color={COLORS.text} />
      </TouchableOpacity>

      {dropdownVisible && (
        <Modal transparent animationType="fade" visible={dropdownVisible} onRequestClose={hideDropdown}>
          <TouchableOpacity style={styles.overlay} onPress={hideDropdown} />
          <Animated.View
            style={[
              styles.dropdown,
              { top: position.top, left: position.left, width: position.width, opacity: fadeAnim }
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onValueChange(item.value);
                    hideDropdown();
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    gap: scaleSize(4),
  },
  inputLabel: {
    fontSize: scaleFont(14),
    color: COLORS.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: scaleSize(10),
    paddingVertical: scaleSize(14),
    paddingHorizontal: scaleSize(16),
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: {
    fontSize: scaleFont(14),
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.subtitle,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  dropdown: {
    position: "absolute",
    backgroundColor: COLORS.white,
    borderRadius: scaleSize(8),
    paddingVertical: scaleSize(5),
    maxHeight: 200,
  },
  option: {
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(15),
  },
  optionText: {
    fontSize: scaleFont(16),
    color: COLORS.text,
  },
});

export default CustomPicker;
