import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../database/api';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  registerNotificationToken,
} from '../services/notificationService';

export default function NotificationSettingScreen({ navigation }) {
  const { styles: themeStyles, theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');

  const items = useMemo(
    () => [
      {
        key: 'new_member',
        icon: 'account-plus',
        title: t.notification_new_member,
        description: t.notification_new_member_desc,
      },
      {
        key: 'permission_granted',
        icon: 'shield-check',
        title: t.notification_permission_granted,
        description: t.notification_permission_granted_desc,
      },
      {
        key: 'device_status',
        icon: 'lightbulb-on-outline',
        title: t.notification_device_status_item,
        description: t.notification_device_status_desc,
      },
      {
        key: 'device_offline',
        icon: 'access-point-off',
        title: t.notification_device_offline_item,
        description: t.notification_device_offline_desc,
      },
      {
        key: 'automation_triggered',
        icon: 'robot-outline',
        title: t.notification_automation_item,
        description: t.notification_automation_desc,
      },
      {
        key: 'camera_detected',
        icon: 'cctv',
        title: t.notification_camera_item,
        description: t.notification_camera_desc,
      },
      {
        key: 'consumption_estimate',
        icon: 'chart-line',
        title: t.notification_consumption_estimate_item,
        description: t.notification_consumption_estimate_desc,
      },
    ],
    [t],
  );

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notification-settings');
      const remoteSettings = response.data?.notification_settings || {};
      setSettings({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...remoteSettings,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.cannot_load_notification_settings,
      });
    } finally {
      setLoading(false);
    }

    try {
      await registerNotificationToken();
    } catch (error) {
      console.warn(
        '[NotificationSetting] Token registration warning:',
        error?.message,
      );
    }
  }, [t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const persistSettings = async nextSettings => {
    await api.post('/notification-settings', nextSettings);
    Toast.show({
      type: 'success',
      text1: t.success,
      text2: t.notification_settings_saved,
    });
  };

  const handleToggle = async (key, value) => {
    const previousSettings = settings;
    const nextSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(nextSettings);
    setSavingKey(key);

    try {
      await persistSettings(nextSettings);
    } catch (error) {
      setSettings(previousSettings);
      Toast.show({
        type: 'error',
        text1: t.error,
        text2: t.cannot_save_notification_settings,
      });
    } finally {
      setSavingKey('');
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />

      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t.notification_settings_title}</Text>

        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={themeStyles.primary} />
          <Text style={[styles.loadingText, { color: themeStyles.subText }]}>
            {t.loading}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View
            style={[styles.infoCard, { backgroundColor: themeStyles.card }]}
          >
            <Text style={[styles.infoTitle, { color: themeStyles.text }]}>
              {t.notification_settings_title}
            </Text>
            <Text
              style={[styles.infoDescription, { color: themeStyles.subText }]}
            >
              {t.notification_settings_desc}
            </Text>
          </View>

          <View
            style={[styles.groupCard, { backgroundColor: themeStyles.card }]}
          >
            <SettingRow
              icon="bell-ring-outline"
              title={t.notification_all}
              description={t.notification_all_desc}
              value={!!settings.enabled}
              onChange={value => handleToggle('enabled', value)}
              activeColor={themeStyles.primary}
              textColor={themeStyles.text}
              subTextColor={themeStyles.subText}
              borderColor={themeStyles.border}
              saving={savingKey === 'enabled'}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>
            {t.notification_household_events}
          </Text>

          <View
            style={[styles.groupCard, { backgroundColor: themeStyles.card }]}
          >
            {items.map((item, index) => {
              const disabled = !settings.enabled;

              return (
                <SettingRow
                  key={item.key}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  value={!!settings[item.key]}
                  onChange={value => handleToggle(item.key, value)}
                  disabled={disabled}
                  activeColor={themeStyles.primary}
                  textColor={themeStyles.text}
                  subTextColor={themeStyles.subText}
                  borderColor={
                    index === items.length - 1
                      ? 'transparent'
                      : themeStyles.border
                  }
                  saving={savingKey === item.key}
                />
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function SettingRow({
  icon,
  title,
  description,
  value,
  onChange,
  disabled = false,
  activeColor,
  textColor,
  subTextColor,
  borderColor,
  saving,
}) {
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: borderColor },
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={styles.rowLeft}>
        <View
          style={[styles.iconCircle, { backgroundColor: `${activeColor}20` }]}
        >
          <MaterialCommunityIcons name={icon} size={20} color={activeColor} />
        </View>
        <View style={styles.rowTextBox}>
          <Text style={[styles.rowTitle, { color: textColor }]}>{title}</Text>
          <Text style={[styles.rowDescription, { color: subTextColor }]}>
            {description}
          </Text>
        </View>
      </View>

      {saving ? (
        <ActivityIndicator size="small" color={activeColor} />
      ) : (
        <Switch
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          thumbColor={value ? activeColor : '#f4f3f4'}
          trackColor={{ false: '#bdbdbd', true: `${activeColor}88` }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 72,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 24,
  },
  body: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  groupCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextBox: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  rowDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
});
