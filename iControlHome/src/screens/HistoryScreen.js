import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';

export default function HistoryScreen({ navigation }) {
  const { theme, styles: themeStyles } = useTheme();

  const [openFilter, setOpenFilter] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [device, setDevice] = useState('Thiết bị');
  const [action, setAction] = useState('Hành động');
  const [time, setTime] = useState('Hôm nay');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Gọi API lấy lịch sử (Backend cần cài đặt route GET /history)
      const response = await api.get('/history');
      setHistoryData(response.data.history || []);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải lại dữ liệu mỗi khi vào màn hình
  useFocusEffect(useCallback(() => { fetchHistory(); }, []));

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
        <Text style={styles.headerTitle}>Lịch sử hoạt động</Text>
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
            label={action}
            active={openFilter === 'action'}
            themeStyles={themeStyles}
            onPress={() =>
              setOpenFilter(openFilter === 'action' ? null : 'action')
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
              ['Tất cả', 'Quạt', 'Đèn', 'Điều hòa'].map(item => (
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

            {openFilter === 'action' &&
              ['Tất cả', 'Bật', 'Tắt'].map(item => (
                <DropdownOption
                  key={item}
                  label={item}
                  active={action === item}
                  themeStyles={themeStyles}
                  onPress={() => {
                    setAction(item);
                    setOpenFilter(null);
                  }}
                />
              ))}

            {openFilter === 'time' &&
              ['Hôm nay', '7 ngày trước', '30 ngày trước'].map(item => (
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
              Chưa có lịch sử hoạt động
            </Text>
          }
          renderItem={({ item }) => (
            <HistoryItem
              type={item.device_type} 
              title={item.device_name || 'Thiết bị đã xóa'}
              status={item.action === 'ON' || item.action === 1 ? 'Bật' : 'Tắt'}
              user={item.user_name || 'Người dùng'}
              time={new Date(item.createdAt).toLocaleString('vi-VN')}
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
      {/* Đã bỏ tintColor để giữ màu gốc của down.png */}
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

function HistoryItem({ type, title, status, user, time, themeStyles }) {
  const getIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'light': case 'đèn': return require('../../public/img/light.png');
      case 'fan': case 'quạt': return require('../../public/img/fan.png');
      default: return require('../../public/img/device_default.png');
    }
  };

  return (
    <View style={[styles.historyItem, { backgroundColor: themeStyles.card }]}>
      {/* Đã bỏ tintColor để giữ màu gốc của icon thiết bị */}
      <Image source={getIcon(type)} style={styles.deviceIcon} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitle, { color: themeStyles.text }]}>
          {title}
        </Text>
        <Text style={{ color: themeStyles.subText, fontSize: 13 }}>
          {status} · {user}
        </Text>
      </View>
      <Text style={{ color: themeStyles.subText, fontSize: 12 }}>{time}</Text>
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
