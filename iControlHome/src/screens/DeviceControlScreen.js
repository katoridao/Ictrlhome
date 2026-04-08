import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { LanguageContext } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';
import { connectSocket, getSocket } from '../database/socket';

export default function DeviceControlScreen({ route }) {
  const { device } = route.params;
  const { t } = useContext(LanguageContext);
  const { styles: themeStyles } = useTheme();
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

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const onStatusChanged = ({ device_id, status: newStatus }) => {
        if (!mounted) return;
        if (device_id === device._id) {
          console.log('[DeviceControl] Status changed from socket:', newStatus);
          setStatus(newStatus);
        }
      };

      const setupSocket = async () => {
        try {
          const socket = await connectSocket();
          socket
            .off('device_status_changed')
            .on('device_status_changed', onStatusChanged);
          console.log('[DeviceControl] Socket listener registered');
        } catch (err) {
          console.error('[DeviceControl] Socket setup error:', err);
        }
      };

      setupSocket();

      return () => {
        mounted = false;
        const socket = getSocket();
        if (socket) {
          socket.off('device_status_changed');
          console.log('[DeviceControl] Cleaning up socket listener');
        }
      };
    }, [device._id]),
  );

  const toggleStatus = async () => {
    const newStatus = status === 1 || status === true ? 0 : 1;

    setLoading(true);
    try {
      // Đồng bộ backend (backend sẽ gọi ESP32 nếu là thiết bị đèn)
      const response = await api.put(`/devices/${device._id}/status`, {
        status: newStatus,
      });

      if (response.status === 200) {
        if (response.data?.esp32) {
          console.log('[ESP32] Result from backend:', response.data.esp32);
        }
        setStatus(newStatus);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.detail?.error ||
        t.unable_to_update;
      Toast.show({ type: 'error', text1: t.error, text2: message });
    } finally {
      setLoading(false);
    }
  };

  const isOn = status === 1 || status === true;

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      {/* Thông tin thiết bị */}
      <View
        style={[styles.infoContainer, { backgroundColor: themeStyles.card }]}
      >
        <View
          style={[styles.infoRow, { borderBottomColor: themeStyles.border }]}
        >
          <Text style={[styles.label, { color: themeStyles.subText }]}>
            {t.device_name_label}
          </Text>
          <Text style={[styles.value, { color: themeStyles.text }]}>
            {device.name}
          </Text>
        </View>
        <View
          style={[styles.infoRow, { borderBottomColor: themeStyles.border }]}
        >
          <Text style={[styles.label, { color: themeStyles.subText }]}>
            {t.device_type_label}
          </Text>
          <Text style={[styles.value, { color: themeStyles.text }]}>
            {device.type}
          </Text>
        </View>
        {/* <View
          style={[styles.infoRow, { borderBottomColor: themeStyles.border }]}
        >
          <Text style={[styles.label, { color: themeStyles.subText }]}>
            {t.device_ip_addr_label}
          </Text>
          <Text style={[styles.value, { color: themeStyles.text }]}>
            {device.esp32_ip || t.not_configured}
          </Text>
        </View> */}
        <View
          style={[styles.infoRow, { borderBottomColor: themeStyles.border }]}
        >
          <Text style={[styles.label, { color: themeStyles.subText }]}>
            {t.power_watt_label}
          </Text>
          <Text style={[styles.value, { color: themeStyles.text }]}>
            {device.power_watt} W
          </Text>
        </View>
      </View>

      {/* Nút bật tắt */}
      <TouchableOpacity
        style={[
          styles.powerButton,
          { backgroundColor: isOn ? '#4CAF50' : '#F44336' },
        ]}
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
      <Text style={[styles.statusLabelText, { color: themeStyles.subText }]}>
        {t.status_label}{' '}
        <Text style={{ color: isOn ? '#4CAF50' : '#F44336' }}>
          {fetching ? t.loading : isOn ? t.status_on : t.status_off}
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
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: '60%',
  },
});
