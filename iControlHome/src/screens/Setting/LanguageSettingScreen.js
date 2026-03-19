import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { LanguageContext } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function LanguageSettingScreen() {
  const { language, changeLanguage, t } = useContext(LanguageContext);
  const { theme, styles: themeStyles } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />

      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Image
          source={require('../../../public/img/language.png')}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>{t.language}</Text>
      </View>

      <View style={styles.body}>

        <TouchableOpacity
          style={[
            styles.item,
            {
              backgroundColor: themeStyles.card,
              borderColor:
                language === 'vi' ? themeStyles.primary : themeStyles.border,
            },
          ]}
          onPress={() => changeLanguage('vi')}
          activeOpacity={0.85}
        >
          <Text style={[styles.itemText, { color: themeStyles.text }]}>
            {t.vietnamese}
          </Text>
          {language === 'vi' && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.item,
            {
              backgroundColor: themeStyles.card,
              borderColor:
                language === 'en' ? themeStyles.primary : themeStyles.border,
            },
          ]}
          onPress={() => changeLanguage('en')}
          activeOpacity={0.85}
        >
          <Text style={[styles.itemText, { color: themeStyles.text }]}>
            {t.english}
          </Text>
          {language === 'en' && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      </View>
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
  headerIcon: { width: 24, height: 24, tintColor: '#fff', marginRight: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  body: { padding: 16, gap: 12 },
  item: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  itemText: { fontSize: 16, fontWeight: '800' },
  check: { color: '#3B9CFF', fontWeight: '900', fontSize: 18 },
});
