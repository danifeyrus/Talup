import { Audio } from 'expo-av';
import * as FileSystem from "expo-file-system";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import { apiUpload } from '../utils/wav';
import Button from "./Button";

interface Task {
  word_id: number;
  sentence: string;
  correctAnswer: string;
  translation: string;
  difficulty: string;
  options: string[];
  id?: string;
  originalSentence?: string;
  translationTarget?: string;
  type?: string;
  text?: string;
  [key: string]: any;
}

const peopleImages = [
  require("../../assets/people/boy.jpg"),
  require("../../assets/people/girl.jpg"),
  require("../../assets/people/woman.jpg"),
  require("../../assets/people/man.jpg"),
];

const micIcon = require("../../assets/microphone.png");
const stopIcon = require("../../assets/stop.png");

interface Props {
  task: Task;
  onAnswer: (correct: boolean) => void;
  currentIndex: number;
  total: number;
}

const TaskRenderer: React.FC<Props> = ({ task, onAnswer, currentIndex, total }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [constructed, setConstructed] = useState<string[]>([]);
  const opacity = useRef(new Animated.Value(0)).current;
  const [personImage, setPersonImage] = useState(() =>
    peopleImages[Math.floor(Math.random() * peopleImages.length)]
  );

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedURI, setRecordedURI] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<'correct' | 'incorrect' | null>(null);
  const [canCheck, setCanCheck] = useState(false);
  const [isLockedAfterCheck, setIsLockedAfterCheck] = useState(false);

  const startRecording = async () => {
    if (isLockedAfterCheck) return;
    setAnswered(false);
    setCheckResult(null);

    try {
      setRecordedURI(null);
      setCheckResult(null);
      setCanCheck(false);
      setAnswered(false);

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
    } catch (err) {
      console.error("Ошибка при старте записи:", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      const isActuallyRecording = await recording.getStatusAsync();
      if (!isActuallyRecording.isRecording) {
        console.warn("[MIC] Попытка остановить неактивную запись");
        return;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedURI(uri);
      setCanCheck(true);
      setRecording(null);
      console.log("Аудио сохранено в:", uri);
    } catch (err) {
      console.error("Ошибка при остановке записи:", err);
    }
  };

  const checkRecording = async () => {
    if (isLockedAfterCheck) return;
    if (!recordedURI) {
      return;
    }

    console.log(`[ASR] Отправка аудио: ${recordedURI}`);
    console.log(`[ASR] Текст для проверки: "${task.text?.slice(0, 50)}"`);
    try {
      const fileInfo = await FileSystem.getInfoAsync(recordedURI);
      if (!fileInfo.exists) {
        return;
      }

      const formData = new FormData();
      formData.append("file", {
        uri: fileInfo.uri,
        name: "audio.m4a",
        type: "audio/mp4",
      } as any);
      formData.append("expected", task.text?.toLowerCase()?.trim() ?? "");

      const { response, data } = await apiUpload("/api/asr-submit", formData);
      console.log(`[ASR] Server response: ${response?.status} | Correct: ${data?.correct}`);
      const isCorrect = data?.correct;
      setCheckResult(isCorrect ? "correct" : "incorrect");
      setAnswered(true);
      setCanCheck(false);
      setIsLockedAfterCheck(true);
    } catch (error) {
      console.error("[ASR] Ошибка при отправке аудио:", error);
    }
  };

  const normalize = (str: string) =>
    str.replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

  const isCorrect = useMemo(() => {
    const userAnswer =
      task.type === "sentence_shuffle"
        ? constructed.join(" ")
        : selected || "";
    return normalize(userAnswer) === normalize(task.correctAnswer || "");
  }, [constructed, selected, task]);

  const renderSentence = (sentence: string) => {
    const parts = sentence.split("___");

    return (
      <Text style={styles.cardSentence}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <Text>{part}</Text>
            {index !== parts.length - 1 && (
              <Text style={styles.maskedWord}>...</Text>
            )}
          </React.Fragment>
        ))}
      </Text>
    );
  };


  useEffect(() => {
    setSelected(null);
    setAnswered(false);
    setConstructed([]);
    setCheckResult(null);
    setPersonImage(peopleImages[Math.floor(Math.random() * peopleImages.length)]);
    setRecordedURI(null);
    setIsLockedAfterCheck(false);
    setCanCheck(false);
    setRecording(null);
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [task.id]);

  const handleSelect = (option: string) => {
    if (answered) return;
    if (task.type === "sentence_shuffle") {
      if (!constructed.includes(option)) {
        setConstructed([...constructed, option]);
      }
    } else {
      setSelected(option);
    }
  };

  const handleRemoveWord = (word: string) => {
    if (answered) return;
    setConstructed(constructed.filter((w, i) => i !== constructed.indexOf(word)));
  };

  const handleContinue = async () => {

    if (task.type === 'asr_reading') {
      if (!checkResult) return;
      onAnswer(checkResult === 'correct');
      setAnswered(false);
      setCheckResult(null);
      return;
    }
    else {
      if (!answered) {
        setAnswered(true);
      } else {
        onAnswer(isCorrect);
        setAnswered(false);
      }
    }
  };

  const filteredOptions = (task.options ?? [])
    .map((opt) => opt.trim())
    .filter((opt, idx, self) => opt && self.indexOf(opt) === idx);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={personImage}
          style={styles.illustration}
          resizeMode="cover"
        />

        {task.type === "asr_reading" ? (
          <View style={[
            styles.card,
            checkResult === "correct" && styles.correct,
            checkResult === "incorrect" && styles.incorrect
          ]}>
            <Text style={[
              styles.cardTitle,
              checkResult === 'incorrect' && styles.incorrectText
            ]}>
              Прочитайте вслух:
            </Text>
            <Text style={styles.cardSentence}>{task.text}</Text>

            {recordedURI && !recording && (
              <Text style={styles.micHint}>Нажмите "Проверить", чтобы получить результат</Text>
            )}

            {checkResult && (
              <Text style={{
                textAlign: 'center',
                color: checkResult === 'correct' ? 'green' : 'red',
                fontWeight: '600',
                marginTop: scaleSize(10),
              }}>
                {checkResult === 'correct' ? 'Правильно!' : 'Неправильно.'}
              </Text>
            )}
          </View>
        ) : (
          <>
            <View
              style={[
                styles.card,
                answered && isCorrect && styles.correct,
                answered && !isCorrect && styles.incorrect
              ]}
            >
              {task.type === "word_translation" ? (
                <>
                  <Text style={[
                    styles.cardTitle,
                    answered && !isCorrect && styles.incorrectText
                  ]}>
                    Переведите слово:
                  </Text>
                  <Text style={styles.bigWord}>
                    {task.translationTarget || task["translation_target"] || ""}
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.cardTitle,
                    answered && !isCorrect && styles.incorrectText
                  ]}
                >
                  {task.type === "sentence_shuffle"
                    ? "Переведите предложение:"
                    : "Выберите правильное слово:"}
                  {" "}
                  {task.type !== "sentence_shuffle" && (
                    <Text style={styles.highlight}>
                      {task.translationTarget || task["translation_target"] || ""}
                    </Text>
                  )}
                </Text>
              )}

              {task.type !== "word_translation" && (
                <Text style={styles.cardSentence}>
                  {task.type === "sentence_shuffle"
                    ? task.translation
                    : renderSentence(task.sentence)}
                </Text>
              )}

              {task.type === "sentence_shuffle" && (
                <View style={styles.sentenceWrapper}>
                  {constructed.map((word, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleRemoveWord(word)}
                      style={[styles.chip, answered && !isCorrect && styles.chipIncorrect]}
                    >
                      <Text style={styles.chipText}>{word}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {task.type === "sentence_shuffle" ? (
              <View style={styles.sentenceWrapper}>
                {filteredOptions
                  .filter((opt) => !constructed.includes(opt))
                  .map((option, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSelect(option)}
                      disabled={answered}
                      style={[
                        styles.chip,
                        answered && !isCorrect && styles.chipIncorrect,
                      ]}
                    >
                      <Text style={styles.chipText}>{option.toLowerCase()}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <View style={styles.optionsWrapper}>
                {filteredOptions.map((option, idx) => {
                  const isSelected =
                    selected?.trim().toLowerCase() === option.trim().toLowerCase();
                  const isThisCorrect =
                    task.correctAnswer?.trim().toLowerCase() === option.trim().toLowerCase();

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.option,
                        !answered && isSelected && styles.optionSelected,
                        answered && isSelected && (isThisCorrect ? styles.correct : styles.incorrect),
                      ]}
                      onPress={() => handleSelect(option)}
                      activeOpacity={0.85}
                      disabled={answered}
                    >
                      <Text style={styles.optionText}>{option.toLowerCase()}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {answered && (
              <View style={styles.answerCard}>
                <Text style={styles.cardTitle}>Правильный ответ:</Text>
                <Text style={styles.cardSentence}>
                  {task.correctAnswer?.trim().charAt(0).toUpperCase() + task.correctAnswer?.trim().slice(1) || "(пусто)"}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {task.type === "asr_reading" && (
        <View style={styles.micButtonWrapper}>
          <TouchableOpacity
            onPress={recording ? stopRecording : startRecording}
            disabled={isLockedAfterCheck}
            style={[
              styles.micButton,
              recording && styles.micButtonActive,
              isLockedAfterCheck && styles.micButtonDisabled
            ]}
          >
            <Image source={recording ? stopIcon : micIcon} style={styles.micIcon} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonWrapper}>
        {task.type === "asr_reading" && checkResult === null ? (
          <Button
            title="Проверить"
            type={!canCheck ? "disabled" : "primary"}
            onPress={checkRecording}
          />
        ) : task.type === "asr_reading" ? (
          <Button
            title="Продолжить"
            type="primary"
            onPress={handleContinue}
          />
        ) : (
          <Button
            title="Продолжить"
            type={
              !answered && (
                (task.type === "sentence_shuffle" && constructed.length < task.options.length) ||
                (task.type !== "sentence_shuffle" && selected === null)
              )
                ? "disabled"
                : "primary"
            }
            onPress={handleContinue}
          />
        )}

      </View>
    </Animated.View>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingTop: scaleSize(10),
    paddingBottom: scaleSize(30),
    gap: scaleSize(16),
  },
  illustration: {
    width: "100%",
    height: scaleSize(200),
    borderRadius: scaleSize(20),
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: scaleSize(20),
    paddingVertical: scaleSize(22),
    paddingHorizontal: scaleSize(20),
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 0.2,
    elevation: 1,
    gap: scaleSize(6),
    width: "100%",
  },
  cardTitle: {
    fontSize: scaleFont(14),
    color: COLORS.primary,
    textAlign: "center",
  },
  cardSentence: {
    fontSize: scaleFont(20),
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: scaleFont(28),
  },
  sentenceWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: scaleSize(8),
    paddingHorizontal: scaleSize(10),
  },
  sentenceWord: {
    fontSize: scaleFont(18),
    fontWeight: "500",
    color: COLORS.text,
    marginHorizontal: 4,
  },
  incorrectText: {
    color: "#E96E6E",
  },
  optionsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: scaleSize(12),
    width: "100%",
  },
  option: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: scaleSize(16),
    paddingVertical: scaleSize(14),
    paddingHorizontal: scaleSize(12),
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 0.2,
    elevation: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: {
    borderColor: "#F0F0F0",
    backgroundColor: "#F0F0F0",
  },
  optionText: {
    fontSize: scaleFont(20),
    fontWeight: "500",
    color: COLORS.text,
  },
  correct: {
    backgroundColor: "#D4F4C5",
    borderColor: "#63C55C",
  },
  incorrect: {
    backgroundColor: "#FFD6D6",
    borderColor: "#E96E6E",
  },
  answerCard: {
    backgroundColor: "#D4F4C5",
    borderWidth: 1,
    borderColor: "#63C55C",
    padding: scaleSize(16),
    borderRadius: scaleSize(12),
    width: "100%",
  },
  answerText: {
    fontSize: scaleFont(16),
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  correctAnswer: {
    fontSize: scaleFont(16),
    fontWeight: "600",
    color: "#000000",
  },
  translationText: {
    fontSize: scaleFont(14),
    color: COLORS.primary,
    textAlign: "center",
    marginTop: scaleSize(6),
  },
  buttonWrapper: {
    paddingBottom: scaleSize(20),
    paddingTop: scaleSize(4),
    backgroundColor: COLORS.white,
    marginBottom: scaleSize(10)
  },
  highlight: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  translationHint: {
    fontSize: scaleFont(14),
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: scaleSize(6),
  },
  chip: {
    backgroundColor: "#3BC64F",
    borderRadius: scaleSize(20),
    paddingVertical: scaleSize(6),
    paddingHorizontal: scaleSize(14),
    margin: scaleSize(4),
  },
  chipText: {
    fontSize: scaleFont(18),
    fontWeight: "500",
    color: COLORS.white,
  },
  chipIncorrect: {
    backgroundColor: "#E96E6E",
  },
  incorrectCard: {
    backgroundColor: "#FFECEC",
    borderColor: "#F0C1C1",
  },
  bigWord: {
    fontSize: scaleFont(26),
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginTop: scaleSize(6),
  },
  micButtonWrapper: {
    alignItems: 'center',
    marginVertical: scaleSize(20),
  },
  micButton: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: scaleSize(32),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#D46A6A',
  },
  micIcon: {
    width: scaleSize(28),
    height: scaleSize(28),
    tintColor: 'white',
  },
  micHint: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: scaleSize(10),
    fontSize: scaleFont(14),
  },
  micButtonDisabled: {
    backgroundColor: COLORS.textSecondary
  },
  micIconDisabled: {
    tintColor: COLORS.textSecondary,
  },
  maskedWord: {
    fontStyle: 'italic',
    fontWeight: 'bold',
    color: COLORS.primary,
  }
});

export default TaskRenderer;