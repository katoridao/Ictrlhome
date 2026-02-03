import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function HistoryScreen({ navigation }) {
  const { theme, styles: themeStyles } = useTheme();

  const [openFilter, setOpenFilter] = useState(null);
  const [device, setDevice] = useState('Thiết bị');
  const [action, setAction] = useState('Hành động');
  const [time, setTime] = useState('Hôm nay');

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
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
            onPress={() => setOpenFilter(openFilter === 'device' ? null : 'device')}
          />
          <FilterItem
            label={action}
            active={openFilter === 'action'}
            themeStyles={themeStyles}
            onPress={() => setOpenFilter(openFilter === 'action' ? null : 'action')}
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
          <View style={[styles.dropdown, { backgroundColor: themeStyles.card, borderColor: themeStyles.border }]}>
            {openFilter === 'device' &&
              ['Tất cả', 'Quạt', 'Đèn', 'Điều hòa'].map((item) => (
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
              ['Tất cả', 'Bật', 'Tắt'].map((item) => (
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
              ['Hôm nay', '7 ngày trước', '30 ngày trước'].map((item) => (
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
      <ScrollView contentContainerStyle={styles.body}>
        <HistoryItem
          icon={require('../../public/img/air.png')}
          title="Điều hòa phòng ngủ"
          status="Tắt"
          user="Hưng"
          time="7:00 am"
          themeStyles={themeStyles}
        />
        <HistoryItem
          icon={require('../../public/img/tv.png')}
          title="Tivi phòng khách"
          status="Bật"
          user="Hoàng Anh"
          time="12:00 pm"
          themeStyles={themeStyles}
        />
        <HistoryItem
          icon={require('../../public/img/light.png')}
          title="Đèn phòng khách"
          status="Tắt"
          user="Admin"
          time="1:00 pm"
          themeStyles={themeStyles}
        />
        <HistoryItem
          icon={require('../../public/img/fan.png')}
          title="Quạt phòng ngủ"
          status="Bật"
          user="Tiệp"
          time="9:00 pm"
          themeStyles={themeStyles}
        />
      </ScrollView>
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
      style={[
        styles.dropdownItem,
        active && { backgroundColor: '#3b9cff' },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: active ? '#fff' : themeStyles.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

function HistoryItem({ icon, title, status, user, time, themeStyles }) {
  return (
    <View style={[styles.historyItem, { backgroundColor: themeStyles.card }]}>
      {/* Đã bỏ tintColor để giữ màu gốc của icon thiết bị */}
      <Image 
        source={icon} 
        style={styles.deviceIcon} 
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitle, { color: themeStyles.text }]}>{title}</Text>
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
  dropdownItem: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f022' },
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