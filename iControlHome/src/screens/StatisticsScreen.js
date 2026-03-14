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
  AppState,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import api from "../database/api";
import { connectSocket, getSocket } from "../database/socket";

export default function StatisticsScreen({ navigation }) {
  const { styles: themeStyles, theme } = useTheme();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const appState = useRef(AppState.currentState);
  const socketRef = useRef(null);
  const lastUpdateRef = useRef({});

  // ===============================
  // TÍNH TIỀN ĐIỆN
  // ===============================
  const calculateElectricCost = (kwh) => {
    const rates = [
      { limit: 50, rate: 1484 },
      { limit: 100, rate: 1533 },
      { limit: 200, rate: 1786 },
      { limit: Infinity, rate: 2242 },
    ];

    let cost = 0;
    let remaining = kwh;

    for (const { limit, rate } of rates) {
      const use = Math.min(remaining, limit);
      cost += use * rate;
      remaining -= use;
      if (remaining <= 0) break;
    }

    return cost;
  };

  // ===============================
  // FETCH DATA (LOAD LẦN ĐẦU)
  // ===============================
  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/device-usages/realtime");

      const devicesFromServer = res.data.devices || [];

      const formatted = devicesFromServer.map((d) => {
        const runtime = d.runtime_seconds || 0;
        const energy = d.energy_kwh || 0;

        return {
          ...d,
          runtime_seconds: runtime,
          energy_kwh: energy,
          cost: calculateElectricCost(energy),
        };
      });

      setDevices(formatted);
      const now = Date.now();
      const next = { ...lastUpdateRef.current };
      formatted.forEach((d) => {
        next[String(d.device_id)] = now;
      });
      lastUpdateRef.current = next;
    } catch (error) {
      console.log("Fetch error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===============================
  // SOCKET REALTIME
  // ===============================
  const onDeviceRuntime = useCallback(
    (devicesFromServer) => {
      const formatted = (devicesFromServer || []).map((d) => {
        const runtime = d.runtime_seconds || 0;
        const energy = d.energy_kwh || 0;

        return {
          ...d,
          runtime_seconds: runtime,
          energy_kwh: energy,
          cost: calculateElectricCost(energy),
        };
      });

      setDevices(formatted);
      const now = Date.now();
      const next = { ...lastUpdateRef.current };
      formatted.forEach((d) => {
        next[String(d.device_id)] = now;
      });
      lastUpdateRef.current = next;
    },
    [calculateElectricCost]
  );

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const socket = await connectSocket();
      if (!mounted) return;

      socketRef.current = socket;

      // chỉ đăng ký 1 handler, không bị chồng khi remount
      socket.off("device-runtime", onDeviceRuntime);
      socket.on("device-runtime", onDeviceRuntime);
    };

    setup();

    return () => {
      mounted = false;
      const s = socketRef.current || getSocket();
      s?.off("device-runtime", onDeviceRuntime);
    };
  }, [onDeviceRuntime]);

  // Khi quay lại screen thì fetch để đồng bộ ngay (kể cả lúc đang chạy)
  useEffect(() => {
    const unsubFocus = navigation.addListener("focus", () => {
      fetchData();
    });
    return () => unsubFocus?.();
  }, [navigation, fetchData]);

  // ===============================
  // APP STATE LISTENER
  // ===============================
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (state) => {
        if (
          appState.current.match(/inactive|background/) &&
          state === "active"
        ) {
          fetchData();
        }

        appState.current = state;
      }
    );

    return () => subscription.remove();
  }, [fetchData]);

  // Re-render mỗi giây để UI chạy giây mượt,
  // nhưng runtime luôn dựa trên "lần server update gần nhất" + diff thời gian local.
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ===============================
  // TỔNG KWH + COST
  // ===============================
  const totalKwh = devices.reduce(
    (sum, d) => sum + (d.energy_kwh || 0),
    0
  );

  const totalCost = devices.reduce(
    (sum, d) => sum + (d.cost || 0),
    0
  );

  const formatKwh = (num) =>
    num === 0
      ? "0"
      : num < 0.001
      ? num.toFixed(5)
      : num.toFixed(3);

  const formatCurrency = (num) => {
    if (num < 1) return num.toFixed(3);
    return Math.round(num).toLocaleString("vi-VN");
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeStyles.background },
      ]}
    >
      <StatusBar
        barStyle={
          theme === "DARK"
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={themeStyles.primary}
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: themeStyles.primary },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require("../../public/img/back.png")}
            style={{
              width: 22,
              height: 22,
              tintColor: "#fff",
            }}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Thống Kê Tiêu Thụ
        </Text>

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
        {/* SUMMARY */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: themeStyles.primary },
          ]}
        >
          <Text style={styles.summaryLabel}>
            Tổng chi phí các thiết bị
          </Text>

          <Text style={styles.summaryCost}>
            {formatCurrency(totalCost)} VNĐ
          </Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.subLabel}>
                Tổng điện năng
              </Text>
              <Text style={styles.subValue}>
                {formatKwh(totalKwh)} kWh
              </Text>
            </View>

            <View>
              <Text style={styles.subLabel}>
                Đang hoạt động
              </Text>
              <Text style={styles.subValue}>
                {
                  devices.filter((d) => d.isActive)
                    .length
                }{" "}
                thiết bị
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            { color: themeStyles.text },
          ]}
        >
          Chi tiết từng thiết bị
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={themeStyles.primary}
          />
        ) : devices.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: themeStyles.subText,
              marginTop: 20,
            }}
          >
            Không có dữ liệu thiết bị
          </Text>
        ) : (
          devices.map((item) => {
            const baseRuntime = item.runtime_seconds || 0;
            const lastUpdate = lastUpdateRef.current[String(item.device_id)] || Date.now();
            const extra =
              item.isActive ? Math.max(0, Math.floor((Date.now() - lastUpdate) / 1000)) : 0;
            const runtime = baseRuntime + extra;
            const minutes = Math.floor(runtime / 60);
            const seconds = Math.floor(runtime % 60);

            return (
              <View
                key={item.device_id}
                style={[
                  styles.deviceItem,
                  {
                    backgroundColor:
                      themeStyles.card,
                  },
                ]}
              >
                <View style={styles.deviceInfo}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={[
                        styles.deviceName,
                        { color: themeStyles.text },
                      ]}
                    >
                      {item.device_name}
                    </Text>

                    {item.isActive && (
                      <View style={styles.activeDot} />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.deviceDuration,
                      {
                        color: item.isActive
                          ? "#4CAF50"
                          : themeStyles.subText,
                      },
                    ]}
                  >
                    {item.isActive
                      ? "⚡ Đang chạy: "
                      : "⌛ Đã dùng: "}
                    {minutes}ph {seconds}s
                  </Text>
                </View>

                <View style={styles.deviceStats}>
                  <Text
                    style={[
                      styles.deviceCost,
                      { color: themeStyles.primary },
                    ]}
                  >
                    {formatCurrency(item.cost)} đ
                  </Text>

                  <Text
                    style={[
                      styles.deviceKwh,
                      { color: themeStyles.subText },
                    ]}
                  >
                    {formatKwh(item.energy_kwh)} kWh
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

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

  body: { padding: 16 },

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

  deviceInfo: { flex: 1 },

  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  deviceDuration: {
    fontSize: 12,
    fontWeight: "500",
  },

  deviceStats: { alignItems: "flex-end" },

  deviceCost: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },

  deviceKwh: { fontSize: 12 },

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginLeft: 8,
  },
});