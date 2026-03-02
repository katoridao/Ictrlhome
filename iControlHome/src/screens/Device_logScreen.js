
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

// --- Constants ---
const TIME_FILTERS = ['Hôm nay', '7 ngày trước', '30 ngày trước'];
// Dựa trên các loại thiết bị trong AddDeviceModal.js để đảm bảo tính nhất quán
const DEVICE_FILTERS = ['Tất cả', 'Đèn', 'Quạt', 'Ổ cắm', 'Cảm biến'];


export default function Device_logScreen({ navigation }) {
  const { theme, styles: themeStyles } = useTheme();

  const [openFilter, setOpenFilter] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const [device, setDevice] = useState('Thiết bị');
  const [time, setTime] = useState('Hôm nay');

  // Hàm này chỉ tập trung vào việc lấy dữ liệu, không quản lý state
  const fetchData = useCallback(async () => {
    const houseId = await AsyncStorage.getItem('current_house_id');
    if (!houseId) throw new Error('Chưa chọn nhà');

    const params = { house_id: houseId };
    if (device !== 'Thiết bị' && device !== 'Tất cả') {
      // Chuyển đổi tên tiếng Việt sang value tiếng Anh để backend xử lý
      const deviceTypeMap = { 'Đèn': 'light', 'Quạt': 'fan', 'Ổ cắm': 'socket', 'Cảm biến': 'sensor' };
      params.device_type = deviceTypeMap[device] || device.toLowerCase();
    }
    if (time === 'Hôm nay') params.period = 'day';
    else if (time === '7 ngày trước') params.period = 'week';
    else if (time === '30 ngày trước') params.period = 'month';

    // API endpoint đã được đổi tên từ /history -> /device-logs để đồng bộ với schema
    const response = await api.get('/device-logs', { params });
    
    // --- DEBUG: Kiểm tra dữ liệu thực tế từ Server ---
    console.log('Device Logs Response:', JSON.stringify(response.data, null, 2));

    // Xử lý linh hoạt các trường hợp trả về từ Backend
    if (Array.isArray(response.data)) {
      return response.data; // Trường hợp BE trả về mảng trực tiếp: res.json([...])
    }
    // FIX: Backend trả về key 'device_log'
    if (response.data && Array.isArray(response.data.device_log)) {
      return response.data.device_log;
    }
    if (response.data && Array.isArray(response.data.logs)) {
      return response.data.logs; // Trường hợp chuẩn: res.json({ logs: [...] })
    }
    // Fallback nếu dùng key khác hoặc lỗi
    return response.data.data || response.data.result || [];
  }, [device, time]);

  // Effect này xử lý việc tải dữ liệu khi màn hình được focus hoặc khi bộ lọc thay đổi
  useEffect(() => {
    if (isFocused) {
      const loadInitialData = async () => {
        setLoading(true);
        try {
          const data = await fetchData();
          setHistoryData(data);
        } catch (error) {
          console.error("Lỗi tải nhật ký:", error);
          setHistoryData([]); // Reset dữ liệu khi có lỗi
        } finally {
          setLoading(false);
        }
      };
      loadInitialData();
    }
  }, [isFocused, fetchData]); // Chạy lại khi focus hoặc khi bộ lọc thay đổi

  // Xử lý hành động "kéo để làm mới"
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchData();
      setHistoryData(data);
    } catch (error) {
      console.error("Lỗi khi làm mới:", error);
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
        <View style={{ width: 22 }} />
      </View>

      {/* FILTER SECTION */}
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

        {/* DROPDOWN MENU */}
        {openFilter && (
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: themeStyles.card,
                borderColor: themeStyles.border,
              },
            ]}
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

      {/* HISTORY LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={themeStyles.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={historyData}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.body}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: themeStyles.subText, marginTop: 20 }}>
              Chưa có nhật ký hoạt động
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeStyles.primary]}
            />
          }
          renderItem={({ item }) => (
            <HistoryItem
              type={item.device_type} 
              deviceName={item.device_name || 'Thiết bị đã xóa'}
              userName={item.user_name || 'Người dùng'}
              time={item.createdAt}
              action={item.action}
              themeStyles={themeStyles}
            />
          )}
        />
      )}
    </View>
  );
}

// --- COMPONENT CON ---

function FilterItem({ label, active, onPress, themeStyles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.filterItem,
        { backgroundColor: themeStyles.card },
        active && { borderColor: '#3b9cff', borderWidth: 1 },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: themeStyles.text, fontSize: 13 }}>{label}</Text>
      <Image
        source={require('../../public/img/down.png')}
        style={styles.filterIcon}
      />
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

function HistoryItem({ type, deviceName, userName, time, action, themeStyles }) {
  const getIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'light': case 'đèn': return require('../../public/img/light.png');
      case 'fan': case 'quạt': return require('../../public/img/fan.png');
      default: return require('../../public/img/device_default.png');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '--:-- --/--/----';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  return (
    <View style={[styles.historyItem, { backgroundColor: themeStyles.card }]}>
      <Image source={getIcon(type)} style={styles.deviceIcon} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
           <Text style={[styles.itemTitle, { color: themeStyles.text }]}>{deviceName}</Text>
           <Text style={{ color: themeStyles.subText, fontSize: 11 }}>
             {formatDateTime(time)}
           </Text>
        </View>
        
        <Text style={{ color: themeStyles.subText, fontSize: 12, marginBottom: 6 }}>
          Người dùng: {userName}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
           <Text style={{ color: action === 'ON' ? '#4CAF50' : '#F44336', fontSize: 13, fontWeight: '600' }}>
             {action === 'ON' ? '🟢 Đã Bật' : '🔴 Đã Tắt'}
           </Text>
        </View>
      </View>
    </View>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  filterWrapper: { padding: 16, zIndex: 10 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  filterItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
    justifyContent: 'center',
  },
  filterIcon: { width: 10, height: 10, marginLeft: 6 },
  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    elevation: 5,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f022',
  },
  body: { paddingHorizontal: 16, paddingBottom: 20 },
  historyItem: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
  },
  deviceIcon: { width: 30, height: 30, marginRight: 15 },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
});
