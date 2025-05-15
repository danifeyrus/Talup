import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import InputButton from "../components/InputButton";
import Title from "../components/MainTitle";
import ScreenWrapper from "../components/ScreenWrapper";
import { API_URL } from "../constants/api";
import { scaleSize } from "../constants/dimensions";
import { useTypedNavigation } from "../hooks/useTypedNavigation";
import { isValidPassword } from "../utils/validators";

const EditProfileScreen = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigation = useTypedNavigation();

  const handleSave = async () => {
    const trimmedPassword = password.trim();

    if (!trimmedPassword || !confirmPassword.trim()) {
      setError("Заполните оба поля пароля");
      return;
    }

    if (!isValidPassword(trimmedPassword)) {
      setError("Пароль должен быть от 6 до 24 символов без пробелов");
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setError("Пароли не совпадают");
      return;
    }

    setError("");
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return;

    try {
      const passRes = await fetch(`${API_URL}/api/profile/update-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: trimmedPassword }),
      });

      const passData = await passRes.json();
      if (!passRes.ok) throw new Error(passData.error);

      Alert.alert("Успех", "Пароль обновлён");
      navigation.goBack();
    } catch (err) {
      setError("Ошибка обновления пароля");
    }
  };

  return (
    <ScreenWrapper
      scrollable
      errorMessage={error}
      onDismissError={() => setError("")}
    >
      <BackButton />
      <View style={styles.container}>
        <Title title="Сменить пароль" size={24} type="title" />

        <InputButton
          title="Новый пароль"
          placeholder="Введите новый пароль"
          value={password}
          onChangeText={setPassword}
          isPassword
        />
        <InputButton
          title="Подтверждение пароля"
          placeholder="Введите ещё раз"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
        />

        <Button title="Сохранить пароль" type="primary" onPress={handleSave} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: scaleSize(16),
    marginVertical: scaleSize(24),
  },
});

export default EditProfileScreen;