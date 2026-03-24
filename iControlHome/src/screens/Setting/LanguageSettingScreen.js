import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { LanguageContext } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function LanguageSettingScreen({ navigation }) {
  const { language, changeLanguage, t } = useContext(LanguageContext);
  const { theme, styles: themeStyles } = useTheme();

  const options = [
    {
      value: 'vi',
      label: 'Tiếng Việt',
      desc: 'Chuyển toàn bộ ứng dụng sang tiếng Việt',
      previewGreeting: 'Xin chào!',
      previewSub: 'Trạng thái: BẬT',
    },
    {
      value: 'en',
      label: 'English',
      desc: 'Switch the entire app to English',
      previewGreeting: 'Hello!',
      previewSub: 'Status: ON',
    },
  ];

  return (
    <View
      style={[
        localStyles.container,
        { backgroundColor: themeStyles.background },
      ]}
    >
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />

      <View
        style={[localStyles.header, { backgroundColor: themeStyles.primary }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Image
            source={require('../../../public/img/back.png')}
            style={localStyles.backIcon}
          />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>{t.language}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={localStyles.body}>
        <Text style={[localStyles.title, { color: themeStyles.text }]}>
          {t.vietnamese === 'Tiếng Việt'
            ? 'Chọn ngôn ngữ hiển thị'
            : 'Choose display language'}
        </Text>
        <Text style={[localStyles.subtitle, { color: themeStyles.subText }]}>
          {t.vietnamese === 'Tiếng Việt'
            ? 'Áp dụng ngay cho toàn bộ ứng dụng.'
            : 'Applied instantly across the entire app.'}
        </Text>

        <View style={localStyles.grid}>
          {options.map(item => {
            const selected = language === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.85}
                onPress={() => changeLanguage(item.value)}
                style={[
                  localStyles.optionCard,
                  {
                    backgroundColor: themeStyles.card,
                    borderColor: selected
                      ? themeStyles.primary
                      : themeStyles.border,
                  },
                ]}
              >
                <View style={localStyles.optionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        localStyles.optionTitle,
                        { color: themeStyles.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        localStyles.optionDesc,
                        { color: themeStyles.subText },
                      ]}
                    >
                      {item.desc}
                    </Text>
                  </View>

                  <View
                    style={[
                      localStyles.checkDot,
                      {
                        borderColor: selected
                          ? themeStyles.primary
                          : themeStyles.border,
                        backgroundColor: selected
                          ? themeStyles.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    {selected && <Text style={localStyles.checkMark}>✓</Text>}
                  </View>
                </View>

                {/* Preview */}
                <View
                  style={[
                    localStyles.preview,
                    {
                      backgroundColor: themeStyles.background,
                      borderColor: themeStyles.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      localStyles.previewHeader,
                      { backgroundColor: '#3B9CFF' },
                    ]}
                  />
                  <View style={localStyles.previewContent}>
                    <View
                      style={[
                        localStyles.previewCard,
                        { backgroundColor: themeStyles.card },
                      ]}
                    >
                      <Text
                        style={[
                          localStyles.previewText,
                          { color: themeStyles.text },
                        ]}
                      >
                        {item.previewGreeting}
                      </Text>
                      <Text
                        style={[
                          localStyles.previewSub,
                          { color: themeStyles.subText },
                        ]}
                      >
                        {item.previewSub}
                      </Text>
                    </View>
                    <View
                      style={[
                        localStyles.previewCardSmall,
                        { backgroundColor: themeStyles.card },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
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
  backIcon: { width: 22, height: 22, tintColor: '#fff' },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  body: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  grid: { gap: 12 },
  optionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionTitle: { fontSize: 16, fontWeight: '800' },
  optionDesc: { fontSize: 12, marginTop: 2 },
  checkDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontWeight: '900' },
  preview: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  previewHeader: { height: 18 },
  previewContent: { padding: 10, gap: 8 },
  previewCard: { borderRadius: 12, padding: 10 },
  previewCardSmall: { height: 22, borderRadius: 10, opacity: 0.85 },
  previewText: { fontSize: 12, fontWeight: '800' },
  previewSub: { fontSize: 10, marginTop: 3 },
});
