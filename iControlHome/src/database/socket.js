import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Thay bằng IP server thực tế của bạn (cùng mạng WiFi)
const SOCKET_URL = 'http://192.168.1.x:3000';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = async () => {
  if (socket && socket.connected) return socket;

  const token = await AsyncStorage.getItem('token');

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Đã kết nối:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Ngắt kết nối:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Lỗi kết nối:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};