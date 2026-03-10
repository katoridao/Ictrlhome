import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  PanResponder,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../database/api';
import { connectSocket, getSocket } from '../database/socket';
import { useSocketEvents } from '../database/socketEvents';

const { width } = Dimensions.get('window');
const SHEET_HEIGHT = 260;

export default function HomeScreen({ navigation }) {
  const { styles: themeStyles } = useTheme();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('MEMBER');
  const [isMember, setIsMember] = useState(null);
  const [userData, setUserData] = useState(null);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const onStatusChanged = ({ device_id, status }) => {
        if (!mounted) return;
        setDevices(prev =>
          prev.map(d => (d._id === device_id ? { ...d, status } : d)),
        );
      };
      const onDeviceAdded = ({ device }) => {
        if (!mounted) return;
        setDevices(prev =>
          prev.some(d => d._id === device._id) ? prev : [...prev, device],
        );
      };
      const onDeviceUpdated = ({ device }) => {
        if (!mounted) return;
        setDevices(prev =>
          prev.map(d => (d._id === device._id ? { ...d, ...device } : d)),
        );
      };
      const onDeviceDeleted = ({ device_id }) => {
        if (!mounted) return;
        setDevices(prev => prev.filter(d => d._id !== device_id));
      };

      const setupSocket = async () => {
        try {
          const socket = await connectSocket();

          // Setup listeners
          socket
            .off('device_status_changed')
            .on('device_status_changed', onStatusChanged);
          socket.off('device_added').on('device_added', onDeviceAdded);
          socket.off('device_updated').on('device_updated', onDeviceUpdated);
          socket.off('device_deleted').on('device_deleted', onDeviceDeleted);

          console.log('[HomeScreen] Socket listeners registered');
        } catch (err) {
          console.error('[HomeScreen] Socket setup error:', err);
        }
      };

      setupSocket();

      return () => {
        mounted = false;
        const socket = getSocket();
        if (socket) {
          console.log('[HomeScreen] Cleaning up socket listeners');
          socket.off('device_status_changed');
          socket.off('device_added');
          socket.off('device_updated');
          socket.off('device_deleted');
        }
      };
    }, []),
  );

  const openSheet = item => {
    setSelectedDevice(item);
    setSheetVisible(true);
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = callback => {
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSheetVisible(false);
      setSelectedDevice(null);
      if (callback) callback();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) sheetAnim.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          closeSheet();
        } else {
          Animated.spring(sheetAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    }),
  ).current;

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const role = await AsyncStorage.getItem('user_role');
      setUserRole(role || 'MEMBER');
      const jsonValue = await AsyncStorage.getItem('user_info');
      if (jsonValue !== null) {
        const user = JSON.parse(jsonValue);
        setUserData(user);
        try {
          const res = await api.get('/houses/check-member');
          setIsMember(res.data.is_member);
        } catch (e) {
          setIsMember(true);
        }
      }
      const response = await api.get('/devices');
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Lỗi tải thiết bị:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDevices();
    }, [fetchDevices]),
  );

  const handleDelete = async deviceId => {
    try {
      await api.delete(`/devices/${deviceId}`);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã xóa thiết bị!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Bạn không có quyền thực hiện hành động này.',
      });
    }
  };

  const onLongPressDevice = item => {
    if (userRole !== 'OWNER') return;
    openSheet(item);
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

  const renderDeviceItem = ({ item }) => {
    const isActive = item.status === 1 || item.status === true;
    const hasPermission = userRole === 'OWNER' || item.can_control === true;
    return (
      <TouchableOpacity
        style={[
          styles.deviceCard,
          { backgroundColor: themeStyles.card || '#fff' },
          !hasPermission && { opacity: 0.4 },
        ]}
        onPress={() => {
          if (!hasPermission) return;
          navigation.navigate('DeviceControl', { device: item });
        }}
        onLongPress={() => onLongPressDevice(item)}
        delayLongPress={500}
        activeOpacity={hasPermission ? 0.85 : 1}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: isActive ? '#E8F5E9' : '#F5F5F5' },
            ]}
          >
            <Image
              source={getDeviceIcon(item.type)}
              style={[
                styles.deviceImage,
                { tintColor: isActive ? '#4CAF50' : '#9E9E9E' },
              ]}
              resizeMode="contain"
            />
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isActive ? '#4CAF50' : '#F44336' },
            ]}
          >
            <Text style={styles.statusText}>{isActive ? 'ON' : 'OFF'}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text
            style={[styles.deviceName, { color: themeStyles.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={styles.roomRow}>
            <Text style={styles.roomDot}>{item.room_id ? '📍' : '📦'}</Text>
            <Text
              style={[
                styles.roomLabel,
                {
                  color: item.room_id
                    ? themeStyles.subText || '#888'
                    : '#BDBDBD',
                },
              ]}
              numberOfLines={1}
            >
              {item.room_id?.name || 'Chưa gắn phòng'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isOwner = userRole === 'OWNER';
  const notJoined = !isOwner && isMember === false;

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Text style={styles.houseName}>Nhà của tôi</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {userRole === 'OWNER' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ManageMembers')}
              style={{ marginRight: 15 }}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../public/img/avatar.png')}
                style={[
                  styles.headerIcon,
                  {
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  },
                ]}
              />
            </TouchableOpacity>
          )}
          {userRole === 'OWNER' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddDevice')}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../public/img/add.png')}
                style={styles.headerIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={themeStyles.primary}
            style={styles.loader}
          />
        ) : notJoined ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeStyles.text }]}>
              Bạn chưa tham gia nhà nào
            </Text>
            <TouchableOpacity
              style={[
                styles.joinHouseBtn,
                { backgroundColor: themeStyles.primary },
              ]}
              onPress={() => navigation.navigate('JoinHouse')}
              activeOpacity={0.85}
            >
              <Text style={styles.joinHouseIcon}>🏠</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.joinHouseTitle}>Tham gia nhà</Text>
                <Text style={styles.joinHouseSub}>
                  Nhập thông tin chủ nhà để kết nối
                </Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          </View>
        ) : devices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeStyles.text }]}>
              {isOwner
                ? 'Chưa có thiết bị nào'
                : 'Chưa có thiết bị nào trong nhà'}
            </Text>
            {isOwner && (
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  { backgroundColor: themeStyles.primary },
                ]}
                onPress={() => navigation.navigate('AddDevice')}
              >
                <Text style={styles.addBtnText}>Thêm ngay</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={item => item._id}
            renderItem={renderDeviceItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            onRefresh={fetchDevices}
            refreshing={loading}
          />
        )}
      </View>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSheet()}
      >
        <TouchableWithoutFeedback onPress={() => closeSheet()}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandleWrapper}>
            <View style={styles.dragHandle} />
          </View>

          {selectedDevice && (
            <View style={styles.sheetDeviceInfo}>
              <View
                style={[styles.sheetIconBox, { backgroundColor: '#E8F5E9' }]}
              >
                <Image
                  source={getDeviceIcon(selectedDevice.type)}
                  style={[styles.sheetDeviceImage, { tintColor: '#4CAF50' }]}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetDeviceName} numberOfLines={1}>
                  {selectedDevice.name}
                </Text>
                <Text style={styles.sheetDeviceType}>
                  {selectedDevice.type || 'Thiết bị'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.sheetDivider} />

          <TouchableOpacity
            style={styles.sheetAction}
            activeOpacity={0.7}
            onPress={() =>
              closeSheet(() =>
                navigation.navigate('EditDevice', { device: selectedDevice }),
              )
            }
          >
            <View
              style={[styles.sheetActionIcon, { backgroundColor: '#EEF2FF' }]}
            >
              <Text style={styles.sheetActionEmoji}>✏️</Text>
            </View>
            <Text style={styles.sheetActionText}>Chỉnh sửa thiết bị</Text>
            <Text style={styles.sheetActionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetAction}
            activeOpacity={0.7}
            onPress={() =>
              closeSheet(() =>
                Alert.alert(
                  'Xác nhận xóa',
                  `Bạn có chắc muốn xóa "${selectedDevice?.name}"?`,
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: () => handleDelete(selectedDevice?._id),
                    },
                  ],
                ),
              )
            }
          >
            <View
              style={[styles.sheetActionIcon, { backgroundColor: '#FFF0F0' }]}
            >
              <Text style={styles.sheetActionEmoji}>🗑️</Text>
            </View>
            <Text style={[styles.sheetActionText, { color: '#F44336' }]}>
              Xóa thiết bị
            </Text>
            <Text style={[styles.sheetActionArrow, { color: '#F44336' }]}>
              ›
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  houseName: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  headerIcon: { width: 30, height: 30, tintColor: '#fff' },
  body: { flex: 1 },
  loader: { marginTop: 40 },
  listContainer: { padding: 12 },
  row: { justifyContent: 'space-between' },
  deviceCard: {
    width: width / 2 - 18,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconBox: { padding: 10, borderRadius: 12 },
  deviceImage: { width: 35, height: 35 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardContent: {},
  deviceName: { fontSize: 16, fontWeight: '700' },
  roomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  roomDot: { fontSize: 10 },
  roomLabel: { fontSize: 11, fontWeight: '500', flexShrink: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, marginBottom: 15 },
  addBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandleWrapper: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
  },
  sheetDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  sheetIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sheetDeviceImage: { width: 28, height: 28 },
  sheetDeviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  sheetDeviceType: { fontSize: 13, color: '#888', textTransform: 'capitalize' },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
    marginBottom: 6,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 14,
  },
  sheetActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sheetActionEmoji: { fontSize: 18 },
  sheetActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sheetActionArrow: { fontSize: 22, color: '#CCC', fontWeight: '300' },
  joinHouseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    width: '85%',
    elevation: 3,
    gap: 12,
  },
  joinHouseIcon: { fontSize: 28 },
  joinHouseTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  joinHouseSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});
