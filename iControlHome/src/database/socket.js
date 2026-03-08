import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Thay bằng IP server thực tế của bạn (cùng mạng WiFi)
const SOCKET_URL = 'http://192.168.2.3:3000';

let socket = null;
let isConnecting = false; // ✅ Tránh gọi connectSocket song song nhiều lần

export const getSocket = () => socket;

export const connectSocket = async () => {
  // Nếu đang kết nối rồi thì trả về luôn
  if (socket && socket.connected) return socket;

  // Tránh tạo nhiều socket cùng lúc khi gọi song song
  if (isConnecting) {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (socket && socket.connected) {
          clearInterval(interval);
          resolve(socket);
        }
      }, 100);
    });
  }

  isConnecting = true;

  // Nếu socket cũ còn tồn tại nhưng bị disconnect → dọn dẹp trước
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = await AsyncStorage.getItem('token');
  const houseId = await AsyncStorage.getItem('current_house_id');

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000, // ✅ Tối đa 10s giữa các lần thử lại
    timeout: 10000,
  });

  socket.on('connect', async () => {
    console.log('[Socket] Đã kết nối:', socket.id);

    // ✅ Join vào room theo house_id để server có thể emit riêng cho từng nhà
    // (cần bật tính năng này ở server — xem hướng dẫn bên dưới)
    const currentHouseId = await AsyncStorage.getItem('current_house_id');
    if (currentHouseId) {
      socket.emit('join_house', { house_id: currentHouseId });
      console.log('[Socket] Đã join house:', currentHouseId);
    }
  });

  socket.on('disconnect', reason => {
    console.log('[Socket] Ngắt kết nối:', reason);
    // 'io server disconnect' = server chủ động đá ra (vd: token hết hạn)
    // 'transport close' / 'ping timeout' = mạng mất → tự reconnect
    if (reason === 'io server disconnect') {
      console.warn('[Socket] Server ngắt kết nối — thử reconnect với token mới');
      reconnectWithFreshToken();
    }
  });

  socket.on('connect_error', err => {
    console.warn('[Socket] Lỗi kết nối:', err.message);
  });

  // ✅ Server có thể emit event này khi token hết hạn
  socket.on('auth_error', () => {
    console.warn('[Socket] Token không hợp lệ, thử lấy token mới...');
    reconnectWithFreshToken();
  });

  isConnecting = false;
  return socket;
};

// ✅ Reconnect với token mới (khi token cũ hết hạn)
const reconnectWithFreshToken = async () => {
  try {
    const freshToken = await AsyncStorage.getItem('token');
    if (socket && freshToken) {
      socket.auth = { token: freshToken };
      socket.connect();
    }
  } catch (err) {
    console.error('[Socket] Lỗi reconnect:', err);
  }
};

// ✅ Dùng khi user đổi nhà — rời house cũ, vào house mới
export const switchHouse = async (newHouseId) => {
  const s = getSocket();
  if (!s || !s.connected) return;

  const oldHouseId = await AsyncStorage.getItem('current_house_id');
  if (oldHouseId) {
    s.emit('leave_house', { house_id: oldHouseId });
  }

  await AsyncStorage.setItem('current_house_id', newHouseId);
  s.emit('join_house', { house_id: newHouseId });
  console.log('[Socket] Đã chuyển sang house:', newHouseId);
};

// ✅ Dùng khi logout
export const disconnectSocket = async () => {
  if (socket) {
    const houseId = await AsyncStorage.getItem('current_house_id');
    if (houseId) {
      socket.emit('leave_house', { house_id: houseId });
    }
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isConnecting = false;
    console.log('[Socket] Đã ngắt kết nối và dọn dẹp');
  }
};