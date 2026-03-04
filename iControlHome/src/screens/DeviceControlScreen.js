import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message'; 
import api from '../database/api';

export default function DeviceControlScreen({ route }) {
  const { device } = route.params;
  const [status, setStatus] = useState(device.status);
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    const newStatus = status === 1 ? 0 : 1;
    const statusLabel = newStatus === 1 ? 'Bật' : 'Tắt';

    setLoading(true);
    try {
      // Lấy thông tin user đang đăng nhập để lưu lịch sử
      const userInfo = await AsyncStorage.getItem('user_info');
      const user = userInfo ? JSON.parse(userInfo) : null;

      // Lấy house_id để Backend có thể ghi log và tính toán tiêu thụ cho nhà này ngay lập tức
      const houseId = await AsyncStorage.getItem('current_house_id');

      // Gửi user_id và house_id kèm theo status để Backend xử lý logic tính toán
      const payload = { status: newStatus, user_id: user ? user._id : null, house_id: houseId };
      const response = await api.put(`/devices/${device._id}/status`, payload);

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
      const message = error.response ? 'Không thể cập nhật trạng thái' : 'Vui lòng kiểm tra Server hoặc WiFi';
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Nút Back đã được xóa bỏ tại đây */}

      <Text style={styles.deviceName}>{device.name}</Text>
      <Text style={styles.deviceType}>{device.type.toUpperCase()}</Text>
      
      <TouchableOpacity 
        style={[
          styles.powerButton, 
          { backgroundColor: status === 1 ? '#4CAF50' : '#F44336' }
        ]} 
        onPress={toggleStatus}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <MaterialCommunityIcons name="power" size={80} color="#fff" />
        )}
      </TouchableOpacity>
      
      <Text style={styles.statusLabelText}>
        Trạng thái: <Text style={{ color: status === 1 ? '#4CAF50' : '#F44336' }}>
          {status === 1 ? "ĐANG BẬT" : "ĐANG TẮT"}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  deviceName: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: 8 
  },
  deviceType: { 
    fontSize: 16, 
    color: '#888', 
    marginBottom: 60, 
    letterSpacing: 2 
  },
  powerButton: { 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  statusLabelText: { 
    marginTop: 40, 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#555' 
  }
});