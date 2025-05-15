import React, { useEffect } from "react";
import {
    Animated,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity
} from "react-native";
import { COLORS } from "../constants/colors"; 
import { scaleFont } from "../constants/dimensions"; 

interface ErrorNotificationProps {
    message: string;
    onDismiss: () => void;
}

const ErrorNotification = ({ message, onDismiss }: ErrorNotificationProps) => {
    const fadeAnim = new Animated.Value(1);

    useEffect(() => {
        const timer = setTimeout(() => handleDismiss(), 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(onDismiss);
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <TouchableOpacity
                onPress={handleDismiss}
                activeOpacity={0.8}
                style={styles.content}
            >
                <Image
                    source={require("../../assets/warningwhite.png")}
                    style={styles.icon}
                />
                <Text style={styles.message}>{message}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: Platform.OS === "android" ? 40 : 60,
        left: 20,
        right: 20,
        backgroundColor: COLORS.danger,
        padding: 15,
        borderRadius: 10,
        zIndex: 1000,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 8,
    },
    message: {
        color: COLORS.white,
        fontSize: scaleFont(14),
        fontWeight: "400",
        flex: 1,
    },
});

export default ErrorNotification;
