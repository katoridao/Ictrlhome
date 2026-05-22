import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from 'react';
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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../database/api';
import { connectSocket, getSocket } from '../database/socket';

export default function StatisticsScreen({ navigation }) {
  const { styles: themeStyles, theme } = useTheme();
  const { t, language } = useContext(LanguageContext);

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const [serverNote, setServerNote] = useState('');
  const [userRole, setUserRole] = useState('MEMBER');
  const [isMember, setIsMember] = useState(null);
  const [memberChecked, setMemberChecked] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [timeFilter, setTimeFilter] = useState('week');
  const [monthKeys, setMonthKeys] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [openFilter, setOpenFilter] = useState(null);

  const appState = useRef(AppState.currentState);
  const socketRef = useRef(null);
  const lastUpdateRef = useRef({});

  // ===============================
  // TÍNH CHI PHÍ ƯỚC TÍNH
  // ===============================
  const calculateEstimatedElectricCost = useCallback(kwh => {
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
  }, []);

  const normalizeDeviceStats = useCallback(
    device => {
      const estimatedRuntime =
        device.estimated_runtime_seconds ?? device.runtime_seconds ?? 0;
      const estimatedEnergy =
        device.estimated_energy_kwh ?? device.energy_kwh ?? 0;
      const estimatedCost =
        device.estimated_cost_vnd ??
        device.cost ??
        calculateEstimatedElectricCost(estimatedEnergy);

      return {
        ...device,
        runtime_seconds: estimatedRuntime,
        energy_kwh: estimatedEnergy,
        estimated_runtime_seconds: estimatedRuntime,
        estimated_energy_kwh: estimatedEnergy,
        estimated_cost_vnd: estimatedCost,
      };
    },
    [calculateEstimatedElectricCost],
  );

  // ===============================
  // FETCH DATA (LOAD LẦN ĐẦU)
  // ===============================
  const fetchData = useCallback(async () => {
    try {
      const role = await AsyncStorage.getItem('user_role');
      setUserRole(role || 'MEMBER');

      const membershipResponse = await api.get('/houses/check-member');
      const joined = membershipResponse.data?.is_member === true;
      setIsMember(joined);
      setMemberChecked(true);

      if (joined && membershipResponse.data?.house_id) {
        await AsyncStorage.setItem(
          'current_house_id',
          membershipResponse.data.house_id,
        );
        await AsyncStorage.setItem(
          'current_house_name',
          membershipResponse.data.house_name || t.home,
        );
      }

      if ((role || 'MEMBER') !== 'OWNER' && !joined) {
        setDevices([]);
        setServerNote('');
        return;
      }

      const params = {
        period: timeFilter,
      };
      if (timeFilter === 'month' && selectedMonth) {
        params.month_key = selectedMonth;
      }

      const res = await api.get('/device-usages/realtime', { params });

      const devicesFromServer = res.data.devices || [];
      const formatted = devicesFromServer.map(normalizeDeviceStats);
      const months = Array.isArray(res.data?.month_keys)
        ? res.data.month_keys
        : [];

      setServerNote(typeof res.data?.note === 'string' ? res.data.note : '');
      setMonthKeys(months);
      if (!selectedMonth && months.length > 0) {
        setSelectedMonth(months[0]);
      }

      setDevices(formatted);
      const now = Date.now();
      const next = { ...lastUpdateRef.current };
      formatted.forEach(d => {
        next[String(d.device_id)] = now;
      });
      lastUpdateRef.current = next;
    } catch (error) {
      console.log('Fetch error:', error.message);
      setDevices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [normalizeDeviceStats, selectedMonth, t.home, timeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===============================
  // SOCKET REALTIME
  // ===============================
  const onDeviceRuntime = useCallback(
    devicesFromServer => {
      const formatted = (devicesFromServer || []).map(normalizeDeviceStats);

      setDevices(formatted);
      const now = Date.now();
      const next = { ...lastUpdateRef.current };
      formatted.forEach(d => {
        next[String(d.device_id)] = now;
      });
      lastUpdateRef.current = next;
    },
    [normalizeDeviceStats],
  );

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const socket = await connectSocket();
      if (!mounted) return;

      socketRef.current = socket;

      // chỉ đăng ký 1 handler, không bị chồng khi remount
      socket.off('device-runtime', onDeviceRuntime);
      socket.on('device-runtime', onDeviceRuntime);
    };

    setup();

    return () => {
      mounted = false;
      const s = socketRef.current || getSocket();
      s?.off('device-runtime', onDeviceRuntime);
    };
  }, [onDeviceRuntime]);

  // Khi quay lại screen thì fetch để đồng bộ ngay (kể cả lúc đang chạy)
  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      fetchData();
    });
    return () => unsubFocus?.();
  }, [navigation, fetchData]);

  // ===============================
  // APP STATE LISTENER
  // ===============================
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (appState.current.match(/inactive|background/) && state === 'active') {
        fetchData();
      }

      appState.current = state;
    });

    return () => subscription.remove();
  }, [fetchData]);

  // Re-render mỗi giây để UI chạy giây mượt,
  // nhưng runtime luôn dựa trên "lần server update gần nhất" + diff thời gian local.
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ===============================
  // TỔNG ĐIỆN NĂNG + CHI PHÍ ƯỚC TÍNH
  // ===============================
  const computedDevices = devices.map(item => {
    const baseRuntime = item.runtime_seconds || 0;
    const lastUpdate =
      lastUpdateRef.current[String(item.device_id)] || Date.now();
    const extra =
      item.isActive && tick >= 0
        ? Math.max(0, Math.floor((Date.now() - lastUpdate) / 1000))
        : 0;
    const runtime = baseRuntime + extra;
    const energyFromRuntime = ((item.power_watt || 0) * runtime) / 3600000;
    const energy = Number.isFinite(energyFromRuntime)
      ? energyFromRuntime
      : item.estimated_energy_kwh || 0;
    const cost = calculateEstimatedElectricCost(energy);

    return {
      ...item,
      display_runtime_seconds: runtime,
      display_energy_kwh: energy,
      display_cost_vnd: cost,
    };
  });

  const totalKwh = computedDevices.reduce(
    (sum, d) => sum + (d.display_energy_kwh || 0),
    0,
  );

  const totalCost = computedDevices.reduce(
    (sum, d) => sum + (d.display_cost_vnd || 0),
    0,
  );

  const formatKwh = num =>
    num === 0 ? '0' : num < 0.001 ? num.toFixed(5) : num.toFixed(3);

  const formatCurrency = num => {
    if (num < 1) return num.toFixed(3);
    return Math.round(num).toLocaleString(
      language === 'vi' ? 'vi-VN' : 'en-US',
    );
  };

  const estimationNote =
    language === 'vi' && serverNote ? serverNote : t.statistics_note;
  const notJoined = userRole !== 'OWNER' && isMember === false;
  const formatMonthLabel = monthKey => {
    const [year, month] = String(monthKey || '').split('-');
    if (!year || !month) return monthKey;
    return `${month}/${year}`;
  };

  const handleResetStatistics = () => {
    Alert.alert(
      t.statistics_reset_confirm_title,
      t.statistics_reset_confirm_message,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              setResetting(true);
              await api.post('/device-usages/reset-statistics');
              await fetchData();
              Alert.alert(t.success, t.statistics_reset_success);
            } catch (error) {
              Alert.alert(t.error, t.statistics_reset_error);
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../public/img/back.png')}
            style={{
              width: 22,
              height: 22,
              tintColor: '#fff',
            }}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t.statistics_title}</Text>

        <View style={{ width: 22 }} />
      </View>

      {!memberChecked && loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={themeStyles.primary} />
        </View>
      ) : notJoined ? (
        <View style={styles.centeredState}>
          <Image
            source={require('../../public/img/device_usage.png')}
            style={{ width: 80, height: 80, opacity: 0.35, marginBottom: 16 }}
          />
          <Text
            style={{ color: themeStyles.text, fontSize: 18, fontWeight: '700' }}
          >
            {t.not_joined_house}
          </Text>
          <Text
            style={{
              color: themeStyles.subText,
              textAlign: 'center',
              marginTop: 8,
              paddingHorizontal: 24,
            }}
          >
            {t.enter_admin_info}
          </Text>
        </View>
      ) : (
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
          <View style={styles.filterWrapper}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterItem,
                  {
                    backgroundColor:
                      openFilter === 'time' ? '#3b9cff' : themeStyles.card,
                    borderColor:
                      openFilter === 'time'
                        ? '#3b9cff'
                        : themeStyles.border || '#ddd',
                  },
                ]}
                onPress={() =>
                  setOpenFilter(openFilter === 'time' ? null : 'time')
                }
              >
                <Text
                  style={{
                    color: openFilter === 'time' ? '#fff' : themeStyles.text,
                  }}
                >
                  {timeFilter === 'week'
                    ? t.last_7_days
                    : selectedMonth
                    ? formatMonthLabel(selectedMonth)
                    : t.cost_threshold_filter_month}
                </Text>
                <Image
                  source={require('../../public/img/down.png')}
                  style={[
                    styles.filterIcon,
                    {
                      tintColor:
                        openFilter === 'time' ? '#fff' : themeStyles.text,
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>

            {openFilter === 'time' && (
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: themeStyles.card,
                    borderColor: themeStyles.border || '#ddd',
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    timeFilter === 'week' && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setTimeFilter('week');
                    setOpenFilter(null);
                  }}
                >
                  <Text style={{ color: themeStyles.text }}>
                    {t.last_7_days}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    timeFilter === 'month' && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setTimeFilter('month');
                    setOpenFilter(null);
                  }}
                >
                  <Text style={{ color: themeStyles.text }}>
                    {t.cost_threshold_filter_month}
                  </Text>
                </TouchableOpacity>
                {timeFilter === 'month' &&
                  monthKeys.map(monthKey => (
                    <TouchableOpacity
                      key={monthKey}
                      style={[
                        styles.dropdownItem,
                        selectedMonth === monthKey && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedMonth(monthKey);
                        setOpenFilter(null);
                      }}
                    >
                      <Text style={{ color: themeStyles.text }}>
                        {formatMonthLabel(monthKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>

          {/* SUMMARY */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: themeStyles.primary },
            ]}
          >
            <Text style={styles.summaryLabel}>{t.total_cost}</Text>

            <Text style={styles.summaryCost}>
              {formatCurrency(totalCost)} {t.vnd}
            </Text>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View>
                <Text style={styles.subLabel}>{t.total_energy}</Text>
                <Text style={styles.subValue}>
                  {formatKwh(totalKwh)} {t.kwh}
                </Text>
              </View>

              <View>
                <Text style={styles.subLabel}>{t.active_devices}</Text>
                <Text style={styles.subValue}>
                  {devices.filter(d => d.isActive).length} {t.devices_count}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.noteCard,
              {
                backgroundColor: themeStyles.card,
                borderColor: themeStyles.border || '#ddd',
              },
            ]}
          >
            <Text style={[styles.noteText, { color: themeStyles.subText }]}>
              {estimationNote}
            </Text>
          </View>

          {/* <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: themeStyles.card,
                borderColor: themeStyles.border || '#ddd',
                opacity: resetting ? 0.6 : 1,
              },
            ]}
            onPress={handleResetStatistics}
            disabled={resetting || userRole !== 'OWNER'}
          >
            <Text style={[styles.resetButtonText, { color: themeStyles.text }]}>
              {resetting ? t.loading : t.statistics_reset_button}
            </Text>
          </TouchableOpacity> */}

          <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>
            {t.device_details}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={themeStyles.primary} />
          ) : devices.length === 0 ? (
            <Text
              style={{
                textAlign: 'center',
                color: themeStyles.subText,
                marginTop: 20,
              }}
            >
              {t.no_device_data}
            </Text>
          ) : (
            computedDevices.map(item => {
              const runtime = item.display_runtime_seconds || 0;
              const minutes = Math.floor(runtime / 60);
              const seconds = Math.floor(runtime % 60);

              return (
                <View
                  key={item.device_id}
                  style={[
                    styles.deviceItem,
                    {
                      backgroundColor: themeStyles.card,
                    },
                  ]}
                >
                  <View style={styles.deviceInfo}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={[styles.deviceName, { color: themeStyles.text }]}
                      >
                        {item.device_name}
                      </Text>

                      {item.isActive && <View style={styles.activeDot} />}
                    </View>

                    <Text
                      style={[
                        styles.deviceDuration,
                        {
                          color: item.isActive
                            ? '#4CAF50'
                            : themeStyles.subText,
                        },
                      ]}
                    >
                      {item.isActive ? `${t.running}: ` : `${t.used}: `}
                      {minutes}m {seconds}s
                    </Text>
                  </View>

                  <View style={styles.deviceStats}>
                    <Text
                      style={[
                        styles.deviceCost,
                        { color: themeStyles.primary },
                      ]}
                    >
                      ~ {formatCurrency(item.display_cost_vnd)} {t.vnd}
                    </Text>

                    <Text
                      style={[styles.deviceKwh, { color: themeStyles.subText }]}
                    >
                      ~ {formatKwh(item.display_energy_kwh)} {t.kwh}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  body: { padding: 16 },
  filterWrapper: {
    marginBottom: 16,
    zIndex: 2,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterIcon: {
    width: 14,
    height: 14,
    marginLeft: 8,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(59, 156, 255, 0.16)',
  },

  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
  },

  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },

  summaryCost: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  subLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },

  subValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },

  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  resetButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  noteText: {
    fontSize: 12,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },

  deviceInfo: { flex: 1 },

  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  deviceDuration: {
    fontSize: 12,
    fontWeight: '500',
  },

  deviceStats: { alignItems: 'flex-end' },

  deviceCost: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  deviceKwh: { fontSize: 12 },

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
});
