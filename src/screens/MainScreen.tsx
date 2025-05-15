import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BaseSafeArea from "../components/BaseSafeArea";
import KazakhQuote from "../components/KazakhQuote";
import Title from "../components/MainTitle";
import Streak from "../components/Streak";
import { API_URL } from "../constants/api";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import { getAvatarUrl } from "../utils/avatar";
import Button from "../components/Button";

const HEADER_HEIGHT = scaleSize(80);
const IMAGE_HEIGHT = scaleSize(375);

const treeImages = {
  1: require("../../assets/tree/1.png"),
  2: require("../../assets/tree/2.png"),
  3: require("../../assets/tree/3.png"),
  4: require("../../assets/tree/4.png"),
  5: require("../../assets/tree/5.png"),
  6: require("../../assets/tree/6.png"),
};

const MainScreen = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation<any>();

  const [userName, setUserName] = useState("Пользователь");
  const [userAvatar, setUserAvatar] = useState("");
  const [treePhase, setTreePhase] = useState(1);
  const [treePhaseProgress, setTreePhaseProgress] = useState(0);
  const [lives, setLives] = useState(5);
  const [prevTreePhase, setPrevTreePhase] = useState(treePhase);
  const [todayWords, setTodayWords] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardText, setRewardText] = useState("");

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: treePhaseProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [treePhaseProgress]);

  useEffect(() => {
    const listener = animatedProgress.addListener(({ value }) => {
      setAnimatedPercent(Math.round(100 - value));
    });

    return () => {
      animatedProgress.removeListener(listener);
    };
  }, []);

  const getPhaseName = (phase: number) => {
    switch (phase) {
      case 1: return "Росток";
      case 2: return "Саженец";
      case 3: return "Молодое дерево";
      case 4: return "Зрелое дерево";
      case 5: return "Могучее дерево";
      case 6: return "Высшее дерево";
      default: return "Росток";
    }
  };

  const loadUserInfo = useCallback(async () => {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return;

    try {
      const today = new Date().toISOString().split("T")[0];

      await fetch(`${API_URL}/api/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await fetch(`${API_URL}/api/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setUserName(data.name || "Пользователь");
        setUserAvatar(data.avatar);
        setTreePhase(data.treePhase || 1);
        setTreePhaseProgress(data.treePhaseProgress || 0);

        const totalLives = (data.lives ?? 0) + (data.bonusLives ?? 0);
        setLives(totalLives);
        const shownToday = await AsyncStorage.getItem("streakRewardShown");

        if (
          data.streak >= 3 &&
          data.streak % 2 === 1 &&
          data.lastStreakReward !== today &&
          shownToday !== today
        ) {
          setRewardText(`${data.streak} дней подряд!\nТы получил +2 жизни`);
          setShowRewardPopup(true);
        }
        setTodayWords(data.todayLearnedWords || 0);
        setDailyGoal(data.dailyGoal || 10);
      } else {
        console.log("Ошибка профиля:", data.message);
      }
    } catch (err) {
      console.log("Ошибка загрузки профиля:", err);
    }
  }, []);


  useEffect(() => {
    loadUserInfo();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
    }, [loadUserInfo])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadUserInfo();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (treePhase !== prevTreePhase) {
      setPrevTreePhase(treePhase);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [treePhase]);

  const imageTranslate = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT],
    outputRange: [0, -IMAGE_HEIGHT / 6],
    extrapolate: "clamp",
  });

  return (
    <BaseSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Профиль")}>
          <Image style={styles.avatar} source={getAvatarUrl(userAvatar)} />
        </TouchableOpacity>
        <View style={styles.namelevel}>
          <Title title={`Привет, ${userName}!`} size={16} />
          <Title
            title={`Уровень дерева: ${getPhaseName(treePhase)}`}
            size={12}
            type="subtitle"
          />
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate("Shop")}>
          <Image style={styles.notification} source={require("../../assets/shop.png")} />
        </TouchableOpacity>

      </View>

      <Animated.Image
        style={[
          styles.parallaxImage,
          { transform: [{ translateY: imageTranslate }], opacity: fadeAnim },
        ]}
        source={treeImages[treePhase]}
        resizeMode="cover"
      />

      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: scaleSize(345) }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.content}>
          <View style={styles.progressWrapper}>
            <View style={styles.progressBlock}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: animatedProgress.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                До следующего уровня:{" "}
                <Text style={styles.progressHighlight}>{animatedPercent}%</Text>
              </Text>
            </View>
          </View>

          <Streak />

          <KazakhQuote></KazakhQuote>

        </View>
      </ScrollView>
      {showRewardPopup && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: scaleSize(16), padding: scaleSize(20), width: "80%", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 }}>
            {rewardText.split("\n").map((line, index) => (
              <Text
                key={index}
                style={
                  index === 0
                    ? { fontSize: scaleFont(20), fontWeight: "700", color: COLORS.primary, marginBottom: scaleSize(4), textAlign: "center" }
                    : { fontSize: scaleFont(14), color: COLORS.textSecondary, marginBottom: scaleSize(16), textAlign: "center" }
                }
              >
                {line}
              </Text>
            ))}
            <Button
              title="Ура!"
              type="primary"
              onPress={async () => {
                setShowRewardPopup(false);
                const today = new Date().toISOString().split("T")[0];
                await AsyncStorage.setItem("streakRewardShown", today);
              }}
            />
          </View>
        </View>
      )}

    </BaseSafeArea>
  );
};

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scaleSize(16),
    backgroundColor: COLORS.white,
    zIndex: 2,
  },
  avatar: {
    width: scaleSize(50),
    height: scaleSize(50),
    borderRadius: scaleSize(12),
  },
  namelevel: {
    flex: 1,
    marginLeft: scaleSize(10),
  },
  notificationButton: {
    width: scaleSize(48),
    height: scaleSize(48),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scaleSize(12),
    backgroundColor: "#FAFAFA",
  },
  notification: {
    width: scaleSize(30),
    height: scaleSize(30),
    resizeMode: "contain",
  },
  parallaxImage: {
    width: "100%",
    height: IMAGE_HEIGHT,
    position: "absolute",
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
  },
  progressWrapper: {
    alignItems: "center",
    marginTop: -scaleSize(48),
    zIndex: 10,
  },
  progressBlock: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: scaleSize(16),
    paddingVertical: scaleSize(20),
    paddingHorizontal: scaleSize(16),
    borderWidth: 2,
    borderColor: "#FAFAFA",
  },
  progressBar: {
    height: scaleSize(12),
    borderRadius: scaleSize(6),
    backgroundColor: COLORS.progressBackground,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  progressText: {
    marginTop: scaleSize(8),
    fontSize: scaleFont(14),
    textAlign: "center",
    color: COLORS.textSecondary,
  },
  progressHighlight: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(24),
    paddingBottom: scaleSize(24),
    backgroundColor: COLORS.white,
    borderRadius: scaleSize(16),
    gap: scaleSize(24),
  },
});

export default MainScreen;
