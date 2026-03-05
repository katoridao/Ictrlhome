import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message'; 
import api from '../database/api';

export default function DeviceControlScreen({ route }) {
  const { device } = route.params;
  // Khởi tạo từ route.params trước, sau đó fetch lại để đảm bảo status mới nhất
  const [status, setStatus] = useState(device.status);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch lại device từ API khi màn hình mount
  // Tránh hiển thị status cũ khi navigate từ màn hình đã bật/tắt hàng loạt
  useEffect(() => {
    const fetchLatestStatus = async () => {
      try {
        const response = await api.get('/devices');
        const devices = response.data.devices || [];
        const latest = devices.find(d => d._id === device._id);
        if (latest) setStatus(latest.status);
      } catch (error) {
        // Nếu fetch thất bại thì dùng status từ route.params (đã set sẵn)
        console.warn("Không thể fetch trạng thái mới nhất:", error.message);
      } finally {
        setFetching(false);
      }
    };
    fetchLatestStatus();
  }, [device._id]);

  const toggleStatus = async () => {
    const newStatus = status === 1 || status === true ? 0 : 1;
    const statusLabel = newStatus === 1 ? 'Bật' : 'Tắt';

    setLoading(true);
    try {
      const response = await api.put(`/devices/${device._id}/status`, { status: newStatus });

      if (response.status === 200) {
        setStatus(newStatus);
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: `Đã ${statusLabel} thiết bị ${device.name} 👋`,
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      const message = error.response
        ? 'Không thể cập nhật trạng thái'
        : 'Vui lòng kiểm tra Server hoặc WiFi';
      Toast.show({ type: 'error', text1: 'Lỗi', text2: message });
    } finally {
      setLoading(false);
    }
  };

  const isOn = status === 1 || status === true;

 
return (
  <View style={styles.container}>

    {/* Thông tin thiết bị */}
    <View style={styles.infoContainer}>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Tên thiết bị:</Text>
        <Text style={styles.value}>{device.name}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Loại thiết bị:</Text>
        <Text style={styles.value}>{device.type}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Mã ESP32:</Text>
        <Text style={styles.value}>{device.esp32_id}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Công suất:</Text>
        <Text style={styles.value}>{device.power_watt} W</Text>
      </View>

    </View>

    {/* Nút bật tắt */}
    <TouchableOpacity
      style={[styles.powerButton, { backgroundColor: isOn ? '#4CAF50' : '#F44336' }]}
      onPress={toggleStatus}
      disabled={loading || fetching}
    >
      {loading || fetching ? (
        <ActivityIndicator color="#fff" size="large" />
      ) : (
        <MaterialCommunityIcons name="power" size={80} color="#fff" />
      )}
    </TouchableOpacity>

    {/* Trạng thái */}
    <Text style={styles.statusLabelText}>
      Trạng thái:{' '}
      <Text style={{ color: isOn ? '#4CAF50' : '#F44336' }}>
        {fetching ? 'Đang tải...' : isOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
      </Text>
    </Text>

  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  deviceName: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  deviceType: { fontSize: 16, color: '#888', marginBottom: 60, letterSpacing: 2 },
  powerButton: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 5,
  },
  statusLabelText: { marginTop: 40, fontSize: 20, fontWeight: '600', color: '#555' },
  infoContainer: {
  width: '90%',
  borderRadius: 12,
  padding: 15,
  marginBottom: 40,
},

infoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 10,
},

label: {
  fontSize: 16,
  fontWeight: '600',
  color: '#555',
},

value: {
  fontSize: 16,
  color: '#333',
},
});