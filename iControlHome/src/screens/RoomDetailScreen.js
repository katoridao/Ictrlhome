import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import api from '../database/api';
import { connectSocket, getSocket } from '../database/socket';

export default function RoomDetailScreen({ route, navigation }) {
  const { room } = route.params;
  const { styles: themeStyles } = useTheme();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingAll, setTogglingAll] = useState(false);
  const [togglingSelected, setTogglingSelected] = useState(false);
  const [userRole, setUserRole] = useState('MEMBER');

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const toolbarAnim = useRef(new Animated.Value(0)).current;

  const fetchDevicesInRoom = useCallback(async () => {
    setLoading(true);
    try {
      const role = await AsyncStorage.getItem('user_role');
      setUserRole(role || 'MEMBER');
      const response = await api.get('/devices', {
        params: { room_id: room._id },
      });
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Lỗi tải thiết bị:', error);
    } finally {
      setLoading(false);
    }
  }, [room._id]);

  useFocusEffect(
    useCallback(() => {
      fetchDevicesInRoom();
    }, [fetchDevicesInRoom]),
  );

  useEffect(() => {
    let mounted = true;
    const setupSocket = async () => {
      const socket = await connectSocket();
      socket.on('device_status_changed', ({ device_id, status }) => {
        if (!mounted) return;
        setDevices(prev =>
          prev.map(d => (d._id === device_id ? { ...d, status } : d)),
        );
      });
    };
    setupSocket();
    return () => {
      mounted = false;
      const socket = getSocket();
      if (socket) socket.off('device_status_changed');
    };
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: room.name || 'Chi tiết phòng',
      headerRight: () =>
        userRole === 'OWNER' ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('UnassignedDevices', { room_id: room._id })
            }
            style={{ marginRight: 15 }}
          ></TouchableOpacity>
        ) : null,
    });
  }, [navigation, room, userRole]);

  const controllableDevices = useMemo(
    () => devices.filter(d => userRole === 'OWNER' || d.can_control),
    [devices, userRole],
  );
  const allOn = useMemo(
    () =>
      controllableDevices.length > 0 &&
      controllableDevices.every(d => d.status),
    [controllableDevices],
  );

  const enterSelectMode = () => {
    setSelectMode(true);
    setSelectedIds(new Set());
    Animated.spring(toolbarAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  };

  const exitSelectMode = () => {
    Animated.timing(toolbarAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectMode(false);
      setSelectedIds(new Set());
    });
  };

  const toggleSelectItem = id => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === controllableDevices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(controllableDevices.map(d => d._id)));
    }
  };

  const handleToggleAll = async () => {
    const newStatus = !allOn;
    setTogglingAll(true);
    try {
      const needsUpdate = controllableDevices.filter(
        d => !!d.status !== newStatus,
      );
      if (needsUpdate.length === 0) return;
      await Promise.all(
        needsUpdate.map(d =>
          api.put(`/devices/${d._id}/status`, { status: newStatus }),
        ),
      );
      setDevices(prev =>
        prev.map(d =>
          userRole === 'OWNER' || d.can_control
            ? { ...d, status: newStatus }
            : d,
        ),
      );
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể cập nhật tất cả thiết bị',
      });
    } finally {
      setTogglingAll(false);
    }
  };

  const handleToggleSelected = async newStatus => {
    if (selectedIds.size === 0) return;
    setTogglingSelected(true);
    try {
      const targets = devices.filter(d => selectedIds.has(d._id));
      await Promise.all(
        targets.map(d =>
          api.put(`/devices/${d._id}/status`, { status: newStatus }),
        ),
      );
      setDevices(prev =>
        prev.map(d =>
          selectedIds.has(d._id) ? { ...d, status: newStatus } : d,
        ),
      );
      exitSelectMode();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể cập nhật thiết bị đã chọn',
      });
    } finally {
      setTogglingSelected(false);
    }
  };

  const handleDeleteDevice = deviceId => {
    // Giữ lại: đây là confirm dialog cần người dùng xác nhận
    Alert.alert('Xác nhận', 'Gỡ thiết bị khỏi phòng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Gỡ bỏ',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/devices/assign-room/${deviceId}`, {
              room_id: null,
            });
            fetchDevicesInRoom();
          } catch (e) {
            Toast.show({
              type: 'error',
              text1: 'Lỗi',
              text2: 'Không thể gỡ thiết bị.',
            });
          }
        },
      },
    ]);
  };

  const getDeviceIcon = type => {
    switch (type?.toLowerCase()) {
      case 'light':
      case 'đèn':
        return require('../../public/img/light.png');
      case 'fan':
      case 'quạt':
        return require('../../public/img/fan.png');
      default:
        return require('../../public/img/device_default.png');
    }
  };

  const selectedDevices = useMemo(
    () => devices.filter(d => selectedIds.has(d._id)),
    [devices, selectedIds],
  );
  const selectedAllOn = useMemo(
    () => selectedDevices.length > 0 && selectedDevices.every(d => d.status),
    [selectedDevices],
  );
  const selectedAllOff = useMemo(
    () => selectedDevices.length > 0 && selectedDevices.every(d => !d.status),
    [selectedDevices],
  );
  const toolbarTranslateY = toolbarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const renderDeviceItem = ({ item }) => {
    const isActive = !!item.status;
    const hasPermission = userRole === 'OWNER' || item.can_control === true;
    const isSelected = selectedIds.has(item._id);

    return (
      <TouchableOpacity
        style={[
          styles.deviceCard,
          { backgroundColor: themeStyles.card },
          isSelected && styles.deviceCardSelected,
          !hasPermission && styles.deviceCardLocked,
        ]}
        onPress={() => {
          if (selectMode) {
            if (hasPermission) toggleSelectItem(item._id);
            return;
          }
          if (!hasPermission) return;
          navigation.navigate('DeviceControl', { device: item });
        }}
        onLongPress={() => {
          if (!selectMode && hasPermission) {
            setSelectMode(true);
            setSelectedIds(new Set([item._id]));
            Animated.spring(toolbarAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 70,
              friction: 12,
            }).start();
          } else if (selectMode && userRole === 'OWNER') {
            handleDeleteDevice(item._id);
          }
        }}
        delayLongPress={500}
        activeOpacity={hasPermission ? 0.75 : 1}
      >
        {!hasPermission && (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockText}>Chưa được{'\n'}cấp quyền</Text>
          </View>
        )}
        <View style={styles.deviceInfo}>
          {selectMode && hasPermission && (
            <View
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            >
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: hasPermission
                  ? isActive
                    ? '#E8F5E9'
                    : '#F5F5F5'
                  : '#F0F0F0',
              },
            ]}
          >
            <Image
              source={getDeviceIcon(item.type)}
              style={[
                styles.deviceIcon,
                {
                  tintColor: hasPermission
                    ? isActive
                      ? '#4CAF50'
                      : '#9E9E9E'
                    : '#BDBDBD',
                },
              ]}
            />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={[
                styles.deviceName,
                { color: hasPermission ? themeStyles.text : '#BDBDBD' },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={{
                color: hasPermission ? themeStyles.subText : '#BDBDBD',
                fontSize: 11,
              }}
            >
              {item.type?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>
        {hasPermission && (
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isActive ? '#4CAF50' : '#F44336' },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <Text style={[styles.roomTitle, { color: themeStyles.text }]}>
        📍 {room.name}
      </Text>

      {!loading && controllableDevices.length > 0 && !selectMode && (
        <View style={[styles.quickBar, { backgroundColor: themeStyles.card }]}>
          <TouchableOpacity
            style={[
              styles.quickBtn,
              { backgroundColor: allOn ? '#F44336' : '#4CAF50', flex: 1 },
            ]}
            onPress={handleToggleAll}
            disabled={togglingAll}
          >
            {togglingAll ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Image
                  source={require('../../public/img/device_default.png')}
                  style={styles.quickIcon}
                />
                <Text style={styles.quickBtnText}>
                  {allOn ? 'Tắt tất cả' : 'Bật tất cả'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, styles.selectModeBtn]}
            onPress={enterSelectMode}
            activeOpacity={0.8}
          >
            <Text style={styles.selectModeBtnIcon}>☑</Text>
            <Text style={styles.selectModeBtnText}>Chọn</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectMode && (
        <View
          style={[styles.selectHeader, { backgroundColor: themeStyles.card }]}
        >
          <TouchableOpacity onPress={exitSelectMode} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>✕ Hủy</Text>
          </TouchableOpacity>
          <Text style={[styles.selectCount, { color: themeStyles.text }]}>
            {selectedIds.size > 0
              ? `Đã chọn ${selectedIds.size} thiết bị`
              : 'Chạm để chọn thiết bị'}
          </Text>
          <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
            <Text style={styles.selectAllText}>
              {selectedIds.size === controllableDevices.length
                ? 'Bỏ chọn'
                : 'Tất cả'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={themeStyles.primary}
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={item => item._id}
          renderItem={renderDeviceItem}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: selectMode ? 100 : 16,
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: themeStyles.subText }}>
                Chưa có thiết bị nào trong phòng này.
              </Text>
            </View>
          }
        />
      )}

      {selectMode && (
        <Animated.View
          style={[
            styles.floatingToolbar,
            { transform: [{ translateY: toolbarTranslateY }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.toolbarBtn,
              styles.toolbarBtnOff,
              (selectedIds.size === 0 || togglingSelected || selectedAllOff) &&
                styles.toolbarBtnDisabled,
            ]}
            onPress={() => handleToggleSelected(false)}
            disabled={
              selectedIds.size === 0 || togglingSelected || selectedAllOff
            }
            activeOpacity={0.8}
          >
            {togglingSelected ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.toolbarBtnIcon}>🌙</Text>
                <Text style={styles.toolbarBtnText}>Tắt</Text>
                {selectedIds.size > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedIds.size}</Text>
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toolbarBtn,
              styles.toolbarBtnOn,
              (selectedIds.size === 0 || togglingSelected || selectedAllOn) &&
                styles.toolbarBtnDisabled,
            ]}
            onPress={() => handleToggleSelected(true)}
            disabled={
              selectedIds.size === 0 || togglingSelected || selectedAllOn
            }
            activeOpacity={0.8}
          >
            {togglingSelected ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.toolbarBtnIcon}>☀️</Text>
                <Text style={styles.toolbarBtnText}>Bật</Text>
                {selectedIds.size > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedIds.size}</Text>
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  roomTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 14 },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    justifyContent: 'center',
  },
  quickIcon: { width: 16, height: 16, tintColor: '#fff' },
  quickBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  selectModeBtn: { backgroundColor: '#5C6BC0', paddingHorizontal: 16 },
  selectModeBtnIcon: { fontSize: 16, color: '#fff' },
  selectModeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  selectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    elevation: 2,
  },
  cancelBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  cancelBtnText: { color: '#F44336', fontWeight: '700', fontSize: 14 },
  selectCount: { fontSize: 14, fontWeight: '600' },
  selectAllBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  selectAllText: { color: '#5C6BC0', fontWeight: '700', fontSize: 14 },
  deviceCard: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  deviceCardSelected: { borderColor: '#5C6BC0', backgroundColor: '#EEF2FF' },
  deviceCardLocked: { elevation: 1, shadowOpacity: 0.03 },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 245, 0.85)',
    borderRadius: 14,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  lockIcon: { fontSize: 22 },
  lockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E9E9E',
    textAlign: 'center',
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { padding: 8, borderRadius: 10 },
  deviceIcon: { width: 24, height: 24 },
  deviceName: { fontSize: 16, fontWeight: 'bold' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9E9E9E',
    backgroundColor: '#fff',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#5C6BC0', borderColor: '#5C6BC0' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 16 },
  floatingToolbar: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  toolbarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  toolbarBtnOn: { backgroundColor: '#43A047' },
  toolbarBtnOff: { backgroundColor: '#E53935' },
  toolbarBtnDisabled: { opacity: 0.4 },
  toolbarBtnIcon: { fontSize: 18 },
  toolbarBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
