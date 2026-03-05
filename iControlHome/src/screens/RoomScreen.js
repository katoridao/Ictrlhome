import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

export default function RoomScreen({ navigation }) {
  const { styles: themeStyles } = useTheme();
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

      const response = await api.get('/rooms');
      const roomList = response.data?.rooms || [];

      // Lấy thêm danh sách thiết bị cho mỗi phòng để biết có thiết bị nào đang bật không
      const roomsWithStatus = await Promise.all(
        roomList.map(async room => {
          try {
            const devRes = await api.get('/devices', {
              params: { room_id: room._id },
            });
            const devices = devRes.data.devices || [];
            const onCount = devices.filter(d => d.status).length;
            return { ...room, devices, onCount, totalDevices: devices.length };
          } catch {
            return { ...room, devices: [], onCount: 0, totalDevices: 0 };
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

  const handleSave = async () => {
    if (!roomName.trim()) return;
    try {
      if (isEdit && selectedRoomId) {
        await api.put(`/rooms/edit/${selectedRoomId}`, { name: roomName });
      } else {
        const houseId = await AsyncStorage.getItem('current_house_id');
        if (!houseId) {
          Alert.alert('Lỗi', 'Vui lòng chọn nhà trước.');
          return;
        }
        await api.post('/rooms/add', { name: roomName, house_id: houseId });
      }
      setModalVisible(false);
      setRoomName('');
      fetchRooms();
    } catch (error) {
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể lưu phòng',
      );
    }
  };

  const handleDelete = async id => {
    Alert.alert('Xác nhận', 'Xóa phòng này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/rooms/del/${id}`);
            fetchRooms();
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xóa');
          }
        },
      },
    ]);
  };

  // Tắt tổng tất cả thiết bị trong 1 phòng từ ngoài danh sách
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
      Alert.alert('Lỗi', 'Không thể cập nhật thiết bị');
    } finally {
      setTogglingRoomId(null);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Text style={styles.sortText}>Sắp xếp</Text>
        <Text style={styles.headerTitle}>Phòng</Text>
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

      {/* Modal Thêm/Sửa */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View
                style={[styles.modalBox, { backgroundColor: themeStyles.card }]}
              >
                <Text style={[styles.modalTitle, { color: themeStyles.text }]}>
                  {isEdit ? 'Sửa tên phòng' : 'Thêm phòng'}
                </Text>
                <TextInput
                  placeholder="Nhập tên phòng"
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
                    <Text style={{ color: themeStyles.subText }}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={{ padding: 10 }}
                  >
                    <Text
                      style={{ color: themeStyles.primary, fontWeight: 'bold' }}
                    >
                      Lưu
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

  return (
    <TouchableOpacity
      style={[styles.roomItem, { backgroundColor: themeStyles.card }]}
      onPress={() => navigation.navigate('RoomDetail', { room })}
    >
      <View style={styles.roomLeft}>
        <Text style={[styles.roomName, { color: themeStyles.text }]}>
          {room.name}
        </Text>
        {/* Số thiết bị đang bật */}
        <Text style={[styles.roomSub, { color: themeStyles.subText }]}>
          {hasDevices
            ? `${room.onCount}/${room.totalDevices} thiết bị đang bật`
            : 'Chưa có thiết bị'}
        </Text>
      </View>

      <View style={styles.roomActions}>
        {/* Nút tắt tổng nhanh */}
        {hasDevices && (
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
              <Text style={styles.toggleAllText}>{allOn ? 'Tắt' : 'Bật'}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Nút sửa/xóa chỉ OWNER */}
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
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  sortText: { color: '#fff' },
  body: { padding: 16 },
  roomItem: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  roomLeft: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: '600' },
  roomSub: { fontSize: 12, marginTop: 3 },
  roomActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
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
