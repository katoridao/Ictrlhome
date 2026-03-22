import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AppearanceScreen({ navigation }) {
  const { theme, changeTheme, styles: themeStyles } = useTheme();

  const options = [
    { label: 'Sáng', desc: 'Dễ nhìn, phù hợp ban ngày', value: 'LIGHT' },
    { label: 'Tối', desc: 'Dịu mắt, phù hợp ban đêm', value: 'DARK' },
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

      <View style={[localStyles.header, { backgroundColor: themeStyles.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Image
            source={require('../../public/img/back.png')}
            style={localStyles.backIcon}
          />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Giao diện</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={localStyles.body}>
        <Text style={[localStyles.title, { color: themeStyles.text }]}>
          Chọn chế độ hiển thị
        </Text>
        <Text style={[localStyles.subtitle, { color: themeStyles.subText }]}>
          Áp dụng ngay cho toàn bộ ứng dụng.
        </Text>

        <View style={localStyles.grid}>
          {options.map(item => {
            const selected = theme === item.value;
            const previewBg = item.value === 'DARK' ? '#121212' : '#F8F9FA';
            const previewCard = item.value === 'DARK' ? '#1E1E1E' : '#FFFFFF';
            const previewText = item.value === 'DARK' ? '#FFFFFF' : '#212529';
            const previewSub = item.value === 'DARK' ? '#B0B0B0' : '#6C757D';

            return (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.85}
                onPress={() => changeTheme(item.value)}
                style={[
                  localStyles.optionCard,
                  {
                    backgroundColor: themeStyles.card,
                    borderColor: selected ? themeStyles.primary : themeStyles.border,
                  },
                ]}
              >
                <View style={localStyles.optionHeader}>
                  <View>
                    <Text style={[localStyles.optionTitle, { color: themeStyles.text }]}>
                      {item.label}
                    </Text>
                    <Text style={[localStyles.optionDesc, { color: themeStyles.subText }]}>
                      {item.desc}
                    </Text>
                  </View>

                  <View
                    style={[
                      localStyles.checkDot,
                      {
                        borderColor: selected ? themeStyles.primary : themeStyles.border,
                        backgroundColor: selected ? themeStyles.primary : 'transparent',
                      },
                    ]}
                  >
                    {selected && <Text style={localStyles.checkMark}>✓</Text>}
                  </View>
                </View>

                <View
                  style={[
                    localStyles.preview,
                    { backgroundColor: previewBg, borderColor: themeStyles.border },
                  ]}
                >
                  <View style={[localStyles.previewHeader, { backgroundColor: '#3B9CFF' }]} />
                  <View style={localStyles.previewContent}>
                    <View style={[localStyles.previewCard, { backgroundColor: previewCard }]}>
                      <Text style={[localStyles.previewText, { color: previewText }]}>
                        Thiết bị
                      </Text>
                      <Text style={[localStyles.previewSub, { color: previewSub }]}>
                        Trạng thái: ON
                      </Text>
                    </View>
                    <View style={[localStyles.previewCardSmall, { backgroundColor: previewCard }]} />
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
  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
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
