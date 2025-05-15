import React, { useEffect, useState } from "react";
import { StyleSheet, View, Animated, Text, Image, Modal } from "react-native";
import BaseSafeArea from "../components/BaseSafeArea";
import TaskRenderer from "../components/TaskRenderer";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import BackButton from "../components/BackButton";
import { apiFetch, apiPost } from "../utils/api";
import Button from "../components/Button";

interface Task {
  id: string;
  word_id: number;
  sentence: string;
  correctAnswer: string;
  translation: string;
  difficulty: string;
  options: string[];
  originalSentence?: string;
  type?: string;
}

const LearningScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const navigation = useNavigation<any>();
  const progress = useState(new Animated.Value(0))[0];
  const [lives, setLives] = useState(5);
  const [prevLives, setPrevLives] = useState(5);
  const [lifeChange, setLifeChange] = useState<null | number>(null);
  const [showOutOfLivesModal, setShowOutOfLivesModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await apiFetch("/api/profile");
      const totalLives = (data.lives ?? 0) + (data.bonusLives ?? 0);
      setLives(totalLives);
    } catch (err) {
      console.error("Ошибка загрузки жизней:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchProfile();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lives !== prevLives) {
      const change = lives - prevLives;
      setLifeChange(change);
      setPrevLives(lives);

      setTimeout(() => setLifeChange(null), 1500);
    }
  }, [lives]);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data } = await apiFetch("/api/next-task");
        if (Array.isArray(data)) {
          setTasks(
            data.map((t) => ({
              ...t,
              correctAnswer: t.correct_answer.toLowerCase(),
              translationTarget: (t.translation_target || "").toLowerCase(),
              type: t.type,
              text: t.text || "",
              originalSentence: t.sentence.replace("___", t.correct_answer),
            }))
          );
        }
      } catch (error) {
        console.error("Ошибка при получении задания:", error);
      }
    };
    fetchTask();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      Animated.timing(progress, {
        toValue: currentIndex / tasks.length,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, tasks.length]);

  useFocusEffect(
    React.useCallback(() => {
      setShowOutOfLivesModal(false);
    }, [])
  );


  const handleAnswer = async (isCorrect: boolean) => {
    const currentTask = tasks[currentIndex];

    try {
      const response = await apiPost("/api/submit-result", {
        word_id: currentTask.word_id,
        success: isCorrect,
        task_type: currentTask.type,
      });

      if (response?.data?.lives !== undefined) {
        const total = (response.data.lives ?? 0) + (response.data.bonusLives ?? 0);
        setLives(total);
      } else {
        await fetchProfile();
      }

      const livesFromServer = response?.data?.lives ?? 0;
      const bonusLivesFromServer = response?.data?.bonusLives ?? 0;
      const totalLives = livesFromServer + bonusLivesFromServer;

      setLives(totalLives);

      if (totalLives <= 0) {
        setShowOutOfLivesModal(true);
        return;
      }

      if (isCorrect) setCorrectCount((prev) => prev + 1);

      if (currentIndex + 1 >= tasks.length) {
        setTimeout(() => navigation.navigate("MainScreen", { screen: "Учеба" }), 400);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Ошибка при отправке результата:", error);
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <BaseSafeArea compact>
      <View style={styles.headerWrapper}>
        <View style={styles.sideBox}>
          <BackButton destination="MainScreen" />
        </View>

        <View style={styles.progressWrapper}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <View style={styles.sideBox}>
          <Text style={{ fontSize: scaleFont(15), fontWeight: "600", color: COLORS.textSecondary, marginRight: scaleSize(4) }}>{lives}</Text>
          <Image source={require("../../assets/GreenHeart.png")} style={{ width: scaleSize(22), height: scaleSize(22), resizeMode: "contain" }} />
        </View>
      </View>

      {tasks[currentIndex] && (
        <TaskRenderer
          task={tasks[currentIndex]}
          onAnswer={handleAnswer}
          currentIndex={currentIndex}
          total={tasks.length}
        />
      )}

      <Modal visible={showOutOfLivesModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: scaleSize(16), padding: scaleSize(20), width: "80%", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 }}>
            <Text style={{ fontSize: scaleFont(20), fontWeight: "700", color: COLORS.primary, marginBottom: scaleSize(16), textAlign: "center" }}>
              У вас закончились жизни!
            </Text>
            <Button
              title="Вернуться"
              type="primary"
              onPress={() => {
                setShowOutOfLivesModal(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: "MainScreen", params: { screen: "Учеба" } }],
                });
              }}
            />
          </View>
        </View>
      </Modal>
    </BaseSafeArea>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scaleSize(14),
    width: "100%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  sideBox: {
    width: scaleSize(28),
    height: scaleSize(28),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrapper: {
    flex: 1,
    height: scaleSize(12),
    backgroundColor: COLORS.progressBackground,
    borderRadius: scaleSize(6),
    overflow: "hidden",
    marginVertical: scaleSize(4),
    marginHorizontal: scaleSize(8),
  },
});

export default LearningScreen;