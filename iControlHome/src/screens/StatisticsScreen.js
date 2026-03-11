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

import { useTheme } from "../context/ThemeContext";
import api from "../database/api";
import { useFocusEffect } from "@react-navigation/native";

export default function StatisticsScreen({ navigation }) {

  const { styles: themeStyles, theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState([]);

  // ===============================
  // FETCH DATA FROM BACKEND
  // ===============================
  const fetchData = useCallback(async () => {

    try {

      const res = await api.get("/device-usages/realtime");

      const devicesFromServer = res.data.devices || [];

      setDevices(
        devicesFromServer.map((d) => ({
          ...d,
          runtime_seconds: d.runtime_seconds || 0,
          energy_kwh: d.energy_kwh || 0,
          cost: d.cost || 0,
          power_watt: d.power_watt || 0,
        }))
      );

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
  // REALTIME TIMER (1 SECOND)
  // ===============================
  useFocusEffect(
  useCallback(() => {

    // khi vào màn hình -> sync dữ liệu từ server
    fetchData();

    const timer = setInterval(() => {

      setDevices((prev) =>
        prev.map((d) => {

          if (!d.isActive) return d;

          const runtime = d.runtime_seconds + 1;

          const energy =
            (d.power_watt * runtime) / 3600000;

          const cost = energy * 1806;

          return {
            ...d,
            runtime_seconds: runtime,
            energy_kwh: energy,
            cost: cost
          };

        })
      );

    }, 1000);

    return () => clearInterval(timer);

  }, [fetchData])
);

  const onRefresh = () => {

    setRefreshing(true);

    fetchData();

  };

  // ===============================
  // TOTAL ENERGY + COST
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
    num === 0 ? "0" : num < 0.001 ? num.toFixed(5) : num.toFixed(3);

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
        barStyle={theme === "DARK" ? "light-content" : "dark-content"}
        backgroundColor={themeStyles.primary}
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: themeStyles.primary },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
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

        {/* SUMMARY CARD */}
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
                {devices.filter((d) => d.isActive).length} thiết bị
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

            const minutes = Math.floor(
              item.runtime_seconds / 60
            );

            const seconds = Math.floor(
              item.runtime_seconds % 60
            );

            return (

              <View
                key={item.device_id || item._id}
                style={[
                  styles.deviceItem,
                  { backgroundColor: themeStyles.card },
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
    fontWeight: "500",
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

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginLeft: 8,
  },

});