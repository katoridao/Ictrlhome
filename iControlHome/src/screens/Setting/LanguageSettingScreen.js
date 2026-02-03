import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LanguageContext } from '../../context/LanguageContext';
import { ThemeContext } from '../../context/ThemeContext';

export default function LanguageSettingScreen() {
  const { language, changeLanguage, t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.language}</Text>

      <TouchableOpacity
        style={[styles.item, language === 'vi' && styles.active]}
        onPress={() => changeLanguage('vi')}
      >
        <Text>{t.vietnamese}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.item, language === 'en' && styles.active]}
        onPress={() => changeLanguage('en')}
      >
        <Text>{t.english}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  item: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  active: { backgroundColor: '#3b9cff' },
});
