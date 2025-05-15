import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import InputButton from "../components/InputButton";
import CustomPicker from "../components/InputPicker";
import Title from "../components/MainTitle";
import ScreenWrapper from "../components/ScreenWrapper";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import { useTypedNavigation } from "../hooks/useTypedNavigation";
import { formatName, isValidName } from "../utils/validators";

export default function RegistrationFirst() {
  const [name, setName] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useTypedNavigation();

  useEffect(() => {
    const resetLanguage = async () => {
      await AsyncStorage.removeItem("reg_language");
      setSelectedLanguage("");
    };
    resetLanguage();
  }, []);

  const handleNextStep = async () => {
    const formattedName = formatName(name);

    if (!formattedName) {
      setErrorMessage("Введите имя");
      return;
    }

    if (!isValidName(formattedName)) {
      setErrorMessage("Имя должно содержать только буквы и быть от 2 до 20 символов");
      return;
    }

    if (!selectedGender) {
      setErrorMessage("Выберите пол");
      return;
    }

    if (!selectedLanguage) {
      setErrorMessage("Выберите родной язык");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      await AsyncStorage.multiSet([
        ["reg_name", formattedName],
        ["reg_gender", selectedGender],
        ["reg_language", selectedLanguage],
      ]);

      navigation.navigate("RegistrationSecond");
    } catch (error) {
      setErrorMessage("Не удалось сохранить данные. Попробуйте позже.");
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
        <View style={styles.step} />
        <View style={styles.step} />
      </View>

      <View style={styles.registrationsystem}>
        <View style={styles.textcontainer}>
          <Title title="Давайте познакомимся поближе" size={scaleFont(24)} />
          <Title title="Узнаем вас получше" size={scaleFont(16)} type="subtitle" />
        </View>

        <View style={styles.inputs}>
          <InputButton
            title="Имя"
            placeholder="Введите ваше имя"
            value={name}
            onChangeText={setName}
          />
          <CustomPicker
            title="Ваш пол"
            selectedValue={selectedGender}
            onValueChange={setSelectedGender}
            options={[
              { label: "Не выбрано", value: "" },
              { label: "Мужской", value: "male" },
              { label: "Женский", value: "female" },
            ]}
          />
          <CustomPicker
            title="Ваш родной язык"
            selectedValue={selectedLanguage}
            onValueChange={setSelectedLanguage}
            options={[
              { label: "Не выбрано", value: "" },
              { label: "Казахский", value: "kazakh" },
              { label: "Русский", value: "russian" },
              { label: "Английский", value: "english" },
            ]}
          />
        </View>
      </View>

      <View style={styles.button}>
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
  inputs: {
    gap: scaleSize(12),
  },
  button: {
    marginTop: "auto",
  },
});
