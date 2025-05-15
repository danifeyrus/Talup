import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import Title from "../components/MainTitle";
import ScreenWrapper from "../components/ScreenWrapper";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import { useTypedNavigation } from "../hooks/useTypedNavigation";
import { isValidDate } from "../utils/validators";

export default function RegistrationSecond() {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useTypedNavigation();

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const handleNextStep = async () => {
    if (!isValidDate(day, month, year)) {
      setErrorMessage("Введите правильную дату рождения");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      const birthDate = `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`;
      await AsyncStorage.setItem("reg_birthdate", birthDate);
      navigation.navigate("RegistrationThird");
    } catch (error) {
      setErrorMessage("Ошибка при сохранении даты. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      compact
      errorMessage={errorMessage}
      onDismissError={() => setErrorMessage("")}
    >
      <BackButton />

      <View style={styles.stepsContainer}>
        <View style={[styles.step, styles.activeStep]} />
        <View style={[styles.step, styles.activeStep]} />
        <View style={styles.step} />
      </View>

      <View style={styles.registrationsystem}>
        <View style={styles.textcontainer}>
          <Title title="Введите свою дату рождения" size={scaleFont(24)} />
          <Title title="Нам важно знать ваш возраст" size={scaleFont(16)} type="subtitle" />
        </View>

        <View style={styles.dateInputContainer}>
          <TextInput
            style={styles.dateInput}
            placeholder="ДД"
            keyboardType="numeric"
            maxLength={2}
            value={day}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, "");
              setDay(digits);
              if (digits.length === 2) monthRef.current?.focus();
            }}
            returnKeyType="next"
          />
          <TextInput
            ref={monthRef}
            style={styles.dateInput}
            placeholder="ММ"
            keyboardType="numeric"
            maxLength={2}
            value={month}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, "");
              setMonth(digits);
              if (digits.length === 2) yearRef.current?.focus();
            }}
            returnKeyType="next"
          />
          <TextInput
            ref={yearRef}
            style={styles.dateInput}
            placeholder="ГГГГ"
            keyboardType="numeric"
            maxLength={4}
            value={year}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, "");
              setYear(digits);
            }}
            returnKeyType="done"
          />
        </View>
      </View>

      <View style={styles.buttoncontainer}>
        <Button title="Продолжить" onPress={handleNextStep} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  textcontainer: {
    gap: scaleSize(8),
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
  dateInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: scaleSize(20),
  },
  dateInput: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
    fontSize: scaleFont(30),
    textAlign: "center",
    width: scaleSize(80),
  },
  buttoncontainer: {
    marginTop: "auto",
  },
});
