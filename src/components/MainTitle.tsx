import { StyleSheet, Text, TextStyle } from "react-native";
import { COLORS } from "../constants/colors";
import { scaleFont } from "../constants/dimensions";

interface TitleProps {
    title: string;
    size: number;
    type?: "title" | "subtitle";
    align?: "left" | "center" | "right";
    lines?: number;
}

const Title = ({
    title,
    size,
    type = "title",
    align = "left",
    lines,
}: TitleProps) => {
    const textStyle: TextStyle = {
        fontSize: scaleFont(size),
        color: type === "title" ? COLORS.text : COLORS.subtitle,
        fontWeight: type === "title" ? "600" : "400",
        textAlign: align,
    };

    return (
        <Text
            style={[styles.base, textStyle]}
            numberOfLines={lines}
            ellipsizeMode="tail"
        >
            {title}
        </Text>
    );
};

const styles = StyleSheet.create({
    base: {
        marginBottom: 4,
    },
});

export default Title;
