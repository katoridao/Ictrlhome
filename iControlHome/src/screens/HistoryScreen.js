import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

export default function HistoryScreen({ navigation }) {
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

        <View style={{ width: 24 }} />
      </View>

      {/* FILTER */}
      <View style={styles.filterRow}>
        <FilterItem label="Thiết bị" />
        <FilterItem label="Hành động" />
        <FilterItem label="Hôm nay" />
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

/* FILTER ITEM */
function FilterItem({ label }) {
  return (
    <TouchableOpacity style={styles.filterItem}>
      <Text style={styles.filterText}>{label}</Text>
      <Image
        source={require('../../public/img/down.png')}
        style={styles.filterIcon}
      />
    </TouchableOpacity>
  );
}

/* HISTORY ITEM */
function HistoryItem({ icon, title, status, user, time }) {
  return (
    <View style={styles.historyItem}>
      <Image source={icon} style={styles.deviceIcon} />

      <View style={styles.historyContent}>
        <Text style={styles.historyTitle}>{title}</Text>
        <Text style={styles.historySub}>
          {status} &nbsp; {user}
        </Text>
      </View>

      <Text style={styles.historyTime}>{time}</Text>
    </View>
  );
}

/* BOTTOM ITEM */
function BottomItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.bottomItem} onPress={onPress}>
      <Image
        source={icon}
        style={[
          styles.bottomIcon,
          active && { tintColor: '#000' },
        ]}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.bottomText,
          active && styles.bottomActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6e6e6',
  },

  /* HEADER */
  header: {
    height: 70,
    backgroundColor: '#3b9cff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 22,
  },

  /* FILTER */
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
  },

  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  filterText: {
    fontSize: 14,
    marginRight: 6,
  },

  filterIcon: {
    width: 12,
    height: 12,
  },

  /* LIST */
  body: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },

  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  deviceIcon: {
    width: 34,
    height: 34,
    marginRight: 12,
  },

  historyContent: {
    flex: 1,
  },

  historyTitle: {
    fontSize: 15,
    fontWeight: '500',
  },

  historySub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  historyTime: {
    fontSize: 13,
    color: '#000',
  },

  /* BOTTOM TAB */
  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },

  bottomItem: {
    alignItems: 'center',
  },

  bottomIcon: {
    width: 22,
    height: 22,
    tintColor: '#666',
    marginBottom: 2,
  },

  bottomText: {
    fontSize: 12,
    color: '#666',
  },

  bottomActive: {
    color: '#000',
    fontWeight: '600',
  },
});
