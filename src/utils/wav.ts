import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

export const apiUpload = async (endpoint: string, formData: FormData) => {
  try {
    const token = await AsyncStorage.getItem("userToken");

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    console.log("📬 Ответ от сервера:", response.status, data);

    return { response, data };
  } catch (error) {
    console.error("💥 Ошибка при загрузке:", error);
    return { response: null, data: null };
  }
};
