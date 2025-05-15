import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  View
} from "react-native";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import InputButton from "../components/InputButton";
import LinkButton from "../components/LinkButton";
import Title from "../components/MainTitle";
import ScreenWrapper from "../components/ScreenWrapper";
import { COLORS } from "../constants/colors";
import { useTypedNavigation } from "../hooks/useTypedNavigation";
import { apiFetch } from "../utils/api";
import { isValidEmail, isValidPassword } from "../utils/validators";
import { scaleFont, scaleSize } from "../constants/dimensions";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 360;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useTypedNavigation();

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setErrorMessage("Введите почту и пароль");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Неверный формат почты");
      return;
    }

    if (!isValidPassword(password)) {
      setErrorMessage("Пароль должен быть от 6 до 24 символов и без пробелов");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await AsyncStorage.removeItem("userToken");

      const { response, data } = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (response.ok && data.token) {
        await AsyncStorage.setItem("userToken", data.token);
        navigation.reset({ index: 0, routes: [{ name: "MainScreen" }] });
      } else if (response.status === 403) {
        setErrorMessage("Сессия истекла. Войдите заново");
      } else {
        setErrorMessage(data.error || data.message || "Неверный email или пароль");
      }
    } catch (error) {
      setErrorMessage("Ошибка соединения. Проверьте интернет или попробуйте позже.");
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
      <Image
        style={styles.image}
        resizeMode="contain"
        source={require("../../assets/Login.png")}
      />
      <View style={styles.loginsystem}>
        <View style={styles.textcontainer}>
          <Title
            title="Вход в аккаунт"
            size={scaleFont(24)}
            type="title"
          />
          <Title
            title="Введите данные для входа"
            size={scaleFont(16)}
            type="subtitle"
          />
        </View>

        <View style={styles.inputs}>
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
        </View>

        <View style={styles.buttoncontent}>
          <Button title="Войти" onPress={handleLogin} />
          <View style={styles.registrationmenu}>
            <LinkButton title="Забыли пароль?" />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  image: {
    width: "100%",
    height: scaleSize(150),
    marginVertical: scaleSize(26),
  },
  loginsystem: {
    gap: scaleSize(24),
  },
  textcontainer: {
    gap: scaleSize(8),
  },
  inputs: {
    gap: scaleSize(6),
  },
  buttoncontent: {
    gap: scaleSize(12),
  },
  registrationmenu: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
