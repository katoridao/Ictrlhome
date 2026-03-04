import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
  TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

export default function StatisticsScreen({ navigation }) {
  const { styles: themeStyles, theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [totalKwh, setTotalKwh] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [deviceStats, setDeviceStats] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const houseId = await AsyncStorage.getItem('current_house_id');
      if (!houseId) return;

      // 1. Lấy giá điện hiện tại
      const priceRes = await api.get('/electricity-settings', { params: { house_id: houseId } });
      const price = priceRes.data?.price_per_kwh || 2000; // Mặc định 2000 nếu chưa set
      setCurrentPrice(price);

      // 2. Lấy danh sách thiết bị (để lấy công suất Watt)
      const devicesRes = await api.get('/devices', { params: { house_id: houseId } });
      const devices = devicesRes.data.devices || devicesRes.data || [];
      
      // Tạo map: device_id -> power_watt
      const devicePowerMap = {};
      const deviceNameMap = {};
      devices.forEach(d => {
        devicePowerMap[d._id] = d.power_watt || 0;
        deviceNameMap[d._id] = d.name;
      });

      // 3. Lấy nhật ký hoạt động (Logs)
      // Lưu ý: Backend cần trả về đủ logs để tính toán. Ở đây giả sử lấy logs của tháng/tuần
      const logsRes = await api.get('/device-logs', { params: { house_id: houseId, limit: 1000 } });
      
      let logs = [];
      if (Array.isArray(logsRes.data)) logs = logsRes.data;
      else if (logsRes.data?.device_log) logs = logsRes.data.device_log;
      else if (logsRes.data?.logs) logs = logsRes.data.logs;

      // --- THUẬT TOÁN TÍNH TOÁN TIÊU THỤ (FRONTEND) ---
      // Duyệt qua logs để tìm cặp ON - OFF và tính thời gian
      const statsByDevice = {}; // { deviceId: { kwh: 0, duration: 0 } }

      // Sắp xếp log tăng dần theo thời gian
      logs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const lastOnTime = {}; // Lưu thời điểm bật gần nhất của từng thiết bị

      logs.forEach(log => {
        const devId = log.device_id;
        const time = new Date(log.createdAt).getTime();

        if (log.action === 'ON') {
          lastOnTime[devId] = time;
        } else if (log.action === 'OFF' && lastOnTime[devId]) {
          const durationMs = time - lastOnTime[devId];
          const durationHours = durationMs / (1000 * 60 * 60); // Đổi ra giờ
          
          // Tính kWh: (Watt * Giờ) / 1000
          const watt = devicePowerMap[devId] || 0;
          const kwh = (watt * durationHours) / 1000;

          if (!statsByDevice[devId]) statsByDevice[devId] = { kwh: 0, durationHours: 0 };
          statsByDevice[devId].kwh += kwh;
          statsByDevice[devId].durationHours += durationHours;

          delete lastOnTime[devId]; // Reset sau khi đã tính cặp này
        }
      });

      // Tổng hợp dữ liệu hiển thị
      let sumKwh = 0;
      const statsArray = Object.keys(statsByDevice).map(devId => {
        const kwh = statsByDevice[devId].kwh;
        sumKwh += kwh;
        return {
          id: devId,
          name: deviceNameMap[devId] || 'Thiết bị đã xóa',
          kwh: kwh,
          cost: kwh * price,
          duration: statsByDevice[devId].durationHours
        };
      });

      setTotalKwh(sumKwh);
      setTotalCost(sumKwh * price);
      setDeviceStats(statsArray.sort((a, b) => b.kwh - a.kwh)); // Xếp giảm dần theo mức tiêu thụ

    } catch (error) {
      console.error("Lỗi tính toán thống kê:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Hàm format số liệu nhỏ
  const formatKwh = (num) => {
    if (num === 0) return "0";
    if (num < 0.01) return num.toFixed(4); // Hiển thị 4 số lẻ cho giá trị cực nhỏ
    return num.toFixed(2);
  };

  const formatCurrency = (num) => {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <StatusBar barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'} backgroundColor={themeStyles.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../../public/img/back.png')} style={{ width: 22, height: 22, tintColor: '#fff' }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thống Kê Tiêu Thụ</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeStyles.primary]} />}
      >
        {/* Tổng quan */}
        <View style={[styles.summaryCard, { backgroundColor: themeStyles.primary }]}>
          <Text style={styles.summaryLabel}>Tổng chi phí ước tính</Text>
          <Text style={styles.summaryCost}>{formatCurrency(totalCost)} VNĐ</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View>
              <Text style={styles.subLabel}>Điện năng tiêu thụ</Text>
              <Text style={styles.subValue}>{formatKwh(totalKwh)} kWh</Text>
            </View>
            <View>
              <Text style={styles.subLabel}>Đơn giá áp dụng</Text>
              <Text style={styles.subValue}>{formatCurrency(currentPrice)} đ/kWh</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>Chi tiết theo thiết bị</Text>

        {loading ? (
          <ActivityIndicator size="large" color={themeStyles.primary} style={{ marginTop: 20 }} />
        ) : deviceStats.length === 0 ? (
          <Text style={{ textAlign: 'center', color: themeStyles.subText, marginTop: 20 }}>Chưa có dữ liệu tiêu thụ</Text>
        ) : (
          deviceStats.map((item) => (
            <View key={item.id} style={[styles.deviceItem, { backgroundColor: themeStyles.card }]}>
              <View style={styles.deviceInfo}>
                <Text style={[styles.deviceName, { color: themeStyles.text }]}>{item.name}</Text>
                <Text style={[styles.deviceDuration, { color: themeStyles.subText }]}>
                  Hoạt động: {(item.duration * 60).toFixed(1)} phút
                </Text>
              </View>
              <View style={styles.deviceStats}>
                <Text style={[styles.deviceCost, { color: themeStyles.primary }]}>{formatCurrency(item.cost)} đ</Text>
                <Text style={[styles.deviceKwh, { color: themeStyles.subText }]}>{formatKwh(item.kwh)} kWh</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  body: { padding: 16 },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  summaryCost: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 16 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  subValue: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  deviceName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  deviceDuration: { fontSize: 12 },
  deviceStats: { alignItems: 'flex-end' },
  deviceCost: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  deviceKwh: { fontSize: 12 },
});