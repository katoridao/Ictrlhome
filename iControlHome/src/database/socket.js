import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Thay bằng IP server thực tế của bạn (cùng mạng WiFi)
const SOCKET_URL = 'http://192.168.1.110:3000';

let socket = null;
let isConnecting = false;

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

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  socket.on('connect', async () => {
    // ✅ FIX 1: isConnecting = false phải đặt ở đây, không phải bên ngoài
    // Trước đây đặt bên ngoài khiến nó reset quá sớm, trước khi socket thực sự connect
    isConnecting = false;
    console.log('[Socket] Đã kết nối:', socket.id);

    const currentHouseId = await AsyncStorage.getItem('current_house_id');
    console.log('[Socket] current_house_id từ AsyncStorage:', currentHouseId);

    if (currentHouseId) {
      socket.emit('join_house', { house_id: currentHouseId });
      console.log('[Socket] Đã emit join_house:', currentHouseId);
    } else {
      console.warn('[Socket] ⚠️ KHÔNG CÓ current_house_id — không thể join house!');
    }
  });

  // ✅ FIX 2: Tự động rejoin room sau khi reconnect
  // Khi mạng bị ngắt rồi kết nối lại, server không còn nhớ socket này ở room nào
  socket.on('reconnect', async () => {
    console.log('[Socket] Đã reconnect, đang rejoin house...');
    const currentHouseId = await AsyncStorage.getItem('current_house_id');
    if (currentHouseId) {
      socket.emit('join_house', { house_id: currentHouseId });
      console.log('[Socket] Đã rejoin house sau reconnect:', currentHouseId);
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
    // ✅ FIX 3: Reset isConnecting khi lỗi, tránh bị kẹt mãi không tạo được socket mới
    isConnecting = false;
    console.warn('[Socket] Lỗi kết nối:', err.message);
  });

  socket.on('auth_error', () => {
    console.warn('[Socket] Token không hợp lệ, thử lấy token mới...');
    reconnectWithFreshToken();
  });

  // ✅ FIX 1 (tiếp): Đã xóa isConnecting = false ở đây
  return socket;
};

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