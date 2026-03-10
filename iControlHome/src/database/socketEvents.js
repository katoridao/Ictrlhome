/**
 * Socket Events Hook - Quản lý socket listeners một cách clean
 * Cách dùng trong component:
 *
 * const { setupSocket, cleanupSocket } = useSocketEvents(
 *   {
 *     'device_status_changed': ({ device_id, status }) => { ... },
 *     'device_added': ({ device }) => { ... },
 *     'room_updated': ({ room }) => { ... },
 *   },
 *   dependencyArray
 * );
 *
 * useFocusEffect(
 *   useCallback(() => {
 *     setupSocket();
 *     return cleanupSocket;
 *   }, [setupSocket, cleanupSocket])
 * );
 */

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

/**
 * ✅ Socket Event Types (Backend emit theo các sự kiện này):
 *
 * DEVICE EVENTS:
 * - device_added: { device, house_id }
 * - device_updated: { device, house_id }
 * - device_deleted: { device_id, house_id }
 * - device_status_changed: { device_id, status, house_id }
 *
 * ROOM EVENTS:
 * - room_added: { room, house_id }
 * - room_updated: { room, house_id }
 * - room_deleted: { room_id, house_id }
 *
 * MEMBER EVENTS:
 * - member_added: { member, house_id }
 * - member_removed: { member_id, house_id }
 *
 * PERMISSION EVENTS:
 * - permission_updated: { room_id, device_id, user_id, can_view, can_control, house_id }
 */
