import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL =
  "https://postperforated-inwrought-susy.ngrok-free.dev";

let socket = null;
let isConnecting = false;

export const getSocket = () => socket;

export const connectSocket = async () => {
  if (socket && socket.connected) return socket;

  if (isConnecting) {
    return new Promise(resolve => {
      socket?.once("connect", () => resolve(socket));
    });
  }

  isConnecting = true;

  const token = await AsyncStorage.getItem("token");

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.off("connect").on("connect", async () => {
    isConnecting = false;

    console.log("[Socket] Connected:", socket.id);

    const houseId =
      await AsyncStorage.getItem("current_house_id");

    if (houseId) {
      socket.emit("join_house", { house_id: houseId });
    }
  });

  socket.off("reconnect").on("reconnect", async () => {
    const houseId =
      await AsyncStorage.getItem("current_house_id");

    if (houseId) {
      socket.emit("join_house", { house_id: houseId });
    }
  });

  socket.off("disconnect").on("disconnect", reason => {
    console.log("[Socket] Disconnect:", reason);
  });

  socket.off("connect_error").on("connect_error", err => {
    isConnecting = false;
    console.log("[Socket] Error:", err.message);
  });

  return socket;
};

export const disconnectSocket = async () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isConnecting = false;
  }
};