import React from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableWithoutFeedback,
    useWindowDimensions,
    View,
    ViewStyle,
} from "react-native";
import ErrorNotification from "./Error";
import { scaleSize } from "../constants/dimensions";

type Props = {
    children: React.ReactNode;
    scrollable?: boolean;
    compact?: boolean;
    center?: boolean;
    errorMessage?: string;
    onDismissError?: () => void;
    topPadding?: number;
};

const ScreenWrapper: React.FC<Props> = ({
    children,
    scrollable = false,
    compact = false,
    center = false,
    errorMessage,
    onDismissError,
    topPadding
}) => {
    const { width, height } = useWindowDimensions();

    const containerStyle: ViewStyle = {
        paddingTop: topPadding !== undefined ? topPadding : scaleSize(40),
        paddingBottom: scaleSize(40),
        width: width * 0.85,
        alignSelf: "center",
        ...(center && {
            justifyContent: "center",
            alignItems: "center",
            minHeight: height - 80,
        }),
    };
    

    return (
        <View style={{ flex: 1, position: "relative" }}>
            {errorMessage && onDismissError && (
                <ErrorNotification message={errorMessage} onDismiss={onDismissError} />
            )}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0}
            >
                <SafeAreaView style={styles.safe}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        {scrollable ? (
                            <ScrollView
                                contentContainerStyle={[containerStyle]}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {children}
                            </ScrollView>
                        ) : (
                            <View style={[styles.viewContent, containerStyle]}>{children}</View>
                        )}
                    </TouchableWithoutFeedback>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    viewContent: {
        flex: 1,
    },
});

export default ScreenWrapper;