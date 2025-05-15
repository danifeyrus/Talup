import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";

interface ButtonProps {
    title: string;
    onPress?: () => void;
    type?: "primary" | "secondary";
    disabled?: boolean;
}

const ButtonLanguage = ({
    title,
    onPress,
    type = "primary",
    disabled,
}: ButtonProps) => {
    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#1D1B20",
        paddingVertical: scaleSize(16),
        paddingHorizontal: scaleSize(12),
        borderRadius: scaleSize(10),
        alignItems: "center",
        width: "100%",
    },
    text: {
        color: COLORS.white,
        fontSize: scaleFont(16),
    },
});

export default ButtonLanguage;
