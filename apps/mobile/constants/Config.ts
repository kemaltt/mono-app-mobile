import { Platform } from "react-native";

// export const API_URL = Platform.OS === 'android'
//   ? 'http://192.168.178.185:4040'
//   : 'http://192.168.178.29:4040';

export const API_URL =
  Platform.OS === "android"
    ? "http://192.168.178.185:4040"
    : "https://mono-app-mobile.vercel.app";
