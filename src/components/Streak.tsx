import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";
import { COLORS } from "../constants/colors";

const weekDays = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

const getDayText = (count: number) => {
  if (count === 0) return "0 дней";
  if (count === 1) return "1 день";
  if (count >= 2 && count <= 4) return `${count} дня`;
  return `${count} дней`;
};

const normalize = (d: string) => d.trim().toUpperCase();

const Streak = () => {
  const [checkedDays, setCheckedDays] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const todayISO = today.toISOString().split("T")[0];

  useEffect(() => {
    const loadAndUpdateStreak = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;

        const res = await fetch(`${API_URL}/api/streak`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) return;

        const filtered = (data.days || []).filter((d: string) => {
          const index = weekDays.indexOf(normalize(d));
          return index >= 0 && index <= todayIndex;
        });

        setCheckedDays(filtered);
        setStreakCount(data.streak || 0);

        await fetch(`${API_URL}/api/streak/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ lastLogin: todayISO }),
        });

      } catch (err) {
        console.error("Ошибка обновления стрика:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAndUpdateStreak();
  }, []);

  if (loading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.navContainer}>
        <Text style={styles.streakText}>Ударный режим</Text>
        <View style={styles.dayCount}>
          <Text style={styles.dayCountText}>{getDayText(streakCount)}</Text>
        </View>
      </View>

      <View style={styles.checksContainer}>
        {weekDays.map((day, index) => {
          const isToday = index === todayIndex;
          const isPast = checkedDays.includes(normalize(day));

          return (
            <View key={index} style={styles.dayWrapper}>
              <View
                style={[
                  styles.circle,
                  isToday
                    ? styles.present
                    : isPast
                    ? styles.past
                    : styles.future,
                ]}
              >
                {isToday && (
                  <Image
                    style={styles.check}
                    source={require("../../assets/checkGreen.png")}
                  />
                )}
                {isPast && !isToday && (
                  <Image
                    style={styles.check}
                    source={require("../../assets/checkWhite.png")}
                  />
                )}
              </View>
              <Text style={[styles.checkText, isToday && styles.todayText]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  navContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  streakText: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  dayCount: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayCountText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
  checksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayWrapper: {
    alignItems: "center",
  },
  checkText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 4,
  },
  todayText: {
    fontWeight: "bold",
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  past: {
    backgroundColor: "#53CD64",
  },
  present: {
    backgroundColor: "#FFFFFF",
  },
  future: {
    backgroundColor: COLORS.secondary,
  },
  check: {
    width: 24,
    height: 24,
  },
});

export default Streak;
