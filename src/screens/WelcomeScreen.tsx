import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Button from "../components/Button";
import SplashLoader from "../components/SplashLoader";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize, SCREEN } from "../constants/dimensions";
import { useTypedNavigation } from "../hooks/useTypedNavigation";

export default function Welcome() {
  const navigation = useTypedNavigation();
  const [showSplash, setShowSplash] = useState(true);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userToken = await AsyncStorage.getItem("userToken");

      if (userToken) {
        navigation.navigate("MainScreen");
      } else {
        setTimeout(() => {
          setShowSplash(false);
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();

          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 600,
            delay: 300,
            useNativeDriver: true,
          }).start();
        }, 1500);
      }
    };

    checkLoginStatus();
  }, [navigation]);

  if (showSplash) return <SplashLoader visible />;

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/WelcomeScreen.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <Animated.View style={[styles.sheet, { opacity: contentOpacity }]}>
        <View style={styles.innerContent}>
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>
              Добро пожаловать в <Text style={styles.highlight}>Talup</Text>
            </Text>
          </View>

          <Text style={styles.subtitle}>
            Взращивайте свои знания{"\n"}Казахского языка
          </Text>

          <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
            <Button title="Вход" type="primary" onPress={() => navigation.navigate("Login")} />
            <Button title="Регистрация" type="secondary" onPress={() => navigation.navigate("Registration")} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    minHeight: SCREEN.height * (SCREEN.height < 700 ? 0.6 : 0.55),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: scaleSize(32),
    borderTopRightRadius: scaleSize(32),
    paddingHorizontal: scaleSize(24),
    paddingVertical: scaleSize(20),
  },
  innerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: scaleSize(20),
  },
  titleWrapper: {
    maxWidth: SCREEN.isSmall ? "90%" : "80%",
    alignItems: "center",
  },
  title: {
    fontSize: scaleFont(SCREEN.isSmall ? 28 : 32),
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: scaleFont(36),
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: scaleFont(15),
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: scaleFont(20),
    paddingHorizontal: scaleSize(10),
  },
  buttonContainer: {
    width: "100%",
    gap: scaleSize(12),
    marginTop: scaleSize(12),
  },
});
