import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import BaseSafeArea from "../components/BaseSafeArea";
import AnimatedProgressBar from "../components/Progress";
import { API_URL } from "../constants/api";
import { COLORS } from "../constants/colors";
import { scaleSize } from "../constants/dimensions";
import { useTypedNavigation } from "../hooks/useTypedNavigation";
import { getAvatarUrl } from "../utils/avatar";
import { useFocusEffect } from "@react-navigation/native";
import { Linking } from "react-native";

const ProfileScreen = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    username: "",
    avatar: "",
    xp: 0,
    maxXp: 100,
    level: 1,
    currentLevel: "",
    aimLevel: "",
  });

  const navigation = useTypedNavigation();

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUserInfo({
          name: data.name,
          username: data.username,
          avatar: data.avatar,
          xp: data.xp,
          maxXp: data.maxXp,
          level: data.level,
          currentLevel: data.currentLevel || "",
          aimLevel: data.aimLevel || "",
        });
      } else {
        console.error("Ошибка профиля:", data.error);
      }
    } catch (error) {
      console.error("Ошибка получения профиля:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    setMenuVisible(false);
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  };

  const handleAvatarChange = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image`;

      const token = await AsyncStorage.getItem("userToken");
      const formData = new FormData();

      formData.append("avatar", {
        uri: localUri,
        name: filename,
        type,
      } as any);

      try {
        const uploadRes = await fetch(`${API_URL}/api/profile/update-avatar`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });

        const data = await uploadRes.json();

        if (uploadRes.ok && data.avatar) {
          setUserInfo((prev) => ({
            ...prev,
            avatar: data.avatar + `?t=${Date.now()}`,
          }));
        } else {
          Alert.alert("Ошибка", data.message || "Не удалось загрузить аватар");
        }
      } catch (err) {
        Alert.alert("Ошибка", "Не удалось подключиться к серверу");
      }
    }
  };

  const currentLevelText = {
    firsttime: "Начинаю с нуля",
    start: "Начальный",
    medium: "Средний",
    advanced: "Продвинутый",
  };

  const aimLevelText = {
    A: "Базовый",
    B: "Средний",
    C: "Продвинутый",
  };

  return (
    <BaseSafeArea compact>
      <View style={styles.header}>
        <Image source={getAvatarUrl(userInfo.avatar)} style={styles.avatar} />
        <Text style={styles.name}>{userInfo.name}</Text>
        <Text style={styles.username}>@{userInfo.username}</Text>
        <TouchableOpacity onPress={handleAvatarChange}>
          <Text style={styles.changeAvatarText}>Сменить аватар</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrapper}>
        <AnimatedProgressBar xp={userInfo.xp} maxXp={userInfo.maxXp} level={userInfo.level} />
      </View>

      <View style={styles.languageCard}>
        <View style={[styles.languageColumn,]}>
          <Ionicons name="bar-chart-outline" size={20} color={COLORS.primary} />
          <Text style={styles.languageLabel}>Уровень языка:</Text>
          <Text style={styles.languageValueStrong}>
            {currentLevelText[userInfo.currentLevel] || "-"}
          </Text>
        </View>

        <View style={styles.languageColumn}>
          <Ionicons name="flag-outline" size={20} color={COLORS.primary} />
          <Text style={styles.languageLabel}>Цель:</Text>
          <Text style={styles.languageValueStrong}>
            {aimLevelText[userInfo.aimLevel] || "-"}
          </Text>
        </View>
      </View>

      <View style={styles.menuDrawer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Settings")}
        >
          <Ionicons name="person-outline" size={22} color={COLORS.text} />
          <Text style={styles.menuTextDrawer}>Аккаунт</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.text} />
          <Text style={styles.menuTextDrawer}>Настройки</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Linking.openURL("https://t.me/danifeyrus").catch(() =>
              Alert.alert("Ошибка", "Не удалось открыть ссылку")
            )
          }
        >
          <Ionicons name="help-circle-outline" size={22} color={COLORS.text} />
          <Text style={styles.menuTextDrawer}>Помощь</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          <Text style={[styles.menuTextDrawer, { color: COLORS.danger }]}>Выйти</Text>
        </TouchableOpacity>
      </View>


    </BaseSafeArea>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: scaleSize(20)
  },
  avatar: {
    width: scaleSize(124),
    height: scaleSize(124),
    borderRadius: 20,
    marginBottom: scaleSize(10),
  },
  changeAvatarText: {
    color: COLORS.primary,
    marginTop: scaleSize(10),
  },
  name: {
    fontSize: scaleSize(28),
    fontWeight: "bold",
  },
  username: {
    fontSize: scaleSize(16),
    color: COLORS.textSecondary,
  },
  infoCard: {
    padding: scaleSize(12),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(8),
  },
  infoText: {
    fontSize: scaleSize(14),
    marginLeft: scaleSize(8),
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    gap: scaleSize(20),
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    width: scaleSize(280),
    borderRadius: scaleSize(20),
    paddingVertical: scaleSize(14),
    alignItems: "stretch",
    gap: scaleSize(6),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(10),
    borderRadius: scaleSize(12),
    gap: scaleSize(12),
  },
  menuText: {
    fontSize: scaleSize(16),
    fontWeight: "500",
    color: COLORS.text,
  },
  menuIcon: {
    width: scaleSize(24),
    height: scaleSize(24),
    resizeMode: "contain",
  },
  progressWrapper: {
    marginVertical: scaleSize(16),
    backgroundColor: COLORS.white
  },
  languageCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: scaleSize(24),
    paddingVertical: scaleSize(18),
    marginBottom: scaleSize(16),
  },
  separator: {
    width: 1,
    backgroundColor: COLORS.divider,
    marginVertical: scaleSize(8),
  },
  languageValue: {
    fontSize: scaleSize(15),
    color: COLORS.text,
    fontWeight: "600",
    marginTop: scaleSize(2),
    textAlign: "center",
  },
  languageColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleSize(8),
    gap: scaleSize(4),
  },

  languageLabel: {
    fontSize: scaleSize(13),
    color: COLORS.textSecondary,
  },

  languageValueStrong: {
    fontSize: scaleSize(16),
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  menuDrawer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    paddingVertical: scaleSize(20),
    paddingHorizontal: scaleSize(16),
    gap: scaleSize(8),
  },

  menuTextDrawer: {
    fontSize: scaleSize(16),
    fontWeight: "500",
    color: COLORS.text
  },

});

export default ProfileScreen;
