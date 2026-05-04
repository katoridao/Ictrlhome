import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_BASE_URL } from '../config/backend';

const SOCKET_URL = SOCKET_BASE_URL;

let socket = null;
let isConnecting = false;
const lifecycleSubscribers = new Set();

const emitLifecycle = async type => {
  const payload = {
    type,
    socketId: socket?.id || null,
    at: Date.now(),
  };

  for (const callback of lifecycleSubscribers) {
    try {
      callback(payload);
    } catch (error) {
      console.warn('[Socket] lifecycle callback error:', error?.message);
    }
  }
};

export const subscribeSocketLifecycle = callback => {
  if (typeof callback !== 'function') {
    return () => {};
  }

  lifecycleSubscribers.add(callback);
  return () => lifecycleSubscribers.delete(callback);
};

export const getSocket = () => socket;

export const connectSocket = async () => {
  if (socket && socket.connected) return socket;

  if (isConnecting) {
    return new Promise(resolve => {
      socket?.once('connect', () => resolve(socket));
    });
  }

  isConnecting = true;

  const token = await AsyncStorage.getItem('token');

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.off('connect').on('connect', async () => {
    isConnecting = false;

    console.log('[Socket] Connected:', socket.id);

    const houseId = await AsyncStorage.getItem('current_house_id');

    if (houseId) {
      socket.emit('join_house', { house_id: houseId });
    }

    await emitLifecycle('connect');
  });

  socket.off('reconnect').on('reconnect', async () => {
    const houseId = await AsyncStorage.getItem('current_house_id');

    if (houseId) {
      socket.emit('join_house', { house_id: houseId });
    }

    await emitLifecycle('reconnect');
  });

  socket.off('disconnect').on('disconnect', reason => {
    console.log('[Socket] Disconnect:', reason);
  });

  socket
    .off('house_membership_granted')
    .on('house_membership_granted', async payload => {
      const houseId = payload?.house_id;
      const houseName = payload?.house_name || 'NHÀ CHÍNH';

      if (houseId) {
        await AsyncStorage.setItem('current_house_id', String(houseId));
        await AsyncStorage.setItem('current_house_name', houseName);
        socket.emit('join_house', { house_id: String(houseId) });
      }

      const rawUser = await AsyncStorage.getItem('user_info');
      if (rawUser) {
        const nextUser = { ...JSON.parse(rawUser), is_house_member: true };
        await AsyncStorage.setItem('user_info', JSON.stringify(nextUser));
      }
    });

  socket
    .off('house_membership_revoked')
    .on('house_membership_revoked', async payload => {
      const currentHouseId = await AsyncStorage.getItem('current_house_id');
      if (currentHouseId) {
        socket.emit('leave_house', { house_id: currentHouseId });
      }

      await AsyncStorage.multiRemove([
        'current_house_id',
        'current_house_name',
      ]);

      const rawUser = await AsyncStorage.getItem('user_info');
      if (rawUser) {
        const nextUser = { ...JSON.parse(rawUser), is_house_member: false };
        await AsyncStorage.setItem('user_info', JSON.stringify(nextUser));
      }

      console.log('[Socket] House membership revoked:', payload?.house_id);
    });

  socket.off('house_join_denied').on('house_join_denied', async payload => {
    await AsyncStorage.multiRemove(['current_house_id', 'current_house_name']);

    const rawUser = await AsyncStorage.getItem('user_info');
    if (rawUser) {
      const nextUser = { ...JSON.parse(rawUser), is_house_member: false };
      await AsyncStorage.setItem('user_info', JSON.stringify(nextUser));
    }

    console.log('[Socket] House join denied:', payload?.house_id);
  });

  socket.off('connect_error').on('connect_error', err => {
    isConnecting = false;
    console.log('[Socket] Error:', err.message);
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
