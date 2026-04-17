import { Image, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidBadgeIconType,
  AndroidCategory,
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import api from '../database/api';
import { navigateFromNotificationData } from '../navigation/navigationService';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  new_member: true,
  permission_granted: true,
  device_status: true,
  automation_triggered: true,
  camera_detected: true,
  consumption_estimate: true,
};

export const NOTIFICATION_CHANNEL_ID = 'ictrlhome-default';
const REGISTERED_FCM_TOKEN_KEY = 'registered_fcm_token';
const BRAND_SUBTITLE = 'iCtrlHome • Smart Home';
const LOGO_ASSET = Image.resolveAssetSource(
  require('../../public/img/logo.png'),
)?.uri;

let foregroundUnsubscribe = null;
let tokenRefreshUnsubscribe = null;
let notificationPressUnsubscribe = null;
let notificationOpenedUnsubscribe = null;
let bootstrapPromise = null;
let lastDisplayedMessageId = null;
let lastDisplayedAt = 0;
let lastOpenedNotificationKey = null;
let lastOpenedAt = 0;

const normalizeData = data => {
  return Object.entries(data || {}).reduce((acc, [key, value]) => {
    acc[key] = value == null ? '' : String(value);
    return acc;
  }, {});
};

const getStoredLanguage = async () => {
  const language = await AsyncStorage.getItem('language');
  return language === 'en' ? 'en' : 'vi';
};

const isStatusOn = status => {
  if (typeof status === 'boolean') return status;
  return String(status || '').toUpperCase() === 'ON';
};

const resolveLocalizedRemoteContent = async remoteMessage => {
  const data = remoteMessage?.data || {};
  const localizationKey = data.localization_key || '';
  const language = await getStoredLanguage();
  const fallbackTitle =
    remoteMessage?.notification?.title || data?.title || 'iCtrlHome';
  const fallbackBody =
    remoteMessage?.notification?.body ||
    data?.body ||
    (language === 'en'
      ? 'You have a new notification from your smart home system.'
      : 'Bạn có một thông báo mới từ hệ thống nhà thông minh.');

  if (!localizationKey) {
    return { title: fallbackTitle, body: fallbackBody };
  }

  const statusOn = isStatusOn(data.status);
  const actorName =
    data.actor_name || (language === 'en' ? 'System' : 'Hệ thống');
  const deviceName = data.device_name || '';
  const automationName = data.automation_name || '';
  const memberName =
    data.member_name ||
    (language === 'en' ? 'A new member' : 'Một thành viên mới');
  const personName =
    data.person_name || (language === 'en' ? 'Unknown person' : 'Người lạ');
  const ownerName =
    data.owner_name || (language === 'en' ? 'the home owner' : 'chủ nhà');

  switch (localizationKey) {
    case 'new_member':
      return language === 'en'
        ? {
            title: 'A new member joined your house',
            body: `${memberName} joined your family.`,
          }
        : {
            title: 'Có thành viên mới gia nhập nhà',
            body: `${memberName} đã gia nhập gia đình của bạn.`,
          };

    case 'member_added_to_household':
      return language === 'en'
        ? {
            title: 'Family updated',
            body: `${ownerName} added ${memberName} to the household.`,
          }
        : {
            title: 'Cập nhật hộ gia đình',
            body: `${ownerName} đã thêm ${memberName} vào hộ gia đình.`,
          };

    case 'member_self_joined':
      return language === 'en'
        ? {
            title: 'Joined house successfully',
            body: `You joined ${ownerName}'s house successfully.`,
          }
        : {
            title: 'Tham gia nhà thành công',
            body: `Bạn đã gia nhập nhà của ${ownerName} thành công.`,
          };

    case 'member_added_by_owner':
      return language === 'en'
        ? {
            title: 'You were added to a house',
            body: `You were added to ${ownerName}'s house.`,
          }
        : {
            title: 'Bạn đã được thêm vào hộ gia đình',
            body: `Bạn đã được ${ownerName} thêm vào hộ gia đình.`,
          };

    case 'permission_granted': {
      const scopeLabel = deviceName
        ? language === 'en'
          ? `device ${deviceName}`
          : `thiết bị ${deviceName}`
        : data.room_name
        ? language === 'en'
          ? `room ${data.room_name}`
          : `phòng ${data.room_name}`
        : language === 'en'
        ? 'your home system'
        : 'hệ thống nhà';
      const grantActorName =
        data.actor_name || (language === 'en' ? 'The admin' : 'Admin');

      return language === 'en'
        ? {
            title: 'Access granted to you',
            body: [
              `Granted by: ${grantActorName}`,
              `Scope: ${scopeLabel}`,
            ].join('\n'),
          }
        : {
            title: 'Bạn vừa được cấp quyền sử dụng',
            body: [
              `Người cấp quyền: ${grantActorName}`,
              `Phạm vi: ${scopeLabel}`,
            ].join('\n'),
          };
    }

    case 'device_status':
      return language === 'en'
        ? {
            title: `Device ${statusOn ? 'turned on' : 'turned off'}`,
            body: [
              `Device: ${deviceName || 'Unknown'}`,
              `By: ${actorName}`,
              `Status: ${statusOn ? 'ON' : 'OFF'}`,
            ].join('\n'),
          }
        : {
            title: `Thiết bị vừa được ${statusOn ? 'bật' : 'tắt'}`,
            body: [
              `Thiết bị: ${deviceName || 'Không xác định'}`,
              `Người thao tác: ${actorName}`,
              `Trạng thái: ${statusOn ? 'BẬT' : 'TẮT'}`,
            ].join('\n'),
          };

    case 'automation_triggered':
      return language === 'en'
        ? {
            title: 'Automation was triggered',
            body: [
              `Automation: ${automationName || 'Unnamed automation'}`,
              `Set by: ${actorName}`,
              `Device: ${deviceName || 'The device'}`,
              `Action: ${statusOn ? 'TURN ON' : 'TURN OFF'}`,
            ].join('\n'),
          }
        : {
            title: 'Automation vừa được kích hoạt',
            body: [
              `Automation: ${automationName || 'Chưa đặt tên'}`,
              `Người thiết lập: ${actorName}`,
              `Thiết bị: ${deviceName || 'Thiết bị'}`,
              `Hành động: ${statusOn ? 'BẬT' : 'TẮT'}`,
            ].join('\n'),
          };

    case 'camera_detected':
      if (language === 'en') {
        return data.detected_status === 'known'
          ? {
              title: 'The camera detected someone',
              body: [
                `Detected person: ${personName}`,
                'Status: Recognized',
              ].join('\n'),
            }
          : {
              title: 'The camera detected an unknown person',
              body: [
                'Detected person: Unknown',
                'Status: Needs attention',
              ].join('\n'),
            };
      }

      return data.detected_status === 'known'
        ? {
            title: 'Camera vừa phát hiện người xuất hiện',
            body: [`Đối tượng: ${personName}`, 'Trạng thái: Đã nhận diện'].join(
              '\n',
            ),
          }
        : {
            title: 'Camera vừa phát hiện người lạ',
            body: ['Đối tượng: Người lạ', 'Trạng thái: Cần kiểm tra ngay'].join(
              '\n',
            ),
          };

    case 'estimated_cost_threshold':
    case 'consumption_estimate_threshold': {
      const monthLabel = data.month_label || (language === 'en' ? 'Current month' : 'Tháng hiện tại');
      const threshold = Number(data.threshold_vnd || 0);
      const total = Number(data.total_cost_vnd || 0);

      return language === 'en'
        ? {
            title: 'Estimated electricity cost reached a new level',
            body: [
              `Month: ${monthLabel}`,
              `Reached threshold: ${Math.round(threshold).toLocaleString('en-US')} VND`,
              `Current estimate: ${Math.round(total).toLocaleString('en-US')} VND`,
            ].join('\n'),
          }
        : {
            title: 'Chi phí điện ước tính đã đạt ngưỡng mới',
            body: [
              `Tháng: ${monthLabel}`,
              `Ngưỡng vừa đạt: ${Math.round(threshold).toLocaleString('vi-VN')} VNĐ`,
              `Ước tính hiện tại: ${Math.round(total).toLocaleString('vi-VN')} VNĐ`,
            ].join('\n'),
          };
    }

    default:
      return { title: fallbackTitle, body: fallbackBody };
  }
};

const getNotificationVisualProfile = (data = {}, language = 'vi') => {
  const key = data?.localization_key || '';
  const isEn = language === 'en';

  switch (key) {
    case 'new_member':
    case 'member_self_joined':
    case 'member_added_by_owner':
    case 'member_added_to_household':
      return {
        accentColor: '#8B5CF6',
        tag: isEn ? 'Member update' : 'Cập nhật thành viên',
        category: AndroidCategory.SOCIAL,
        vibrationPattern: [250, 250, 250, 400],
      };
    case 'permission_granted':
      return {
        accentColor: '#10B981',
        tag: isEn ? 'Access update' : 'Cập nhật quyền',
        category: AndroidCategory.MESSAGE,
        vibrationPattern: [200, 150, 250, 300],
      };
    case 'device_status':
      return {
        accentColor: '#F59E0B',
        tag: isEn ? 'Device activity' : 'Trạng thái thiết bị',
        category: AndroidCategory.STATUS,
        vibrationPattern: [180, 120, 180, 250],
      };
    case 'automation_triggered':
      return {
        accentColor: '#2563EB',
        tag: isEn ? 'Automation alert' : 'Cảnh báo automation',
        category: AndroidCategory.REMINDER,
        vibrationPattern: [220, 180, 220, 350],
      };
    case 'camera_detected':
      return {
        accentColor: '#EF4444',
        tag: isEn ? 'Camera detection' : 'Phát hiện từ camera',
        category: AndroidCategory.ALARM,
        vibrationPattern: [300, 200, 300, 450],
      };
    case 'estimated_cost_threshold':
    case 'consumption_estimate_threshold':
      return {
        accentColor: '#7C3AED',
        tag: isEn ? 'Estimated electricity cost' : 'Chi phí điện ước tính',
        category: AndroidCategory.REMINDER,
        vibrationPattern: [220, 180, 220, 320],
      };
    default:
      return {
        accentColor: '#3B9CFF',
        tag: isEn ? 'Smart alert' : 'Cảnh báo thông minh',
        category: AndroidCategory.MESSAGE,
        vibrationPattern: [200, 200, 250, 350],
      };
  }
};

export const createNotificationChannel = async () => {
  await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'iCtrlHome Notifications',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [250, 250, 250, 500],
    lights: true,
    lightColor: '#3B9CFF',
    badge: true,
    sound: 'default',
  });
};

export const displayLocalNotification = async ({ title, body, data = {} }) => {
  await createNotificationChannel();

  const safeTitle = title || 'iCtrlHome';
  const safeBody =
    body || 'Bạn có một thông báo mới từ hệ thống nhà thông minh.';
  const normalizedLanguage =
    String(data?.language || '').toLowerCase() === 'en' ||
    String(data?.language || '').toUpperCase() === 'EN'
      ? 'en'
      : 'vi';
  const visual = getNotificationVisualProfile(data, normalizedLanguage);
  const subtitle = `${visual.tag} • ${BRAND_SUBTITLE}`;
  const summaryText =
    normalizedLanguage === 'en'
      ? 'Tap to open iCtrlHome'
      : 'Chạm để mở iCtrlHome';

  await notifee.displayNotification({
    title: safeTitle,
    subtitle,
    body: safeBody,
    data: normalizeData(data),
    android: {
      channelId: NOTIFICATION_CHANNEL_ID,
      smallIcon: 'ic_launcher',
      largeIcon: LOGO_ASSET,
      circularLargeIcon: true,
      badgeIconType: AndroidBadgeIconType.LARGE,
      category: visual.category,
      color: visual.accentColor,
      visibility: AndroidVisibility.PUBLIC,
      showTimestamp: true,
      timestamp: Date.now(),
      vibrationPattern: visual.vibrationPattern,
      lights: [visual.accentColor, 300, 700],
      pressAction: {
        id: 'default',
      },
      importance: AndroidImportance.HIGH,
      style: {
        type: AndroidStyle.BIGTEXT,
        title: safeTitle,
        text: safeBody,
        summary: summaryText,
      },
    },
    ios: {
      sound: 'default',
      subtitle,
    },
  });
};

const shouldDisplayLocalFromRemoteMessage = (
  remoteMessage,
  { isBackground = false } = {},
) => {
  const title =
    remoteMessage?.notification?.title || remoteMessage?.data?.title || '';
  const body =
    remoteMessage?.notification?.body || remoteMessage?.data?.body || '';
  const localizationKey = remoteMessage?.data?.localization_key || '';

  if (!title && !body && !localizationKey) {
    return false;
  }

  const messageId = remoteMessage?.messageId;
  const now = Date.now();

  if (
    messageId &&
    lastDisplayedMessageId === messageId &&
    now - lastDisplayedAt < 5000
  ) {
    return false;
  }

  // When the app is in the background, the OS already renders the remote
  // notification payload. In the foreground, we still need a local banner so
  // the user can actually see the alert immediately.
  if (isBackground && remoteMessage?.notification) {
    return false;
  }

  if (messageId) {
    lastDisplayedMessageId = messageId;
    lastDisplayedAt = now;
  }

  return true;
};

export const handleRemoteMessageNotification = async (
  remoteMessage,
  options = {},
) => {
  if (!shouldDisplayLocalFromRemoteMessage(remoteMessage, options)) {
    return false;
  }

  const { title, body } = await resolveLocalizedRemoteContent(remoteMessage);

  await displayLocalNotification({
    title,
    body,
    data: remoteMessage?.data || {},
  });

  return true;
};

export const requestNotificationPermission = async () => {
  let androidGranted = true;

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const permissionStatus = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    androidGranted = permissionStatus === PermissionsAndroid.RESULTS.GRANTED;
  }

  try {
    await notifee.requestPermission();
  } catch (error) {
    console.warn('[Notification] notifee permission warning:', error?.message);
  }

  const authStatus = await messaging().requestPermission();
  const messagingGranted =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL ||
    Platform.OS === 'android';

  return androidGranted && messagingGranted;
};

export const registerNotificationToken = async () => {
  try {
    const authToken = await AsyncStorage.getItem('token');
    if (!authToken) return null;

    await messaging().setAutoInitEnabled(true);

    try {
      await messaging().registerDeviceForRemoteMessages();
    } catch (error) {
      // Ignore when the device is already registered.
    }

    const token = await messaging().getToken();
    if (!token) return null;

    await api.post('/notification-token', { token });

    const cachedToken = await AsyncStorage.getItem(REGISTERED_FCM_TOKEN_KEY);
    if (cachedToken !== token) {
      await AsyncStorage.setItem(REGISTERED_FCM_TOKEN_KEY, token);
    }

    console.log('[Notification] FCM token synced to server');
    return token;
  } catch (error) {
    console.warn('[Notification] register token warning:', error?.message);
    return null;
  }
};

export const unregisterNotificationToken = async () => {
  const registeredToken = await AsyncStorage.getItem(REGISTERED_FCM_TOKEN_KEY);

  if (registeredToken) {
    try {
      await api.delete('/notification-token', {
        data: { token: registeredToken },
      });
    } catch (error) {
      console.warn('[Notification] unregister token warning:', error?.message);
    }
  }

  await AsyncStorage.removeItem(REGISTERED_FCM_TOKEN_KEY);
};

const buildNotificationOpenKey = (data = {}) => {
  return [
    data?.message_id || '',
    data?.created_at || '',
    data?.type || '',
    data?.localization_key || '',
    data?.target_screen || '',
    data?.device_id || '',
  ].join('::');
};

export const openScreenFromNotificationData = async (data = {}) => {
  if (!data || !Object.keys(data).length) {
    return false;
  }

  const openKey = buildNotificationOpenKey(data);
  const now = Date.now();

  if (
    openKey &&
    lastOpenedNotificationKey === openKey &&
    now - lastOpenedAt < 2500
  ) {
    return false;
  }

  lastOpenedNotificationKey = openKey;
  lastOpenedAt = now;

  return navigateFromNotificationData(data);
};

export const bootstrapNotifications = async () => {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    await createNotificationChannel();

    try {
      await requestNotificationPermission();
    } catch (error) {
      console.warn('[Notification] permission warning:', error?.message);
    }

    try {
      await registerNotificationToken();
    } catch (error) {
      console.warn('[Notification] register token warning:', error?.message);
    }

    if (!foregroundUnsubscribe) {
      foregroundUnsubscribe = messaging().onMessage(async remoteMessage => {
        await handleRemoteMessageNotification(remoteMessage, {
          isBackground: false,
        });
      });
    }

    if (!notificationPressUnsubscribe) {
      notificationPressUnsubscribe = notifee.onForegroundEvent(
        async ({ type, detail }) => {
          if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
            await openScreenFromNotificationData(detail?.notification?.data);
          }
        },
      );
    }

    if (!notificationOpenedUnsubscribe) {
      notificationOpenedUnsubscribe = messaging().onNotificationOpenedApp(
        async remoteMessage => {
          await openScreenFromNotificationData(remoteMessage?.data || {});
        },
      );
    }

    try {
      const initialNotifeeNotification = await notifee.getInitialNotification();
      if (initialNotifeeNotification?.notification?.data) {
        await openScreenFromNotificationData(
          initialNotifeeNotification.notification.data,
        );
      }

      const initialRemoteMessage = await messaging().getInitialNotification();
      if (initialRemoteMessage?.data) {
        await openScreenFromNotificationData(initialRemoteMessage.data);
      }
    } catch (error) {
      console.warn('[Notification] open notification warning:', error?.message);
    }

    if (!tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe = messaging().onTokenRefresh(async token => {
        try {
          await api.post('/notification-token', { token });
          await AsyncStorage.setItem(REGISTERED_FCM_TOKEN_KEY, token);
        } catch (error) {
          console.warn('[Notification] token refresh warning:', error?.message);
        }
      });
    }

    return true;
  })();

  return bootstrapPromise;
};

export const releaseNotificationListeners = () => {
  foregroundUnsubscribe?.();
  tokenRefreshUnsubscribe?.();
  notificationPressUnsubscribe?.();
  notificationOpenedUnsubscribe?.();
  foregroundUnsubscribe = null;
  tokenRefreshUnsubscribe = null;
  notificationPressUnsubscribe = null;
  notificationOpenedUnsubscribe = null;
  bootstrapPromise = null;
};
