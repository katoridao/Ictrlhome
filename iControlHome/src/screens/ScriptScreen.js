import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../database/api';
import {
  connectSocket,
  getSocket,
  subscribeSocketLifecycle,
} from '../database/socket';

export default function ScriptScreen({ navigation }) {
  const { theme, styles: themeStyles } = useTheme();
  const { t } = useContext(LanguageContext);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const getMinutesFromTriggerTime = time => {
    const raw = String(time || '').trim();
    // Support both "HH:mm" and full datetime like "YYYY-MM-DD HH:mm".
    const match = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return null;

    const [, hourRaw, minuteRaw] = match;
    const hour = Number.parseInt(hourRaw, 10);
    const minute = Number.parseInt(minuteRaw, 10);

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    return hour * 60 + minute;
  };

  const getDeltaMinutes = (triggerTime, nowMinutes) => {
    const triggerMinutes = getMinutesFromTriggerTime(triggerTime);
    if (triggerMinutes === null) return Number.MAX_SAFE_INTEGER;
    return (triggerMinutes - nowMinutes + 24 * 60) % (24 * 60);
  };

  const hasTriggeredEarlierToday = (triggerTime, nowMinutes) => {
    const triggerMinutes = getMinutesFromTriggerTime(triggerTime);
    if (triggerMinutes === null) return false;
    return triggerMinutes < nowMinutes;
  };

  const loadScripts = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await api.get('/automations');
      const finalData = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const sortedData = [...finalData].sort((a, b) => {
        const deltaA = getDeltaMinutes(a.trigger_time, nowMinutes);
        const deltaB = getDeltaMinutes(b.trigger_time, nowMinutes);
        return deltaA - deltaB;
      });
      setScripts(sortedData);
    } catch (err) {
      console.error('Lỗi tải danh sách kịch bản:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadScripts();
    }
  }, [isFocused]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const refreshScripts = () => {
        if (!mounted) return;
        loadScripts();
      };

      const setupSocket = async () => {
        try {
          const socket = await connectSocket();
          socket
            .off('device-update', refreshScripts)
            .on('device-update', refreshScripts);
          socket
            .off('notification_created', refreshScripts)
            .on('notification_created', refreshScripts);
        } catch (error) {
          console.warn('[ScriptScreen] socket setup warning:', error?.message);
        }
      };

      setupSocket();
      const unsubscribeLifecycle = subscribeSocketLifecycle(event => {
        if (!mounted) return;
        if (event?.type === 'reconnect') {
          refreshScripts();
        }
      });

      return () => {
        mounted = false;
        unsubscribeLifecycle();
        const socket = getSocket();
        socket?.off('device-update', refreshScripts);
        socket?.off('notification_created', refreshScripts);
      };
    }, [isFocused]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadScripts();
  }, []);

  const handleDelete = (id, name) => {
    Alert.alert(
      t.confirm_delete_script,
      t.confirm_delete_script.replace('{name}', name || t.unknown_name),
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/automations/${id}`);
              setScripts(prev => prev.filter(item => item._id !== id));
            } catch (err) {
              Alert.alert(t.error, t.cannot_delete_script);
            }
          },
        },
      ],
    );
  };

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />

      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Image
          source={require('../../public/img/script.png')}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>{t.tab_script}</Text>

        {/* QUAN TRỌNG: Đã sửa tên thành 'Automation' để khớp với App.js */}
        <TouchableOpacity onPress={() => navigation.navigate('Automation')}>
          <Image
            source={require('../../public/img/add.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeStyles.primary}
          />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={themeStyles.primary}
            style={{ marginTop: 50 }}
          />
        ) : scripts.length > 0 ? (
          scripts.map(item => (
            <ScriptItem
              key={item._id}
              item={item}
              themeStyles={themeStyles}
              t={t}
              isPastTriggered={
                item.enabled === false ||
                hasTriggeredEarlierToday(item.trigger_time, nowMinutes)
              }
              onDelete={() => handleDelete(item._id, item.name)}
              onToggleAutoDelete={async autoDelete => {
                try {
                  await api.put(`/automations/${item._id}`, {
                    auto_delete_on_trigger: autoDelete,
                  });
                  setScripts(prev =>
                    prev.map(script =>
                      script._id === item._id
                        ? { ...script, auto_delete_on_trigger: autoDelete }
                        : script,
                    ),
                  );
                } catch (error) {
                  console.error('Lỗi cập nhật tùy chọn:', error);
                }
              }}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ color: '#999', fontSize: 16 }}>{t.no_scripts}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Hàm bổ trợ hiển thị từng item kịch bản
function ScriptItem({
  item,
  themeStyles,
  onDelete,
  isPastTriggered,
  onToggleAutoDelete,
  t,
}) {
  const isON = item.action === 'ON';
  const [toggleAutoDelete, setToggleAutoDelete] = useState(
    item.auto_delete_on_trigger || false,
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeStyles.card },
        isPastTriggered && styles.cardBlurred,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardText, { color: themeStyles.text }]}>
          {item.name}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.subLabel}>{t.device}: </Text>
          <Text style={[styles.valText, { color: themeStyles.text }]}>
            {item.device_id?.name || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.subLabel}>{t.schedule}: </Text>
          <Text style={[styles.timeHighlight, { color: themeStyles.primary }]}>
            ⏰ {item.trigger_time}
          </Text>
          {isPastTriggered && (
            <Text style={styles.pastLabel}>{t.activated}</Text>
          )}
          <View
            style={[
              styles.badge,
              { backgroundColor: isON ? '#E8F5E9' : '#FFEBEE' },
            ]}
          >
            <Text
              style={{
                color: isON ? '#2E7D32' : '#C62828',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            >
              {isON ? t.on : t.off}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Image
            source={require('../../public/img/user.png')}
            style={styles.userIcon}
          />
          <Text style={styles.creatorName}>
            {t.created_by}: {item.user_id?.name || t.system}
          </Text>
        </View>

        <View style={styles.autoDeleteRow}>
          <TouchableOpacity
            onPress={() => {
              const newVal = !toggleAutoDelete;
              setToggleAutoDelete(newVal);
              onToggleAutoDelete?.(newVal);
            }}
            style={styles.checkboxContainer}
          >
            <View
              style={[
                styles.checkbox,
                toggleAutoDelete && { backgroundColor: themeStyles.primary },
              ]}
            >
              {toggleAutoDelete && (
                <Text
                  style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}
                >
                  ✓
                </Text>
              )}
            </View>
            <Text style={[styles.autoDeleteLabel, { color: themeStyles.text }]}>
              {t.delete_on_complete}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={onDelete} style={styles.deleteArea}>
        <Image
          source={require('../../public/img/delete.png')}
          style={styles.deleteIcon}
        />
      </TouchableOpacity>
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
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 },
  sortText: { color: '#fff' },
  headerIcon: { width: 24, height: 24, tintColor: '#fff', marginRight: 10 },
  body: { padding: 16 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardBlurred: {
    opacity: 0.45,
  },
  cardText: { fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  subLabel: { color: '#888', fontSize: 13 },
  valText: { fontSize: 13, fontWeight: '600' },
  timeHighlight: { fontSize: 14, fontWeight: 'bold', marginRight: 10 },
  pastLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginRight: 8,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#EEE',
  },
  userIcon: { width: 14, height: 14, marginRight: 5, tintColor: '#AAA' },
  creatorName: { fontSize: 12, color: '#777', fontStyle: 'italic' },
  deleteArea: { padding: 10 },
  deleteIcon: { width: 22, height: 22, tintColor: '#FF5252' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  autoDeleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#EEE',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#CCC',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoDeleteLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
