import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

export default function ThemeSettingScreen() {
  const { theme, changeTheme, colors } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.theme}</Text>

      <TouchableOpacity
        style={[styles.item, theme === 'light' && styles.active]}
        onPress={() => changeTheme('light')}
      >
        <Text>{t.light}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.item, theme === 'dark' && styles.active]}
        onPress={() => changeTheme('dark')}
      >
        <Text>{t.dark}</Text>
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
