import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../constants/colors";
import { scaleFont } from "../constants/dimensions";

interface LinkButtonProps {
    title: string;
    onPress?: () => void;
}

const LinkButton = ({ title, onPress }: LinkButtonProps) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="link"
            style={styles.linkWrapper}
        >
            <Text style={styles.buttonlink}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    linkWrapper: {
        alignSelf: "flex-start",
    },
    buttonlink: {
        color: COLORS.primary,
        fontWeight: "600",
        fontSize: scaleFont(14),
    },
});

export default LinkButton;
