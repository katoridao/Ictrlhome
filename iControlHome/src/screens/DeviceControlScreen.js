import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import api from '../database/api';
import { connectSocket, getSocket } from '../database/socket';

export default function DeviceControlScreen({ route }) {
  const { device } = route.params;
  const [status, setStatus] = useState(device.status);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch trạng thái mới nhất khi mount
  useEffect(() => {
    const fetchLatestStatus = async () => {
      try {
        const response = await api.get('/devices');
        const devices = response.data.devices || [];
        const latest = devices.find(d => d._id === device._id);
        if (latest) setStatus(latest.status);
      } catch (error) {
        console.warn('Không thể fetch trạng thái mới nhất:', error.message);
      } finally {
        setFetching(false);
      }
    };
    fetchLatestStatus();
  }, [device._id]);

  // ─── SOCKET REALTIME ───────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      const socket = await connectSocket();

      socket.on('device_status_changed', ({ device_id, status: newStatus }) => {
        if (!mounted) return;
        // Chỉ cập nhật nếu đúng thiết bị này
        if (device_id === device._id) {
          setStatus(newStatus);
        }
      });
    };

    setupSocket();

    return () => {
      mounted = false;
      const socket = getSocket();
      if (socket) socket.off('device_status_changed');
    };
  }, [device._id]);
  // ──────────────────────────────────────────────────────────────────────────

  const toggleStatus = async () => {
    const newStatus = status === 1 || status === true ? 0 : 1;
    const statusLabel = newStatus === 1 ? 'Bật' : 'Tắt';

    setLoading(true);
    try {
      const response = await api.put(`/devices/${device._id}/status`, {
        status: newStatus,
      });

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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  powerButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    marginVertical: 30,
  },
  statusLabelText: {
    marginTop: 50,
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
  },
  infoContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 50,
    backgroundColor: '#ffffff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: { fontSize: 15, fontWeight: '600', color: '#757575', letterSpacing: 0.5 },
  value: { fontSize: 15, fontWeight: '700', color: '#212121', textAlign: 'right', maxWidth: '60%' },
});