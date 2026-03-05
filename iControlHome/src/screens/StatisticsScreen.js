import React, { useState, useEffect, useCallback } from "react";
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

  const [totalKwh, setTotalKwh] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [deviceStats, setDeviceStats] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(2000);

  const fetchData = useCallback(async () => {
    try {
      const houseId = await AsyncStorage.getItem("current_house_id");
      if (!houseId) return;

      const price = 10000;
      setCurrentPrice(price);

      const devicesRes = await api.get("/devices", {
        params: { house_id: houseId },
      });

      const devices = devicesRes.data?.devices || [];

      const devicePowerMap = {};
      const deviceNameMap = {};

      devices.forEach((d) => {
        devicePowerMap[d._id] = d.power_watt || 0;
        deviceNameMap[d._id] = d.name;
      });

      const logsRes = await api.get("/device-logs", {
        params: { house_id: houseId },
      });

      const logs = logsRes.data?.logs || [];

      const statsByDevice = {};
      const lastOnTime = {};

      logs.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      logs.forEach((log) => {
        const devId = log.device?.id;
        const time = new Date(log.created_at).getTime();

        if (!devId || !time) return;

        if (log.action === "ON") {
          lastOnTime[devId] = time;
        } else if (log.action === "OFF" && lastOnTime[devId]) {
          const durationMs = time - lastOnTime[devId];
          const durationHours = durationMs / (1000 * 60 * 60);

          const watt = devicePowerMap[devId] || 0;
          const kwh = (watt * durationHours) / 1000;

          if (!statsByDevice[devId]) {
            statsByDevice[devId] = { kwh: 0, durationHours: 0 };
          }

          statsByDevice[devId].kwh += kwh;
          statsByDevice[devId].durationHours += durationHours;

          delete lastOnTime[devId];
        }
      });

      let sumKwh = 0;

      const statsArray = Object.keys(statsByDevice).map((devId) => {
        const kwh = statsByDevice[devId].kwh;
        const duration = statsByDevice[devId].durationHours;

        sumKwh += kwh;

        return {
          id: devId,
          name: deviceNameMap[devId] || "Thiết bị",
          kwh,
          cost: kwh * price,
          duration,
        };
      });

      setTotalKwh(sumKwh);
      setTotalCost(sumKwh * price);
      setDeviceStats(statsArray.sort((a, b) => b.kwh - a.kwh));
    } catch (error) {
      console.log(
        "Statistics error:",
        error.response?.data || error.message
      );
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

  const formatKwh = (num) => {
    if (num === 0) return "0";
    if (num < 0.01) return num.toFixed(4);
    return num.toFixed(2);
  };

  const formatCurrency = (num) => {
  return Math.round(num).toLocaleString("vi-VN");
};

  const formatNumber = (num) => {
  return Math.round(num);
};

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <StatusBar
        barStyle={theme === "DARK" ? "light-content" : "dark-content"}
        backgroundColor={themeStyles.primary}
      />

      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require("../../public/img/back.png")}
            style={{ width: 22, height: 22, tintColor: "#fff" }}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thống Kê Tiêu Thụ</Text>

        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeStyles.primary]}
          />
        }
      >
        <View style={[styles.summaryCard, { backgroundColor: themeStyles.primary }]}>
          <Text style={styles.summaryLabel}>Tổng chi phí ước tính</Text>

          <Text style={styles.summaryCost}>
            {formatCurrency(totalCost)} VNĐ
          </Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.subLabel}>Điện năng tiêu thụ</Text>
              <Text style={styles.subValue}>{formatKwh(totalKwh)} kWh</Text>
            </View>

            <View>
              <Text style={styles.subLabel}>Đơn giá</Text>
              <Text style={styles.subValue}>
                {formatCurrency(currentPrice)} đ/kWh
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>
          Chi tiết theo thiết bị
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={themeStyles.primary}
            style={{ marginTop: 20 }}
          />
        ) : deviceStats.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: themeStyles.subText,
              marginTop: 20,
            }}
          >
            Chưa có dữ liệu tiêu thụ
          </Text>
        ) : (
          deviceStats.map((item) => (
            <View
              key={item.id}
              style={[styles.deviceItem, { backgroundColor: themeStyles.card }]}
            >
              <View style={styles.deviceInfo}>
                <Text
                  style={[styles.deviceName, { color: themeStyles.text }]}
                >
                  {item.name}
                </Text>

                <Text
                  style={[styles.deviceDuration, { color: themeStyles.subText }]}
                >
                  Hoạt động: {formatNumber(item.duration * 60)} phút
                </Text>
              </View>

              <View style={styles.deviceStats}>
                <Text
                  style={[styles.deviceCost, { color: themeStyles.primary }]}
                >
                  {formatCurrency(item.cost)} đ
                </Text>

                <Text
                  style={[styles.deviceKwh, { color: themeStyles.subText }]}
                >
                  {formatKwh(item.kwh)} kWh
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    elevation: 4,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  body: {
    padding: 16,
  },

  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
  },

  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 4,
  },

  summaryCost: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  subLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },

  subValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },

  deviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },

  deviceInfo: {
    flex: 1,
  },

  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  deviceDuration: {
    fontSize: 12,
  },

  deviceStats: {
    alignItems: "flex-end",
  },

  deviceCost: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },

  deviceKwh: {
    fontSize: 12,
  },
});