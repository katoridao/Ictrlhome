import React, { useState, useCallback, useEffect } from 'react';
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
import api from '../database/api';

const TIME_FILTERS = ['Hôm nay', '7 ngày trước', '30 ngày trước'];
const DEVICE_FILTERS = ['Tất cả', 'Đèn', 'Quạt', 'Ổ cắm', 'Cảm biến'];

export default function Device_logScreen() {
  const { theme, styles: themeStyles } = useTheme();

  const [openFilter, setOpenFilter] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const [device, setDevice] = useState('Tất cả');
  const [time, setTime] = useState('Hôm nay');

  const fetchData = useCallback(async () => {
    const houseId = await AsyncStorage.getItem('current_house_id');
    if (!houseId) throw new Error('Chưa chọn nhà');

    const params = { house_id: houseId };

    if (time === 'Hôm nay') params.period = 'day';
    if (time === '7 ngày trước') params.period = 'week';
    if (time === '30 ngày trước') params.period = 'month';

    const response = await api.get('/device-logs', { params });

    return response.data.logs || [];
  }, [time]);

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
        <Text style={styles.headerTitle}>Nhật ký thiết bị</Text>
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
          style={{ marginTop: 20 }}
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
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              Chưa có nhật ký hoạt động
            </Text>
          }
          renderItem={({ item }) => (
            <HistoryItem
              type={item.device?.type}
              deviceName={item.device?.name || 'Thiết bị đã xóa'}
              userName={item.user?.name || 'Người dùng'}
              time={item.created_at}
              action={item.action}
              themeStyles={themeStyles}
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
        { backgroundColor: themeStyles.card },
        active && { borderColor: '#3b9cff', borderWidth: 1 },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: themeStyles.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

function DropdownOption({ label, active, onPress, themeStyles }) {
  return (
    <TouchableOpacity
      style={[styles.dropdownItem, active && { backgroundColor: '#3b9cff' }]}
      onPress={onPress}
    >
      <Text style={{ color: active ? '#fff' : themeStyles.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

function HistoryItem({
  type,
  deviceName,
  userName,
  time,
  action,
  themeStyles,
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

    const d = new Date(date);

    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();

    return `${h}:${m} ${day}/${mon}/${y}`;
  };

  return (
    <View style={[styles.historyItem, { backgroundColor: themeStyles.card }]}>
      <Image source={getIcon(type)} style={styles.deviceIcon} />

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[styles.itemTitle, { color: themeStyles.text }]}>
            {deviceName}
          </Text>

          <Text style={{ color: themeStyles.subText, fontSize: 11 }}>
            {formatDate(time)}
          </Text>
        </View>

        <Text style={{ color: themeStyles.subText, fontSize: 12 }}>
          Người dùng: {userName}
        </Text>

        <Text
          style={{
            color: action === 'ON' ? '#4CAF50' : '#F44336',
            fontWeight: '600',
          }}
        >
          {action === 'ON' ? '🟢 Đã Bật' : '🔴 Đã Tắt'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    height: 70,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },

  filterWrapper: { padding: 16 },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  filterItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },

  dropdownItem: {
    padding: 14,
  },

  body: {
    paddingHorizontal: 16,
  },

  historyItem: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 12,
  },

  deviceIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
});
