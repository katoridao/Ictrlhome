import React, { useState, useCallback, useLayoutEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, Alert, ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

export default function RoomDetailScreen({ route, navigation }) {
  const { room } = route.params;
  const { styles: themeStyles } = useTheme();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Hàm tải thiết bị: Đã đồng bộ param room_id với Backend
  const fetchDevicesInRoom = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/devices', { 
        params: { room_id: room._id } 
      });
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error("Lỗi tải thiết bị:", error);
    } finally {
      setLoading(false);
    }
  }, [room._id]);

  useFocusEffect(
    useCallback(() => {
      fetchDevicesInRoom();
    }, [fetchDevicesInRoom])
  );

  // 3. Cấu hình Header: QUAN TRỌNG - Kiểm tra tên màn hình 'UnassignedDevicesScreen'
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: room.name || 'Chi tiết phòng',
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('UnassignedDevices', { room_id: room._id })}
          style={{ marginRight: 15 }}
        >
          <Image 
            source={require('../../public/img/add.png')} 
            style={{ width: 22, height: 22, tintColor: '#fff' }} 
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, room]);

  const handleDeleteDevice = (deviceId) => {
    Alert.alert("Xác nhận", "Gỡ thiết bị khỏi phòng? Thiết bị sẽ hiển thị lại ở màn hình chính.", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Gỡ bỏ", 
        style: "destructive", 
        onPress: async () => {
          try {
            // Thay vì xóa vĩnh viễn, cập nhật room_id = null để đưa về Home
            await api.put(`/devices/assign-room/${deviceId}`, { room_id: null });
            fetchDevicesInRoom(); 
          } catch (e) { 
            Alert.alert("Lỗi", "Không thể gỡ thiết bị. Vui lòng thử lại."); 
          }
        } 
      }
    ]);
  };

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'light': case 'đèn': return require('../../public/img/light.png');
      case 'fan': case 'quạt': return require('../../public/img/fan.png');
      default: return require('../../public/img/device_default.png');
    }
  };

  const renderDeviceItem = ({ item }) => {
    const isActive = item.status === 1;
    return (
      <TouchableOpacity 
        style={[styles.deviceCard, { backgroundColor: themeStyles.card }]}
        onPress={() => navigation.navigate('DeviceControl', { device: item })}
        onLongPress={() => handleDeleteDevice(item._id)}
        delayLongPress={500}
      >
        <View style={styles.deviceInfo}>
          <View style={[styles.iconBox, { backgroundColor: isActive ? '#E8F5E9' : '#F5F5F5' }]}>
            <Image 
              source={getDeviceIcon(item.type)} 
              style={[styles.deviceIcon, { tintColor: isActive ? '#4CAF50' : '#9E9E9E' }]} 
            />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.deviceName, { color: themeStyles.text }]}>{item.name}</Text>
          </View>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isActive ? '#4CAF50' : '#F44336' }]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <Text style={[styles.roomTitle, { color: themeStyles.text }]}>📍 {room.name}</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={themeStyles.primary} />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item._id}
          renderItem={renderDeviceItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: themeStyles.subText }}>Chưa có thiết bị nào trong phòng này.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  roomTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  deviceCard: { 
    padding: 12, borderRadius: 16, marginBottom: 12, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { padding: 8, borderRadius: 10 },
  deviceIcon: { width: 24, height: 24 },
  deviceName: { fontSize: 16, fontWeight: 'bold' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }
});