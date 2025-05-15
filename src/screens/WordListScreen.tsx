import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";

import { API_URL } from "../constants/api";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import BackButton from "../components/BackButton";
import ScreenWrapper from "../components/ScreenWrapper";

const WordListScreen = () => {
  const [words, setWords] = useState<{ word: string; translation: string }[]>([]);
  const route = useRoute();
  const { type } = route.params as { type: "learned" | "learning" };

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await fetch(`${API_URL}/api/word-list?type=${type}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const formatted = data.map((item: any) => ({
          word: capitalize(item.word),
          translation: capitalize(item.translation_target || item.translation || "(нет перевода)"),
        }));
        setWords(formatted);
      } catch (err) {
        console.error("Ошибка загрузки слов:", err);
      }
    };

    fetchWords();
  }, [type]);

  const capitalize = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  return (
    <ScreenWrapper topPadding={20}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>
          {type === "learned" ? "Выученные слова" : "Изучаемые слова"}
        </Text>
        <View style={{ width: scaleSize(28) }} />
      </View>

      <FlatList
        data={words}
        keyExtractor={(item, index) => `${item.word}_${index}`}
        contentContainerStyle={
          words.length === 0 ? styles.emptyList : styles.list
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.wordCard}>
            <Text style={styles.word}>{item.word}</Text>
            <Text style={styles.translation}>{item.translation}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {type === "learned"
                ? "Ты ещё не выучил слова!"
                : "Ты ещё не изучаешь слова!"}
            </Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scaleSize(20),
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: "600",
    color: COLORS.text,
  },
  list: {
    paddingBottom: scaleSize(20),
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scaleSize(24),
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: scaleSize(40),
  },
  emptyText: {
    fontSize: scaleFont(16),
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  wordCard: {
    backgroundColor: "#FFF",
    borderRadius: scaleSize(12),
    paddingVertical: scaleSize(16),
    borderBottomWidth: 1,
    borderBottomColor: "#F6F6F6",
  },
  word: {
    fontSize: scaleFont(20),
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: scaleSize(4),
  },
  translation: {
    fontSize: scaleFont(16),
    color: COLORS.textSecondary,
  },
  separator: {
    height: scaleSize(12),
  },
});

export default WordListScreen;
