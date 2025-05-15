import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import InputButton from "../components/InputButton";
import LinkButton from "../components/LinkButton";
import Title from "../components/MainTitle";
import ScreenWrapper from "../components/ScreenWrapper";
import { scaleSize } from "../constants/dimensions";
import { useTypedNavigation } from "../hooks/useTypedNavigation";
import {
  isValidEmail,
  isValidLogin,
  isValidPassword,
} from "../utils/validators";
import { COLORS } from "../constants/colors";

export default function Registration() {
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useTypedNavigation();

  const handleRegister = async () => {
    const trimmedLogin = login.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedLogin || !trimmedEmail || !trimmedPassword || !confirmPassword.trim()) {
      setErrorMessage("Заполните все поля");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Введите корректный email");
      return;
    }

    if (!isValidLogin(trimmedLogin)) {
      setErrorMessage(
        "Логин может содержать только латинские буквы, цифры, точки, дефисы и нижние подчеркивания. От 3 до 20 символов"
      );
      return;
    }

    if (!isValidPassword(trimmedPassword)) {
      setErrorMessage("Пароль должен быть от 6 до 24 символов без пробелов");
      return;
    }

    if (trimmedPassword !== confirmPassword) {
      setErrorMessage("Пароли не совпадают");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      await AsyncStorage.multiSet([
        ["reg_login", trimmedLogin],
        ["reg_email", trimmedEmail],
        ["reg_password", trimmedPassword],
      ]);

      navigation.navigate("RegistrationFirst");
    } catch (error) {
      setErrorMessage("Не удалось сохранить данные. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      scrollable
      errorMessage={errorMessage}
      onDismissError={() => setErrorMessage("")}
    >
      <BackButton />

      <View style={styles.loginsystem}>
        <View style={styles.textcontainer}>
          <Title title="Регистрация нового пользователя" size={scaleSize(24)} type="title" />
          <Title
            title="Давайте создадим вашу учётную запись"
            size={scaleSize(16)}
            type="subtitle"
          />
        </View>

        <View style={styles.inputs}>
          <InputButton
            title="Логин"
            placeholder="Введите логин"
            value={login}
            onChangeText={setLogin}
          />
          <InputButton
            title="Почта"
            placeholder="Введите почту"
            value={email}
            onChangeText={setEmail}
          />
          <InputButton
            title="Пароль"
            placeholder="Введите пароль"
            value={password}
            onChangeText={setPassword}
            isPassword
          />
          <InputButton
            title="Подтвердите пароль"
            placeholder="Введите пароль"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />
        </View>

        <View style={styles.buttoncontent}>
          <Button title="Продолжить" type="primary" onPress={handleRegister} />
          <View style={styles.registrationmenu}>
            <Text style={styles.accountText}>Уже есть аккаунт? </Text>
            <LinkButton title="Войдите" onPress={() => navigation.navigate("Login")} />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loginsystem: {
    gap: scaleSize(24),
    marginVertical: scaleSize(40),
  },
  textcontainer: {
    gap: scaleSize(8),
  },
  inputs: {
    flex: 1,
    gap: scaleSize(6),
  },
  registrationmenu: {
    flexDirection: "row",
    justifyContent: "center",
  },
  buttoncontent: {
    gap: scaleSize(12),
  },
  accountText: {
    fontSize: scaleSize(14),
    color: COLORS.textSecondary,
  }
});
