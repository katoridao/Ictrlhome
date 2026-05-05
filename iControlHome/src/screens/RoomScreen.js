import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../database/api';
import { connectSocket, getSocket } from '../database/socket';

export default function RoomScreen({ navigation }) {
  const { theme, styles: themeStyles } = useTheme();
  const { t } = useContext(LanguageContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [togglingRoomId, setTogglingRoomId] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const role = await AsyncStorage.getItem('user_role');
      setIsOwner(role === 'OWNER');
      const userInfoJson = await AsyncStorage.getItem('user_info');
      const currentUserId = userInfoJson ? JSON.parse(userInfoJson)?._id : null;

      const response = await api.get('/rooms');
      const roomList = response.data?.rooms || [];

      const roomsWithStatus = await Promise.all(
        roomList.map(async room => {
          const roomId = room._id;
          const roomPerm = room.permissions?.find(
            p =>
              currentUserId &&
              p.user_id?.toString() === currentUserId.toString(),
          );
          const roomCanControl = role === 'OWNER' || !!roomPerm?.can_control;

          try {
            const devRes = await api.get('/devices', {
              params: { room_id: roomId },
            });
            const devices = devRes.data.devices || [];
            const onCount = devices.filter(d => d.status).length;
            return {
              ...room,
              devices,
              onCount,
              totalDevices: devices.length,
              roomCanControl,
            };
          } catch {
            return {
              ...room,
              devices: [],
              onCount: 0,
              totalDevices: 0,
              roomCanControl,
            };
          }
        }),
      );

      setRooms(roomsWithStatus);
    } catch (error) {
      console.error('Lỗi lấy phòng:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const onStatusChanged = ({ device_id, status }) => {
        if (!mounted) return;
        setRooms(prev =>
          prev.map(room => {
            const deviceIndex = room.devices?.findIndex(
              d => d._id === device_id,
            );
            if (deviceIndex === -1 || deviceIndex === undefined) return room;
            const updatedDevices = room.devices.map(d =>
              d._id === device_id ? { ...d, status } : d,
            );
            const onCount = updatedDevices.filter(d => d.status).length;
            return { ...room, devices: updatedDevices, onCount };
          }),
        );
      };

      const onRoomAdded = ({ room }) => {
        if (!mounted) return;
        setRooms(prev => [
          ...prev,
          { ...room, devices: [], onCount: 0, totalDevices: 0 },
        ]);
      };

      const onRoomUpdated = ({ room }) => {
        if (!mounted) return;
        setRooms(prev =>
          prev.map(r => (r._id === room._id ? { ...r, ...room } : r)),
        );
      };

      const onRoomDeleted = ({ room_id }) => {
        if (!mounted) return;
        setRooms(prev => prev.filter(r => r._id !== room_id));
      };

      const onDeviceAdded = ({ device }) => {
        if (!mounted) return;
        setRooms(prev =>
          prev.map(room => {
            if (room._id === device.room_id) {
              return {
                ...room,
                devices: [...(room.devices || []), device],
                totalDevices: (room.devices?.length || 0) + 1,
              };
            }
            return room;
          }),
        );
      };

      const onDeviceDeleted = ({ device_id }) => {
        if (!mounted) return;
        setRooms(prev =>
          prev.map(room => {
            const updatedDevices = room.devices?.filter(
              d => d._id !== device_id,
            );
            const onCount = updatedDevices?.filter(d => d.status).length || 0;
            return {
              ...room,
              devices: updatedDevices,
              onCount,
              totalDevices: updatedDevices?.length || 0,
            };
          }),
        );
      };

      const setupSocket = async () => {
        try {
          const socket = await connectSocket();

          // Setup listeners for real-time updates
          socket
            .off('device_status_changed', onStatusChanged)
            .on('device_status_changed', onStatusChanged);
          socket.off('room_added', onRoomAdded).on('room_added', onRoomAdded);
          socket
            .off('room_updated', onRoomUpdated)
            .on('room_updated', onRoomUpdated);
          socket
            .off('room_deleted', onRoomDeleted)
            .on('room_deleted', onRoomDeleted);
          socket
            .off('device_added', onDeviceAdded)
            .on('device_added', onDeviceAdded);
          socket
            .off('device_deleted', onDeviceDeleted)
            .on('device_deleted', onDeviceDeleted);

          console.log('[RoomScreen] Socket listeners registered');
        } catch (err) {
          console.error('[RoomScreen] Socket setup error:', err);
        }
      };

      setupSocket();

      return () => {
        mounted = false;
        const socket = getSocket();
        if (socket) {
          console.log('[RoomScreen] Cleaning up socket listeners');
          socket.off('device_status_changed', onStatusChanged);
          socket.off('room_added', onRoomAdded);
          socket.off('room_updated', onRoomUpdated);
          socket.off('room_deleted', onRoomDeleted);
          socket.off('device_added', onDeviceAdded);
          socket.off('device_deleted', onDeviceDeleted);
        }
      };
    }, []),
  );

  const handleSave = async () => {
    if (!roomName.trim()) return;
    try {
      if (isEdit && selectedRoomId) {
        await api.put(`/rooms/edit/${selectedRoomId}`, { name: roomName });
      } else {
        const houseId = await AsyncStorage.getItem('current_house_id');
        if (!houseId) {
          Toast.show({
            type: 'error',
            text1: t.error,
            text2: t.select_house,
          });
          return;
        }
        await api.post('/rooms/add', { name: roomName, house_id: houseId });
      }
      setModalVisible(false);
      setRoomName('');
      fetchRooms();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: error.response?.data?.message || t.cannot_delete_room,
      });
    }
  };

  const handleDelete = async id => {
    Alert.alert(t.confirm, t.confirm_delete_room, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/rooms/del/${id}`);
            fetchRooms();
          } catch (e) {
            Toast.show({
              type: 'error',
              text1: t.error,
              text2: t.cannot_delete_room,
            });
          }
        },
      },
    ]);
  };

  const handleToggleAllInRoom = async room => {
    if (room.totalDevices === 0) return;
    const allOn = room.onCount === room.totalDevices;
    const newStatus = !allOn;
    setTogglingRoomId(room._id);
    try {
      await Promise.all(
        room.devices.map(d =>
          api.put(`/devices/${d._id}/status`, { status: newStatus }),
        ),
      );
      setRooms(prev =>
        prev.map(r => {
          if (r._id !== room._id) return r;
          return {
            ...r,
            onCount: newStatus ? r.totalDevices : 0,
            devices: r.devices.map(d => ({ ...d, status: newStatus })),
          };
        }),
      );
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.update_all_devices_error,
      });
    } finally {
      setTogglingRoomId(null);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Image
          source={require('../../public/img/room.png')}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>{t.tab_room}</Text>
        {isOwner ? (
          <TouchableOpacity
            onPress={() => {
              setIsEdit(false);
              setRoomName('');
              setModalVisible(true);
            }}
          >
            <Image
              source={require('../../public/img/add.png')}
              style={{ width: 22, height: 22, tintColor: '#fff' }}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color={themeStyles.primary} />
        ) : (
          rooms.map(room => (
            <RoomItem
              key={room._id}
              room={room}
              t={t}
              themeStyles={themeStyles}
              navigation={navigation}
              isOwner={isOwner}
              toggling={togglingRoomId === room._id}
              onEdit={() => {
                setIsEdit(true);
                setSelectedRoomId(room._id);
                setRoomName(room.name);
                setModalVisible(true);
              }}
              onDelete={() => handleDelete(room._id)}
              onToggleAll={() => handleToggleAllInRoom(room)}
            />
          ))
        )}
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View
                style={[styles.modalBox, { backgroundColor: themeStyles.card }]}
              >
                <Text style={[styles.modalTitle, { color: themeStyles.text }]}>
                  {isEdit ? t.edit_room : t.add_room}
                </Text>
                <TextInput
                  placeholder={t.enter_room_name}
                  placeholderTextColor={themeStyles.subText}
                  style={[
                    styles.input,
                    {
                      color: themeStyles.text,
                      borderColor: themeStyles.border,
                    },
                  ]}
                  value={roomName}
                  onChangeText={setRoomName}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={{ padding: 10 }}
                  >
                    <Text style={{ color: themeStyles.subText }}>
                      {t.cancel}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={{ padding: 10 }}
                  >
                    <Text
                      style={{ color: themeStyles.primary, fontWeight: 'bold' }}
                    >
                      {t.save}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

function RoomItem({
  room,
  t,
  onEdit,
  onDelete,
  onToggleAll,
  themeStyles,
  navigation,
  isOwner,
  toggling,
}) {
  const allOn = room.totalDevices > 0 && room.onCount === room.totalDevices;
  const hasDevices = room.totalDevices > 0;
  const canControlRoom = isOwner || room.roomCanControl;

  return (
    <TouchableOpacity
      style={[styles.roomItem, { backgroundColor: themeStyles.card }]}
      onPress={() => navigation.navigate('RoomDetail', { room })}
    >
      <View style={styles.roomLeft}>
        <Text style={[styles.roomName, { color: themeStyles.text }]}>
          {room.name}
        </Text>
        <Text
          style={[
            styles.roomSub,
            { color: canControlRoom ? themeStyles.subText : '#9E9E9E' },
          ]}
        >
          {hasDevices
            ? `${room.onCount}/${room.totalDevices} ${t.devices_on}`
            : t.no_devices_in_room}
        </Text>
      </View>

      <View style={styles.roomActions}>
        {hasDevices && canControlRoom && (
          <TouchableOpacity
            style={[
              styles.toggleAllBtn,
              { backgroundColor: allOn ? '#F44336' : '#4CAF50' },
            ]}
            onPress={e => {
              e.stopPropagation();
              onToggleAll();
            }}
            disabled={toggling}
          >
            {toggling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.toggleAllText}>
                {allOn ? t.turn_off : t.turn_on}
              </Text>
            )}
          </TouchableOpacity>
        )}
        {isOwner && (
          <>
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Image
                source={require('../../public/img/delete.png')}
                style={[styles.icon, { tintColor: '#f52109' }]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Image
                source={require('../../public/img/edit.png')}
                style={[styles.icon, { marginLeft: 8, tintColor: '#f52109' }]}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    marginRight: 10,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 },
  body: { padding: 16, paddingBottom: 24 },
  roomItem: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  roomLeft: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: '600' },
  roomSub: { fontSize: 12, marginTop: 3 },
  roomActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 48,
    alignItems: 'center',
  },
  toggleAllText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  icon: { width: 20, height: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: { width: '80%', borderRadius: 16, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 16,
  },
});
