import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, Image, Dimensions 
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

const { width } = Dimensions.get('window');

export default function UnassignedDevicesScreen({ route, navigation }) {
  const { room_id } = route.params;
  const { styles: themeStyles } = useTheme();
  const [availableDevices, setAvailableDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Tải danh sách thiết bị CHƯA có phòng (room_id là null)
  useEffect(() => {
    const fetchUnassigned = async () => {
      try {
        setLoading(true);
        const res = await api.get('/devices', { params: { room_id: 'null' } });
        setAvailableDevices(res.data.devices || []);
      } catch (error) {
        console.error("Lỗi tải thiết bị chưa gán:", error);
        Alert.alert("Lỗi", "Không thể lấy danh sách thiết bị mới");
      } finally {
        setLoading(false);
      }
    };
    fetchUnassigned();
  }, []);

  // 2. Gán thiết bị vào phòng hiện tại
  const assignToRoom = async (deviceId, deviceName) => {
    try {
      // Gọi API assign-room đã được sửa ở Backend
      await api.put(`/devices/assign-room/${deviceId}`, { room_id });
      Alert.alert("Thành công", `Đã thêm "${deviceName}" vào phòng`);
      navigation.goBack(); // Quay lại màn hình RoomDetailScreen
    } catch (e) { 
      console.error(e);
      Alert.alert("Lỗi", "Không thể gán phòng. Vui lòng kiểm tra Backend."); 
    }
  };

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'light': case 'đèn': return require('../../public/img/light.png');
      case 'fan': case 'quạt': return require('../../public/img/fan.png');
      default: return require('../../public/img/device_default.png');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => assignToRoom(item._id, item.name)} 
      style={[styles.deviceCard, { backgroundColor: themeStyles.card || '#fff' }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Image 
            source={getDeviceIcon(item.type)} 
            style={[styles.deviceIcon, { tintColor: themeStyles.primary }]} 
          />
        </View>
        <View style={styles.addBadge}>
          <Text style={styles.addText}>+</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={[styles.deviceName, { color: themeStyles.text }]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <Text style={[styles.title, { color: themeStyles.text }]}>
        Chọn thiết bị để thêm vào phòng
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={themeStyles.primary} style={{ marginTop: 50 }} />
      ) : availableDevices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: themeStyles.subText }}>Không còn thiết bị nào chưa gán phòng.</Text>
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: themeStyles.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={availableDevices}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { fontSize: 16, marginBottom: 20, fontWeight: '600', textAlign: 'center' },
  listContainer: { paddingBottom: 20 },
  row: { justifyContent: 'space-between' },
  
  // Card UI đồng bộ
  deviceCard: { 
    width: (width / 2) - 18, 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconBox: { padding: 8, backgroundColor: '#F5F5F5', borderRadius: 12 },
  deviceIcon: { width: 30, height: 30 },
  addBadge: { backgroundColor: '#4CAF50', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addText: { color: '#fff', fontSize: 14, fontWeight: 'bold', lineHeight: 18 },
  cardContent: { marginTop: 4 },
  deviceName: { fontSize: 15, fontWeight: '700' },
  deviceInfo: { fontSize: 11, color: '#888', marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 10, borderRadius: 10 }
});