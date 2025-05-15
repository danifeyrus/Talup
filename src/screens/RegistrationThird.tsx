import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import ChoiceButton from "../components/ChoiceButton";
import CustomPicker from "../components/InputPicker";
import Title from "../components/MainTitle";
import ScreenWrapper from "../components/ScreenWrapper";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import { useTypedNavigation } from "../hooks/useTypedNavigation";
import { apiPost } from "../utils/api";

export default function RegistrationThird() {
  const [currentLevel, setCurrentLevel] = useState("");
  const [aimLevel, setAimLevel] = useState("");
  const [time, setTime] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useTypedNavigation();

  const goals = [
    { title: "Для развлечения", value: "fun" },
    { title: "Для бизнеса", value: "business" },
    { title: "Фильмы", value: "movies" },
    { title: "Образование", value: "education" },
    { title: "Для путешествий", value: "travel" },
    { title: "Другое", value: "other" }
  ];

  const handleGoalSelection = (selectedGoal: string) => {
    setSelectedGoals(prev =>
      prev.includes(selectedGoal)
        ? prev.filter(goal => goal !== selectedGoal)
        : [...prev, selectedGoal]
    );
  };

  const handleNextStep = async () => {
    if (!currentLevel || !aimLevel || !time || selectedGoals.length === 0) {
      setErrorMessage("Выберите все параметры");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const [
        email, password, username, name,
        gender, language, birthDate
      ] = await Promise.all([
        AsyncStorage.getItem("reg_email"),
        AsyncStorage.getItem("reg_password"),
        AsyncStorage.getItem("reg_login"),
        AsyncStorage.getItem("reg_name"),
        AsyncStorage.getItem("reg_gender"),
        AsyncStorage.getItem("reg_language"),
        AsyncStorage.getItem("reg_birthdate")
      ]);

      const { response, data } = await apiPost("/auth/register", {
        email,
        password,
        username,
        name,
        gender,
        language,
        birthDate,
        goals: selectedGoals,
        currentLevel,
        aimLevel,
        time,
        avatar: "",
      });

      if (response.ok && data.token) {
        await AsyncStorage.setItem("userToken", data.token);
        await AsyncStorage.multiSet([
          ["reg_email", data.email],
          ["reg_name", data.name],
        ]);
        navigation.reset({ index: 0, routes: [{ name: "MainScreen" }] });
      } else {
        setErrorMessage(data.message || data.error || "Ошибка при регистрации");
      }
    } catch (error) {
      setErrorMessage("Ошибка соединения. Проверьте интернет и попробуйте снова.");
    }

    setLoading(false);
  };

  return (
    <ScreenWrapper scrollable errorMessage={errorMessage} onDismissError={() => setErrorMessage("")}>
      <BackButton />
      <View style={styles.stepsContainer}>
        <View style={[styles.step, styles.activeStep]} />
        <View style={[styles.step, styles.activeStep]} />
        <View style={[styles.step, styles.activeStep]} />
      </View>

      <View style={styles.textcontainer}>
        <Title title="Какова ваша цель изучения?" size={scaleFont(24)} />
        <Title title="Для чего вы хотите изучить язык?" size={scaleFont(16)} type="subtitle" />
      </View>

      <View style={styles.registrationsystem}>
        <View style={styles.buttonsystem}>
          {goals.map((goal) => (
            <ChoiceButton
              key={goal.value}
              title={goal.title}
              selected={selectedGoals.includes(goal.value)}
              onPress={() => handleGoalSelection(goal.value)}
            />
          ))}
        </View>

        <View style={styles.pickercontainer}>
          <Text style={styles.pickertext}>Каков Ваш текущий уровень Казахского языка?</Text>
          <CustomPicker
            selectedValue={currentLevel}
            onValueChange={setCurrentLevel}
            options={[
              { label: "Изучаю первый раз", value: "firsttime" },
              { label: "Начальный", value: "start" },
              { label: "Средний", value: "medium" },
              { label: "Продвинутый", value: "advanced" }
            ]}
          />
        </View>

        <View style={styles.pickercontainer}>
          <Text style={styles.pickertext}>К какому уровню вы стремитесь?</Text>
          <CustomPicker
            selectedValue={aimLevel}
            onValueChange={setAimLevel}
            options={[
              { label: "A1", value: "A1" },
              { label: "A2", value: "A2" },
              { label: "B1", value: "B1" },
              { label: "B2", value: "B2" },
              { label: "C1", value: "C1" },
              { label: "C2", value: "C2" }
            ]}
          />
        </View>

        <View style={styles.pickercontainer}>
          <Text style={styles.pickertext}>Сколько времени вы готовы уделять для изучения языка?</Text>
          <CustomPicker
            selectedValue={time}
            onValueChange={setTime}
            options={[
              { label: "1 час", value: "one" },
              { label: "2 часа", value: "two" },
              { label: "3 часа", value: "three" },
              { label: "Больше", value: "more" }
            ]}
          />
        </View>

        <View style={styles.buttoncontainer}>
          <Button title="Продолжить" onPress={handleNextStep} />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pickercontainer: {
    gap: scaleSize(12),
  },
  pickertext: {
    fontSize: scaleFont(18),
    textAlign: "left",
  },
  textcontainer: {
    gap: scaleSize(8),
    marginBottom: scaleSize(20),
  },
  registrationsystem: {
    gap: scaleSize(24),
  },
  stepsContainer: {
    marginVertical: scaleSize(40),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  step: {
    flex: 1,
    height: scaleSize(4),
    backgroundColor: COLORS.step,
    marginHorizontal: scaleSize(4),
    borderRadius: scaleSize(2),
  },
  activeStep: {
    backgroundColor: COLORS.primary,
  },
  buttonsystem: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scaleSize(8),
  },
  buttoncontainer: {
    marginTop: "auto",
  },
});
