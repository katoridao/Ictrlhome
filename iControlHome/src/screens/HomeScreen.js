import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Image, FlatList, ActivityIndicator, Alert, Dimensions 
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';
import api from '../database/api';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { styles: themeStyles } = useTheme();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/devices', { params: { room_id: 'null' } });
      const data = response.data;

      if (data && Array.isArray(data.devices)) {
        setDevices(data.devices);
      } else if (Array.isArray(data)) {
        setDevices(data);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error("Lỗi tải thiết bị:", error.message);
      const status = error.response ? error.response.status : 'Không phản hồi';
      Alert.alert("Lỗi kết nối", `Mã lỗi: ${status}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) fetchDevices();
  }, [isFocused, fetchDevices]);

  const handleDelete = async (deviceId) => {
    try {
      await api.delete(`/devices/${deviceId}`);
      Alert.alert("Thành công", "Đã xóa thiết bị!");
      fetchDevices();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xóa.");
    }
  };

  const onLongPressDevice = (item) => {
    Alert.alert(
      "Tùy chọn",
      `Thao tác với "${item.name}"?`,
      [
        { text: "Sửa", onPress: () => navigation.navigate('EditDevice', { device: item }) },
        { text: "Xóa", style: "destructive", onPress: () => handleDelete(item._id) },
        { text: "Đóng", style: "cancel" }
      ]
    );
  };

  const renderDeviceItem = ({ item }) => {
    const isActive = item.status === 1;
    
    const getDeviceIcon = (type) => {
      switch (type?.toLowerCase()) {
        case 'light': case 'đèn': return require('../../public/img/light.png');
        case 'fan': case 'quạt': return require('../../public/img/fan.png');
        default: return require('../../public/img/device_default.png');
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.deviceCard, { backgroundColor: themeStyles.card || '#fff' }]}
        onPress={() => navigation.navigate('DeviceControl', { device: item })}
        onLongPress={() => onLongPressDevice(item)}
        delayLongPress={500}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: isActive ? '#E8F5E9' : '#F5F5F5' }]}>
            <Image 
              source={getDeviceIcon(item.type)} 
              style={[styles.deviceImage, { tintColor: isActive ? '#4CAF50' : '#9E9E9E' }]} 
              resizeMode="contain"
            />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.statusText}>{isActive ? 'ON' : 'OFF'}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.deviceName, { color: themeStyles.text }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity style={styles.dropdown} onPress={() => navigation.navigate('SelectHouse')}>
          <Text style={styles.dropdownText}>Nhà chính</Text>
          <Image source={require('../../public/img/down.png')} style={styles.smallIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AddDevice')}>
          <Image source={require('../../public/img/add.png')} style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color={themeStyles.primary} style={styles.loader} />
        ) : devices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeStyles.text }]}>Không có thiết bị mới</Text>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: themeStyles.primary }]} onPress={() => navigation.navigate('AddDevice')}>
              <Text style={styles.addBtnText}>Thêm thiết bị</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(item) => item._id}
            renderItem={renderDeviceItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            onRefresh={fetchDevices}
            refreshing={loading}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdown: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  dropdownText: { marginRight: 6, color: '#000', fontWeight: 'bold' },
  smallIcon: { width: 14, height: 14 },
  headerIcon: { width: 24, height: 24, tintColor: '#fff' },
  body: { flex: 1 },
  loader: { marginTop: 40 },
  listContainer: { padding: 12 },
  row: { justifyContent: 'space-between' },
  
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconBox: { padding: 10, borderRadius: 12 },
  deviceImage: { width: 35, height: 35 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardContent: { marginTop: 4 },
  deviceName: { fontSize: 16, fontWeight: '700' },
  deviceInfo: { fontSize: 12, color: '#888', marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, marginBottom: 15 },
  addBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' }
});