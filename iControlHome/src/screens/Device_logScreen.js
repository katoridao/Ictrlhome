import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../database/api';
import moment from 'moment';
import { connectSocket, getSocket } from '../database/socket';

export default function Device_logScreen() {
  const { theme, styles: themeStyles } = useTheme();
  const { t } = useContext(LanguageContext);

  const TIME_FILTERS = [t.today, t.last_7_days, t.last_30_days];
  const DEVICE_FILTERS = [t.all, t.device_type_light, t.device_type_fan];

  const [openFilter, setOpenFilter] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const [device, setDevice] = useState(t.all);
  const [time, setTime] = useState(t.today);

  const getDeviceTypeValue = deviceName => {
    if (deviceName === t.device_type_light) return 'light';
    if (deviceName === t.device_type_fan) return 'fan';
    return t.all;
  };

  const fetchData = useCallback(async () => {
    const houseId = await AsyncStorage.getItem('current_house_id');
    if (!houseId) throw new Error('Chưa chọn nhà');

    const params = { house_id: houseId };

    if (time === t.today) params.period = 'day';
    if (time === t.last_7_days) params.period = 'week';
    if (time === t.last_30_days) params.period = 'month';

    // thêm loại thiết bị vào params
    if (device !== t.all) {
      params.device_type = getDeviceTypeValue(device);
    }

    const response = await api.get('/device-logs', { params });

    return response.data.logs || [];
  }, [time, device, t]);

  useEffect(() => {
    if (isFocused) {
      const loadData = async () => {
        setLoading(true);

        try {
          const data = await fetchData();
          setHistoryData(data);
        } catch (error) {
          console.error('Lỗi tải nhật ký:', error);
          setHistoryData([]);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [isFocused, fetchData]);

  useEffect(() => {
    if (!isFocused) return;

    let mounted = true;

    const refreshLogsRealtime = async () => {
      if (!mounted) return;
      try {
        const data = await fetchData();
        if (!mounted) return;
        setHistoryData(data);
      } catch (error) {
        console.error('Lỗi cập nhật realtime nhật ký:', error);
      }
    };

    const setupSocket = async () => {
      try {
        const socket = await connectSocket();

        socket
          .off('device_status_changed')
          .on('device_status_changed', refreshLogsRealtime);
        socket.off('device-update').on('device-update', refreshLogsRealtime);
      } catch (error) {
        console.error('Lỗi kết nối socket nhật ký:', error);
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      const socket = getSocket();
      if (!socket) return;
      socket.off('device_status_changed');
      socket.off('device-update');
    };
  }, [isFocused, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const data = await fetchData();
      setHistoryData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

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
        <Image
          source={require('../../public/img/history.png')}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>{t.device_log}</Text>
      </View>

      {/* FILTER */}
      <View style={styles.filterWrapper}>
        <View style={styles.filterRow}>
          <FilterItem
            label={device}
            active={openFilter === 'device'}
            themeStyles={themeStyles}
            onPress={() =>
              setOpenFilter(openFilter === 'device' ? null : 'device')
            }
          />

          <FilterItem
            label={time}
            active={openFilter === 'time'}
            themeStyles={themeStyles}
            onPress={() => setOpenFilter(openFilter === 'time' ? null : 'time')}
          />
        </View>

        {openFilter && (
          <View
            style={[styles.dropdown, { backgroundColor: themeStyles.card }]}
          >
            {openFilter === 'device' &&
              DEVICE_FILTERS.map(item => (
                <DropdownOption
                  key={item}
                  label={item}
                  active={device === item}
                  themeStyles={themeStyles}
                  onPress={() => {
                    setDevice(item);
                    setOpenFilter(null);
                  }}
                />
              ))}

            {openFilter === 'time' &&
              TIME_FILTERS.map(item => (
                <DropdownOption
                  key={item}
                  label={item}
                  active={time === item}
                  themeStyles={themeStyles}
                  onPress={() => {
                    setTime(item);
                    setOpenFilter(null);
                  }}
                />
              ))}
          </View>
        )}
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={themeStyles.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={historyData}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeStyles.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Image
                source={require('../../public/img/history.png')}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: themeStyles.subText }]}>
                {t.no_log}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <HistoryItem
              type={item.device?.type}
              deviceName={item.device?.name || t.deleted_device}
              roomName={item.device?.room?.name || t.unknown_room}
              userName={item.user?.name || t.user}
              time={item.created_at}
              action={item.action}
              themeStyles={themeStyles}
              t={t}
            />
          )}
        />
      )}
    </View>
  );
}

function FilterItem({ label, active, onPress, themeStyles }) {
  return (
    <TouchableOpacity
      style={[
        styles.filterItem,
        {
          backgroundColor: active ? '#3b9cff' : themeStyles.card,
          borderColor: active ? '#3b9cff' : themeStyles.secondary,
        },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: active ? '#fff' : themeStyles.text }}>{label}</Text>
      <Image
        source={require('../../public/img/down.png')}
        style={[
          styles.filterIcon,
          { tintColor: active ? '#fff' : themeStyles.text },
        ]}
      />
    </TouchableOpacity>
  );
}

function DropdownOption({ label, active, onPress, themeStyles }) {
  return (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        active && { backgroundColor: 'rgba(59, 156, 255, 0.2)' },
      ]}
      onPress={onPress}
    >
      <Text
        style={{
          color: themeStyles.text,
          fontWeight: active ? 'bold' : 'normal',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HistoryItem({
  type,
  deviceName,
  roomName,
  userName,
  time,
  action,
  themeStyles,
  t,
}) {
  const getIcon = deviceType => {
    switch (deviceType) {
      case 'light':
        return require('../../public/img/light.png');
      case 'fan':
        return require('../../public/img/fan.png');
      case 'socket':
        return require('../../public/img/socket.png');
      default:
        return require('../../public/img/device_default.png');
    }
  };

  const formatDate = date => {
    if (!date) return '';
    return moment.utc(date).utcOffset(7).format('HH:mm DD/MM/YYYY');
  };

  const actionText = action === 'ON' ? t.turned_on : t.turned_off;
  const actionColor = action === 'ON' ? '#4CAF50' : '#F44336';
  const actionIcon = action === 'ON' ? '🟢' : '🔴';

  return (
    <View
      style={[
        styles.historyItem,
        { backgroundColor: themeStyles.card, shadowColor: themeStyles.text },
      ]}
    >
      <Image source={getIcon(type)} style={styles.deviceIcon} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, { color: themeStyles.text }]}>
            {deviceName}
          </Text>
          <Text style={[styles.itemAction, { color: actionColor }]}>
            {actionIcon} {actionText}
          </Text>
        </View>

        <View style={styles.itemRow}>
          <Image
            source={require('../../public/img/room.png')}
            style={styles.smallIcon}
          />
          <Text style={{ color: themeStyles.subText, fontSize: 12 }}>
            {roomName}
          </Text>
        </View>

        <View style={styles.itemRow}>
          <Image
            source={require('../../public/img/user.png')}
            style={styles.smallIcon}
          />
          <Text style={{ color: themeStyles.subText, fontSize: 12 }}>
            {userName}
          </Text>
        </View>

        <Text style={[styles.itemTime, { color: themeStyles.subText }]}>
          {formatDate(time)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    height: 70,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  filterWrapper: { padding: 16, zIndex: 1 },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
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
    width: 16,
    height: 16,
    marginLeft: 8,
  },

  dropdown: {
    position: 'absolute',
    top: 65,
    left: 16,
    right: 16,
    borderRadius: 12,
    elevation: 5,
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  historyItem: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 12,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    alignItems: 'center',
  },
  deviceIcon: {
    width: 32,
    height: 32,
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemAction: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  smallIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: '#888',
  },
  itemTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    tintColor: '#ccc',
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
  },
});
