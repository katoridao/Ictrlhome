import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
  TouchableOpacity,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import api from "../database/api";

export default function StatisticsScreen({ navigation }) {
  const { styles: themeStyles, theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dữ liệu gốc từ API
  const [devicePowerMap, setDevicePowerMap] = useState({});
  const [deviceNameMap, setDeviceNameMap] = useState({});
  const [pastStats, setPastStats] = useState({}); // Lưu thời gian đã dùng (ms) trong quá khứ
  const [activeDevices, setActiveDevices] = useState({}); // Lưu mốc thời gian (ms) khi thiết bị ON
  
  const [currentPrice] = useState(10000); // Đơn giá cố định
  const [ticker, setTicker] = useState(Date.now()); // State để ép render mỗi giây

  // 1. Bộ đếm thời gian thực mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Hàm lấy dữ liệu từ API
  const fetchData = useCallback(async () => {
    try {
      const houseId = await AsyncStorage.getItem("current_house_id");
      if (!houseId) return;

      // Lấy danh sách thiết bị để biết công suất (Power)
      const devicesRes = await api.get("/devices", {
        params: { house_id: houseId },
      });
      const devices = devicesRes.data?.devices || [];
      const pMap = {};
      const nMap = {};
      devices.forEach((d) => {
        pMap[d._id] = d.power_watt || 0;
        nMap[d._id] = d.name;
      });
      setDevicePowerMap(pMap);
      setDeviceNameMap(nMap);

      // Lấy Logs
      const logsRes = await api.get("/device-logs", {
        params: { house_id: houseId },
      });
      const logs = logsRes.data?.logs || [];
      logs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const tempPastStats = {}; // { devId: durationMs }
      const tempActiveDevices = {}; // { devId: startTimeMs }

      logs.forEach((log) => {
        const devId = log.device?.id;
        const time = new Date(log.created_at).getTime();
        if (!devId) return;

        if (log.action === "ON") {
          tempActiveDevices[devId] = time;
        } else if (log.action === "OFF") {
          if (tempActiveDevices[devId]) {
            const durationMs = time - tempActiveDevices[devId];
            tempPastStats[devId] = (tempPastStats[devId] || 0) + durationMs;
            delete tempActiveDevices[devId]; // Tắt rồi thì không còn active
          }
        }
      });

      setPastStats(tempPastStats);
      setActiveDevices(tempActiveDevices);
    } catch (error) {
      console.log("Statistics error:", error.message);
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

  // 3. Hàm tính toán Real-time khi Render
  const calculateLiveStats = () => {
    let totalKwh = 0;
    const items = Object.keys(deviceNameMap).map((devId) => {
      const pastMs = pastStats[devId] || 0;
      const startTime = activeDevices[devId];
      
      // Nếu đang ON, lấy (Giờ hiện tại - Giờ bật)
      const liveMs = startTime ? (Date.now() - startTime) : 0;
      const totalMs = pastMs + liveMs;
      
      const durationHours = totalMs / (1000 * 60 * 60);
      const kwh = (devicePowerMap[devId] * durationHours) / 1000;
      
      totalKwh += kwh;

      return {
        id: devId,
        name: deviceNameMap[devId],
        kwh: kwh,
        cost: kwh * currentPrice,
        totalMinutes: totalMs / 60000,
        isActive: !!startTime,
      };
    });

    return {
      totalKwh,
      totalCost: totalKwh * currentPrice,
      deviceStats: items.sort((a, b) => b.kwh - a.kwh),
    };
  };

  const { totalKwh, totalCost, deviceStats } = calculateLiveStats();

  // Helper định dạng
  const formatKwh = (num) => (num === 0 ? "0" : num < 0.01 ? num.toFixed(4) : num.toFixed(2));
  const formatCurrency = (num) => Math.round(num).toLocaleString("vi-VN");

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <StatusBar barStyle={theme === "DARK" ? "light-content" : "dark-content"} backgroundColor={themeStyles.primary} />

      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require("../../public/img/back.png")} style={{ width: 22, height: 22, tintColor: "#fff" }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thống Kê Tiêu Thụ</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeStyles.primary]} />}
      >
        {/* Card Tổng Quan */}
        <View style={[styles.summaryCard, { backgroundColor: themeStyles.primary }]}>
          <Text style={styles.summaryLabel}>Tổng chi phí ước tính (Real-time)</Text>
          <Text style={styles.summaryCost}>{formatCurrency(totalCost)} VNĐ</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View>
              <Text style={styles.subLabel}>Điện năng tiêu thụ</Text>
              <Text style={styles.subValue}>{formatKwh(totalKwh)} kWh</Text>
            </View>
            <View>
              <Text style={styles.subLabel}>Đơn giá</Text>
              <Text style={styles.subValue}>{formatCurrency(currentPrice)} đ/kWh</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>Chi tiết theo thiết bị</Text>

        {loading ? (
          <ActivityIndicator size="large" color={themeStyles.primary} style={{ marginTop: 20 }} />
        ) : deviceStats.length === 0 ? (
          <Text style={{ textAlign: "center", color: themeStyles.subText, marginTop: 20 }}>Chưa có dữ liệu tiêu thụ</Text>
        ) : (
          deviceStats.map((item) => (
            <View key={item.id} style={[styles.deviceItem, { backgroundColor: themeStyles.card }]}>
              <View style={styles.deviceInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.deviceName, { color: themeStyles.text }]}>{item.name}</Text>
                  {item.isActive && (
                    <View style={styles.activeDot} />
                  )}
                </View>
                <Text style={[styles.deviceDuration, { color: item.isActive ? "#4CAF50" : themeStyles.subText }]}>
                  {item.isActive ? "Đang chạy: " : "Đã dùng: "}
                  {Math.floor(item.totalMinutes)} ph {Math.floor((item.totalMinutes * 60) % 60)} giây
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
  header: { height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, elevation: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  body: { padding: 16 },
  summaryCard: { borderRadius: 16, padding: 20, marginBottom: 24, elevation: 4 },
  summaryLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 4 },
  summaryCost: { color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 16 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  subLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  subValue: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  deviceItem: { flexDirection: "row", justifyContent: "space-between", padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  deviceDuration: { fontSize: 12, fontWeight: '500' },
  deviceStats: { alignItems: "flex-end" },
  deviceCost: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  deviceKwh: { fontSize: 12 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginLeft: 8 }
});