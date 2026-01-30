import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

export default function HistoryScreen({ navigation }) {
  // 🔒 TẤT CẢ HOOK PHẢI Ở ĐÂY
  const [openFilter, setOpenFilter] = useState(null);
  const [device, setDevice] = useState('Thiết bị');
  const [action, setAction] = useState('Hành động');
  const [time, setTime] = useState('Hôm nay');

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../public/img/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử hoạt động</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* FILTER */}
      <View style={styles.filterWrapper}>
        <View style={styles.filterRow}>
          <FilterItem
            label={device}
            active={openFilter === 'device'}
            onPress={() =>
              setOpenFilter(openFilter === 'device' ? null : 'device')
            }
          />
          <FilterItem
            label={action}
            active={openFilter === 'action'}
            onPress={() =>
              setOpenFilter(openFilter === 'action' ? null : 'action')
            }
          />
          <FilterItem
            label={time}
            active={openFilter === 'time'}
            onPress={() =>
              setOpenFilter(openFilter === 'time' ? null : 'time')
            }
          />
        </View>

        {openFilter && (
          <View style={styles.dropdown}>
            {openFilter === 'device' &&
              ['Quạt', 'Đèn', 'Điều hòa'].map(item => (
                <DropdownItem
                  key={item}
                  label={item}
                  active={device === item}
                  onPress={() => {
                    setDevice(item);
                    setOpenFilter(null);
                  }}
                />
              ))}

            {openFilter === 'action' &&
              ['Bật', 'Tắt'].map(item => (
                <DropdownItem
                  key={item}
                  label={item}
                  active={action === item}
                  onPress={() => {
                    setAction(item);
                    setOpenFilter(null);
                  }}
                />
              ))}

            {openFilter === 'time' &&
              [
                '7 ngày trước',
                '14 ngày trước',
                '30 ngày trước',
                '60 ngày trước',
                '90 ngày trước',
              ].map(item => (
                <DropdownItem
                  key={item}
                  label={item}
                  active={time === item}
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
      <ScrollView contentContainerStyle={styles.body}>
        <HistoryItem
          icon={require('../../public/img/air.png')}
          title="Điều hòa phòng ngủ"
          status="Tắt"
          user="Hưng"
          time="7:00 am"
        />
         <HistoryItem
          icon={require('../../public/img/tv.png')}
          title="Tivi phòng khách"
          status="Bật"
          user="Hoàng Anh"
          time="12:00 pm"
        />

        <HistoryItem
          icon={require('../../public/img/light.png')}
          title="Đèn phòng khách"
          status="Tắt"
          user="Admin"
          time="1:00 pm"
        />

        <HistoryItem
          icon={require('../../public/img/socket.png')}
          title="Ổ điện phòng làm việc"
          status="Bật"
          user="Vũ"
          time="4:00 pm"
        />

        <HistoryItem
          icon={require('../../public/img/fan.png')}
          title="Quạt phòng ngủ"
          status="Bật"
          user="Tiệp"
          time="21:00 pm"
        />
      </ScrollView>
    </View>
  );
}

/* COMPONENT CON – KHÔNG ĐƯỢC DÙNG HOOK */
function FilterItem({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.filterItem, active && styles.filterActive]}
      onPress={onPress}
    >
      <Text>{label}</Text>
      <Image
        source={require('../../public/img/down.png')}
        style={styles.filterIcon}
      />
    </TouchableOpacity>
  );
}

function DropdownItem({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.dropdownItem, active && styles.dropdownActive]}
      onPress={onPress}
    >
      <Text style={{ color: active ? '#fff' : '#000' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HistoryItem({ icon, title, status, user, time }) {
  return (
    <View style={styles.historyItem}>
      <Image source={icon} style={styles.deviceIcon} />
      <View style={{ flex: 1 }}>
        <Text>{title}</Text>
        <Text>{status} · {user}</Text>
      </View>
      <Text>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6e6e6' },
  header: { height: 70, backgroundColor: '#3b9cff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  backIcon: { width: 22, height: 22, tintColor: '#fff' },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18 },
  filterWrapper: { padding: 16 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  filterItem: { backgroundColor: '#fff', padding: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  filterActive: { borderColor: '#1e66d0', borderWidth: 1 },
  filterIcon: { width: 12, height: 12, marginLeft: 6 },
  dropdown: { backgroundColor: '#fff', marginTop: 8, borderRadius: 8 },
  dropdownItem: { padding: 12 },
  dropdownActive: { backgroundColor: '#1e66d0' },
  body: { padding: 16 },
  historyItem: { backgroundColor: '#fff', padding: 14, borderRadius: 14, flexDirection: 'row', marginBottom: 12 },
  deviceIcon: { width: 34, height: 34, marginRight: 12 },
});
