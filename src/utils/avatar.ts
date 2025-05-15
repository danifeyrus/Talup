import { API_URL } from "../constants/api";

export const getAvatarUrl = (avatar: string) => {
  if (!avatar) return require("../../assets/avadefault.png");

  if (avatar.startsWith("http")) return { uri: avatar };

  return { uri: `${API_URL}${avatar}` };
};
