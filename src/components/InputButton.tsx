import { useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";

const showIcon = require("../../assets/eye.png");
const hideIcon = require("../../assets/eyedisabled.png");

interface InputButtonProps {
    title?: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    isPassword?: boolean;
    maxLength?: number;
}

const InputButton = ({
    title,
    placeholder,
    value,
    onChangeText,
    isPassword = false,
    maxLength,
}: InputButtonProps) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleSecureEntry = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <View style={styles.inputContainer}>
            {title && <Text style={styles.inputLabel}>{title}</Text>}

            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.inputField}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.subtitle}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={isPassword && !showPassword}
                    maxLength={maxLength}
                    textContentType={isPassword ? "oneTimeCode" : "none"}
                    importantForAutofill="no"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {isPassword && (
                    <TouchableOpacity onPress={toggleSecureEntry} style={styles.icon}>
                        <Image
                            source={showPassword ? hideIcon : showIcon}
                            style={styles.iconImage}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        width: "100%",
        marginBottom: scaleSize(12),
    },
    inputLabel: {
        fontSize: scaleFont(14),
        color: COLORS.text,
        marginBottom: scaleSize(4),
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: scaleSize(8),
        backgroundColor: COLORS.white,
        paddingHorizontal: scaleSize(12),
        height: scaleSize(48),
    },

    inputField: {
        flex: 1,
        fontSize: scaleFont(14),
        paddingVertical: 0,
        paddingRight: scaleSize(8),
        color: COLORS.text,
    },

    icon: {
        padding: scaleSize(4),
    },

    iconImage: {
        width: scaleSize(26),
        height: scaleSize(26),
        tintColor: COLORS.textSecondary,
    },
});

export default InputButton;
