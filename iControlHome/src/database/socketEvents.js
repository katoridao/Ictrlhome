import { useCallback, useRef } from 'react';
import { connectSocket, getSocket } from './socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSocketEvents = (eventHandlers = {}, deps = []) => {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  const setupSocket = useCallback(async () => {
    const socket = await connectSocket();

    // Ensure joined to current house room
    const currentHouseId = await AsyncStorage.getItem('current_house_id');
    if (socket.connected && currentHouseId) {
      socket.emit('join_house', { house_id: currentHouseId });
    }

    // Register all event listeners
    Object.entries(handlersRef.current).forEach(([event, handler]) => {
      socket.off(event).on(event, handler);
    });

    return socket;
  }, []);

  const cleanupSocket = useCallback(() => {
    return () => {
      const socket = getSocket();
      if (socket) {
        // Unregister all event listeners
        Object.keys(handlersRef.current).forEach(event => {
          socket.off(event);
        });
      }
    };
  }, []);

  return { setupSocket, cleanupSocket };
};
