import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useRef, useEffect } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MainScreen from "../screens/MainScreen";
import PreLearningScreen from "../screens/PreLearning";
import LeaderboardScreen from "../screens/Leaderboard";
import ProfileScreen from "../screens/Profile";
import { scaleSize, scaleFont } from "../constants/dimensions";
import { COLORS } from "../constants/colors";

const Tab = createBottomTabNavigator();

const AnimatedTabIcon = ({ focused, icon, label }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.2 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  }, [focused]);

  return (
    <View style={styles.tabItem}>
      <Animated.Image
        source={icon}
        style={[styles.icon, { transform: [{ scale: scaleAnim }] }]}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.label,
          { color: focused ? "#3BC64F" : "#4A4A4A" },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          flexDirection: "row",
          paddingHorizontal: scaleSize(20),
          backgroundColor: "#fff",
          paddingBottom: insets.bottom || scaleSize(6),
          height: scaleSize(64) + (insets.bottom || 0),
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarButton: (props) => {
          const { onPress, children } = props;
          return (
            <Pressable
              android_ripple={{ color: "transparent" }}
              onPress={onPress}
              style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            >
              {children}
            </Pressable>
          );
        },
        tabBarIcon: ({ focused }) => {
          let icon;
          let label;

          switch (route.name) {
            case "Главная":
              icon = focused
                ? require("../../assets/homegreen.png")
                : require("../../assets/home.png");
              label = "Главная";
              break;
            case "Учеба":
              icon = focused
                ? require("../../assets/bookgreen.png")
                : require("../../assets/book.png");
              label = "Учеба";
              break;
            case "Рейтинг":
              icon = focused
                ? require("../../assets/statsgreen.png")
                : require("../../assets/stats.png");
              label = "Рейтинг";
              break;
            case "Профиль":
              icon = focused
                ? require("../../assets/profilegreen.png")
                : require("../../assets/profile.png");
              label = "Профиль";
              break;
          }

          return <AnimatedTabIcon icon={icon} focused={focused} label={label} />;
        },
      })}
    >
      <Tab.Screen name="Главная" component={MainScreen} />
      <Tab.Screen name="Учеба" component={PreLearningScreen} />
      <Tab.Screen name="Рейтинг" component={LeaderboardScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    flex: 1,
  },
  icon: {
    width: scaleSize(24),
    height: scaleSize(24),
    marginBottom: scaleSize(1),
  },
  label: {
    fontSize: scaleFont(11),
    fontWeight: "500",
    minWidth: scaleSize(80),
    textAlign: "center",
    marginTop: scaleSize(4),
  },
});
