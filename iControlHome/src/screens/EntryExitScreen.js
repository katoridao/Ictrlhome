import React, { useState, useCallback, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../database/api';
import {
  connectSocket,
  getSocket,
  subscribeSocketLifecycle,
} from '../database/socket';
import moment from 'moment';
import 'moment/locale/vi';

const TIME_FILTERS = ['day', 'week', 'month'];
const STATUS_FILTERS = ['all', 'known', 'unknown'];

export default function EntryExitScreen() {
  const { theme, styles: themeStyles } = useTheme();
  const { t, language } = useContext(LanguageContext);

  const [openFilter, setOpenFilter] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('MEMBER');
  const [isMember, setIsMember] = useState(null);
  const [memberChecked, setMemberChecked] = useState(false);

  const [timeFilter, setTimeFilter] = useState('day');
  const [statusFilter, setStatusFilter] = useState('all');

  const getPeriodValue = filter => filter;

  const getTimeFilterLabel = filter => {
    if (filter === 'week') return t.last_7_days;
    if (filter === 'month') return t.last_30_days;
    return t.today;
  };

  const getStatusFilterLabel = filter => {
    if (filter === 'known') return t.recognized;
    if (filter === 'unknown') return t.stranger;
    return t.all;
  };

  useEffect(() => {
    moment.locale(language === 'vi' ? 'vi' : 'en');
  }, [language]);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = { period: getPeriodValue(timeFilter) };
      if (statusFilter === 'known') params.status = 'known';
      if (statusFilter === 'unknown') params.status = 'unknown';

      const response = await api.get('/camera/history', { params });
      console.log(
        'API Response:',
        JSON.stringify(response?.data)?.substring(0, 500),
      );

      // Xử lý response an toàn
      let rawData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          rawData = response.data;
        } else if (Array.isArray(response.data.data)) {
          rawData = response.data.data;
        } else if (typeof response.data === 'object') {
          rawData =
            Object.values(response.data).filter(v => Array.isArray(v))[0] || [];
        }
      }

      // Filter những record hợp lệ
      const validRecords = rawData.filter(r => r && typeof r === 'object');
      setRecords(validRecords);
    } catch (error) {
      console.error('Lỗi tải lịch sử ra/vào:', error?.message || error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [timeFilter, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const syncMembershipAndLoad = async () => {
        try {
          setLoading(true);
          const role = await AsyncStorage.getItem('user_role');
          if (!active) return;
          setUserRole(role || 'MEMBER');

          const res = await api.get('/houses/check-member');
          if (!active) return;

          const joined = res.data?.is_member === true;
          setIsMember(joined);

          if (joined && res.data?.house_id) {
            await AsyncStorage.setItem('current_house_id', res.data.house_id);
            await AsyncStorage.setItem(
              'current_house_name',
              res.data.house_name || t.home,
            );
          }

          if ((role || 'MEMBER') === 'OWNER' || joined) {
            await fetchHistory();
          } else {
            setRecords([]);
            setLoading(false);
          }
        } catch (error) {
          if (!active) return;
          setIsMember(false);
          setRecords([]);
          setLoading(false);
        } finally {
          if (active) {
            setMemberChecked(true);
          }
        }
      };

      syncMembershipAndLoad();

      return () => {
        active = false;
      };
    }, [fetchHistory, t]),
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const refreshOnRealtime = () => {
        if (!mounted) return;
        fetchHistory();
      };

      const setupSocket = async () => {
        try {
          const socket = await connectSocket();
          socket.off('camera_detection').on('camera_detection', refreshOnRealtime);
        } catch (error) {
          console.warn('[EntryExitScreen] socket setup warning:', error?.message);
        }
      };

      setupSocket();
      const unsubscribeLifecycle = subscribeSocketLifecycle(event => {
        if (!mounted) return;
        if (event?.type === 'reconnect') {
          fetchHistory();
        }
      });

      return () => {
        mounted = false;
        unsubscribeLifecycle();
        const socket = getSocket();
        socket?.off('camera_detection');
      };
    }, [fetchHistory]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  // Nhóm theo ngày
  const groupedRecords = React.useMemo(() => {
    const groups = {};
    for (const record of records) {
      // Bỏ qua các record không hợp lệ
      if (!record || typeof record !== 'object' || !record.time) continue;
      const dateKey = moment(record.time).format('YYYY-MM-DD');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(record);
    }
    return Object.entries(groups)
      .filter(([_, data]) => Array.isArray(data) && data.length > 0)
      .map(([date, data]) => ({
        date,
        title: formatGroupDate(date, t),
        data,
      }));
  }, [records, t]);

  const renderRecord = ({ item }) => {
    try {
      // Bảo vệ khỏi undefined/null item
      if (!item || typeof item !== 'object') {
        return null;
      }

      const isKnown = item.status === 'known';
      const rawImage = item.image;
      const imageUri =
        rawImage && typeof rawImage === 'string'
          ? `data:image/jpeg;base64,${rawImage}`
          : null;
      const actionText = isKnown ? t.recognized : t.stranger;
      const actionColor = isKnown ? '#4CAF50' : '#FF9800';
      const actionIcon = isKnown ? 'check-circle' : 'account-question';

      // Xử lý thời gian an toàn
      const timeValue = item.time ? moment(item.time) : null;
      const timeString =
        timeValue && timeValue.isValid()
          ? timeValue.format('HH:mm DD/MM/YYYY')
          : t.unknown_time;

      return (
        <View
          style={[styles.recordCard, { backgroundColor: themeStyles.card }]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.recordImage} />
          ) : (
            <View
              style={[
                styles.recordAvatar,
                { backgroundColor: themeStyles.primary },
              ]}
            >
              <MaterialCommunityIcons name="account" size={24} color="#fff" />
            </View>
          )}

          <View style={styles.recordContent}>
            <View style={styles.recordHeader}>
              <Text style={[styles.recordName, { color: themeStyles.text }]}>
                {isKnown ? item.name : t.stranger}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: actionColor + '22' },
                ]}
              >
                <MaterialCommunityIcons
                  name={actionIcon}
                  size={13}
                  color={actionColor}
                />
                <Text style={[styles.statusText, { color: actionColor }]}>
                  {actionText}
                </Text>
              </View>
            </View>

            <View style={styles.recordRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={13}
                color={themeStyles.subText}
              />
              <Text style={[styles.recordTime, { color: themeStyles.subText }]}>
                {timeString}
              </Text>
            </View>

            {isKnown && item.name && (
              <View style={styles.recordRow}>
                <MaterialCommunityIcons
                  name="home-account"
                  size={13}
                  color={themeStyles.subText}
                />
                <Text
                  style={[styles.recordMeta, { color: themeStyles.subText }]}
                >
                  {t.registered_in_system}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    } catch (error) {
      console.error('Lỗi renderRecord:', error?.message);
      return null;
    }
  };

  const renderSection = ({ item }) => {
    if (!item || !Array.isArray(item.data)) return null;

    // Filter các record không hợp lệ
    const validRecords = item.data.filter(r => r && typeof r === 'object');

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={themeStyles.primary}
          />
          <Text style={[styles.sectionTitle, { color: themeStyles.primary }]}>
            {item.title}
          </Text>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: themeStyles.primary + '22' },
            ]}
          >
            <Text style={[styles.countText, { color: themeStyles.primary }]}>
              {validRecords.length}
            </Text>
          </View>
        </View>
        {validRecords.map((record, index) => (
          <View key={record._id ?? `record-${index}`}>
            {renderRecord({ item: record })}
          </View>
        ))}
      </View>
    );
  };

  const isOwner = userRole === 'OWNER';
  const notJoined = !isOwner && isMember === false;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <MaterialCommunityIcons name="history" size={24} color="#fff" />
        <Text style={styles.headerTitle}>{t.entry_exit_history}</Text>
      </View>

      {!memberChecked ? (
        <ActivityIndicator
          size="large"
          color={themeStyles.primary}
          style={{ marginTop: 50 }}
        />
      ) : notJoined ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="home-lock" size={80} color="#ccc" />
          <Text style={[styles.emptyText, { color: themeStyles.subText }]}>
            {t.not_joined_house}
          </Text>
          <Text style={[styles.emptyText, { color: themeStyles.subText }]}>
            {t.enter_admin_info}
          </Text>
        </View>
      ) : (
        <>
          {/* FILTER BAR */}
          <View style={styles.filterWrapper}>
            <View style={styles.filterRow}>
              <FilterItem
                label={getStatusFilterLabel(statusFilter)}
                active={openFilter === 'status'}
                themeStyles={themeStyles}
                onPress={() =>
                  setOpenFilter(openFilter === 'status' ? null : 'status')
                }
              />
              <FilterItem
                label={getTimeFilterLabel(timeFilter)}
                active={openFilter === 'time'}
                themeStyles={themeStyles}
                onPress={() =>
                  setOpenFilter(openFilter === 'time' ? null : 'time')
                }
              />
            </View>

            {openFilter && (
              <View
                style={[styles.dropdown, { backgroundColor: themeStyles.card }]}
              >
                {openFilter === 'status' &&
                  STATUS_FILTERS.map(item => (
                    <DropdownOption
                      key={item}
                      label={getStatusFilterLabel(item)}
                      active={statusFilter === item}
                      themeStyles={themeStyles}
                      onPress={() => {
                        setStatusFilter(item);
                        setOpenFilter(null);
                      }}
                    />
                  ))}
                {openFilter === 'time' &&
                  TIME_FILTERS.map(item => (
                    <DropdownOption
                      key={item}
                      label={getTimeFilterLabel(item)}
                      active={timeFilter === item}
                      themeStyles={themeStyles}
                      onPress={() => {
                        setTimeFilter(item);
                        setOpenFilter(null);
                      }}
                    />
                  ))}
              </View>
            )}
          </View>

          {/* SUMMARY STATS */}
          {!loading && records.length > 0 && (
            <View style={styles.statsRow}>
              <View
                style={[styles.statCard, { backgroundColor: themeStyles.card }]}
              >
                <MaterialCommunityIcons
                  name="account-check"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={[styles.statNum, { color: themeStyles.text }]}>
                  {records.filter(r => r.status === 'known').length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: themeStyles.subText }]}
                >
                  {t.recognized}
                </Text>
              </View>
              <View
                style={[styles.statCard, { backgroundColor: themeStyles.card }]}
              >
                <MaterialCommunityIcons
                  name="account-question"
                  size={20}
                  color="#FF9800"
                />
                <Text style={[styles.statNum, { color: themeStyles.text }]}>
                  {records.filter(r => r.status === 'unknown').length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: themeStyles.subText }]}
                >
                  {t.stranger}
                </Text>
              </View>
            </View>
          )}

          {/* LIST */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={themeStyles.primary}
              style={{ marginTop: 50 }}
            />
          ) : (
            <FlatList
              data={groupedRecords}
              keyExtractor={item => item.date}
              renderItem={renderSection}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[themeStyles.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="door-open"
                    size={80}
                    color="#ccc"
                  />
                  <Text
                    style={[styles.emptyText, { color: themeStyles.subText }]}
                  >
                    {t.no_entry_exit_history}
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
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
      <MaterialCommunityIcons
        name={active ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={active ? '#fff' : themeStyles.text}
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

function formatGroupDate(dateStr, t) {
  const today = moment().startOf('day');
  const date = moment(dateStr);
  if (date.isSame(today, 'day')) return t.today;
  if (date.isSame(today.clone().subtract(1, 'day'), 'day')) return t.yesterday;
  return date.format('dddd, DD/MM/YYYY');
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
    gap: 10,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  filterWrapper: { padding: 16, zIndex: 1 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around', gap: 12 },
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
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 18 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  statNum: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, flex: 1 },

  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  section: { marginTop: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold' },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { fontSize: 12, fontWeight: 'bold' },

  recordCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    elevation: 2,
    alignItems: 'flex-start',
  },
  recordAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  recordContent: { flex: 1, marginLeft: 12 },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordName: { fontSize: 15, fontWeight: 'bold', flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  recordTime: { fontSize: 12 },
  recordMeta: { fontSize: 11 },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: { fontSize: 16, marginTop: 16 },
});
