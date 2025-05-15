import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import BaseSafeArea from "../components/BaseSafeArea";
import Button from "../components/Button";
import DailyGoal from "../components/DailyGoal";
import { API_URL } from "../constants/api";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import { getAvatarUrl } from "../utils/avatar";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

const HEADER_HEIGHT = scaleSize(80);

const PreLearningScreen = () => {
  const [learned, setLearned] = useState(0);
  const [learning, setLearning] = useState(0);
  const [userName, setUserName] = useState("Пользователь");
  const [avatar, setAvatar] = useState("");
  const [avatarTimestamp, setAvatarTimestamp] = useState(""); const [todayWords, setTodayWords] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [lives, setLives] = useState(5);
  const [nextLifeIn, setNextLifeIn] = useState("");
  const [nextLifeSeconds, setNextLifeSeconds] = useState(0);
  const [showLivesPopup, setShowLivesPopup] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardText, setRewardText] = useState("");


  const navigation = useNavigation<any>();
  const [dailyWord, setDailyWord] = useState({ word: "", translation: "" });
  const [showTranslation, setShowTranslation] = useState(false);

  const fetchStats = async () => {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.avatar !== avatar) {
        setAvatar(data.avatar);
        setAvatarTimestamp(`?t=${Date.now()}`);
      }
      setLearned(data.learnedWords || 0);
      setLearning(data.learningWords || 0);
      setTodayWords(data.todayLearnedWords || 0);
      setDailyGoal(data.dailyGoal || 10);
      setUserName(data.name || "Пользователь");
      setLives((data.lives ?? 5) + (data.bonusLives ?? 0));
      const today = new Date().toISOString().split("T")[0];

      const shownGoalToday = await AsyncStorage.getItem("dailyGoalRewardShown");

      if (
        data.todayLearnedWords >= data.dailyGoal &&
        data.lastDailyGoalReward !== today &&
        shownGoalToday !== today
      ) {
        setRewardText("Задание выполнено!\nТы получил +2 жизни");
        setShowRewardPopup(true);
      }

      if (data.lives < 5 && data.nextLifeInSeconds > 0) {
        setNextLifeSeconds(data.nextLifeInSeconds);
      } else {
        setNextLifeSeconds(0);
      }
    } catch (err) {
      console.log("Ошибка загрузки данных:", err);
    }
  };

  const fetchRandomWord = async () => {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/random-word`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.word && data.translation) {
        setDailyWord({
          word: data.word,
          translation: data.translation
        });
      }
    } catch (err) {
      console.log("Ошибка при загрузке случайного слова:", err);
    }
  };


  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNextLifeSeconds((prev) => {
        if (prev > 1) return prev - 1;
        if (prev === 1) {
          fetchStats();
          return 0;
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (nextLifeSeconds > 0) {
      const m = Math.floor(nextLifeSeconds / 60);
      const s = nextLifeSeconds % 60;
      setNextLifeIn(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    } else {
      setNextLifeIn("");
    }
  }, [nextLifeSeconds]);

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [])
  );

  useEffect(() => {
    fetchStats();
    fetchRandomWord();
  }, []);


  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <BaseSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Профиль")}>
          <Image source={getAvatarUrl(avatar + avatarTimestamp)} style={styles.avatar} />
        </TouchableOpacity>
        <View style={styles.nameWrapper}>
          <Text style={styles.title}>{userName}, начнем урок?</Text>
          <Text style={styles.subtitle}>Всё получится! (ง •̀‿•́)ง</Text>
        </View>
        <TouchableOpacity
          style={{ width: scaleSize(40), height: scaleSize(28), flexDirection: "row", alignItems: "center", justifyContent: "center" }}
          onPress={() => setShowLivesPopup(true)}
        >
          <Text style={{ fontSize: scaleFont(16), fontWeight: "600", color: COLORS.textSecondary, marginRight: scaleSize(4) }}>{lives}</Text>
          <Image
            source={require("../../assets/GreenHeart.png")}
            style={{ width: scaleSize(30), height: scaleSize(30), resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={showLivesPopup} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: scaleSize(16), padding: scaleSize(20), width: "80%", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 }}>
            <Text style={{ fontSize: scaleFont(20), fontWeight: "700", color: COLORS.primary, marginBottom: scaleSize(8) }}>
              У вас {lives} {lives === 1 ? "жизнь" : lives >= 2 && lives <= 4 ? "жизни" : "жизней"}
            </Text>
            {lives < 5 ? (
              <Text style={{ fontSize: scaleFont(14), color: COLORS.textSecondary, marginBottom: scaleSize(16) }}>
                Следующая жизнь через: {nextLifeIn}
              </Text>
            ) : (
              <Text style={{ fontSize: scaleFont(14), color: COLORS.textSecondary, marginBottom: scaleSize(16) }}>
                Все жизни!
              </Text>
            )}

            <Button title="Закрыть" type="primary" onPress={() => setShowLivesPopup(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={showRewardPopup} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
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
                await AsyncStorage.setItem("dailyGoalRewardShown", today);
              }}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <View style={styles.statsWrapper}>
          <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate("WordListScreen", { type: "learned" })}>
            <Text style={styles.statNumber}>{learned}</Text>
            <Text style={styles.statLabel}>Выучено</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate("WordListScreen", { type: "learning" })}>
            <Text style={styles.statNumber}>{learning}</Text>
            <Text style={styles.statLabel}>Изучаешь</Text>
          </TouchableOpacity>
        </View>

        <DailyGoal learnedWords={todayWords} goal={dailyGoal} />

        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowTranslation(!showTranslation)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitle}>Случайное слово</Text>
          <Text style={styles.cardWord}>
            {capitalize(showTranslation ? dailyWord.translation : dailyWord.word)}
          </Text>
          <Text style={styles.cardHint}>
            {showTranslation
              ? "Нажми, чтобы вернуть оригинал"
              : "Нажми, чтобы увидеть перевод"}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottom}>
          <Button
            title={lives > 0 ? "Начать урок" : "Нет жизней"}
            type={lives > 0 ? "primary" : "disabled"}
            onPress={() => {
              if (lives > 0) navigation.navigate("LearningScreen");
            }}
          />
        </View>
      </View>
    </BaseSafeArea>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scaleSize(16),
    height: HEADER_HEIGHT,
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
  avatar: {
    width: scaleSize(50),
    height: scaleSize(50),
    borderRadius: 12
  },
  nameWrapper: {
    flex: 1,
    marginLeft: scaleSize(12),
    justifyContent: "center",
  },
  title: {
    fontSize: scaleFont(16),
    fontWeight: "600",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: scaleFont(13),
    color: COLORS.textSecondary,
    marginTop: scaleSize(2),
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: scaleSize(30),
    paddingHorizontal: scaleSize(20),
    gap: scaleSize(20),
    paddingBottom: scaleSize(30),
    justifyContent: "flex-start",
  },
  statsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: scaleSize(12),
    backgroundColor: "#FAFAFA",
    padding: scaleSize(16),
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: scaleFont(20),
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: scaleFont(13),
    color: COLORS.textSecondary,
    marginTop: scaleSize(2),
  },
  divider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: scaleSize(8),
  },
  card: {
    backgroundColor: "#E7F8E9",
    borderRadius: scaleSize(12),
    padding: scaleSize(20),
    alignItems: "center",
    gap: scaleSize(6),
  },
  cardTitle: {
    fontSize: scaleFont(18),
    fontWeight: "600",
    color: COLORS.text,
  },
  cardWord: {
    fontSize: scaleFont(22),
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginTop: scaleSize(8),
  },
  cardHint: {
    fontSize: scaleFont(13),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: scaleSize(6),
  },
  bottom: {
    marginTop: "auto"
  },
});

export default PreLearningScreen;