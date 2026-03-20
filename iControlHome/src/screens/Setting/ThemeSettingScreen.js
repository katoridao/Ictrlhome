import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeSettingScreen() {
  const { theme, changeTheme, styles: themeStyles } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />

      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Image
          source={require('../../../public/img/moon.png')}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Giao diện</Text>
      </View>

      <View style={styles.body}>
        {[
          { label: 'Sáng', value: 'LIGHT' },
          { label: 'Tối', value: 'DARK' },
        ].map(opt => {
          const selected = theme === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.85}
              onPress={() => changeTheme(opt.value)}
              style={[
                styles.item,
                {
                  backgroundColor: themeStyles.card,
                  borderColor: selected ? themeStyles.primary : themeStyles.border,
                },
              ]}
            >
              <Text style={[styles.itemText, { color: themeStyles.text }]}>
                {opt.label}
              </Text>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: selected ? themeStyles.primary : 'transparent',
                    borderColor: selected ? themeStyles.primary : themeStyles.border,
                  },
                ]}
              >
                {selected && <Text style={styles.dotCheck}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  itemText: { fontSize: 16, fontWeight: '800' },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCheck: { color: '#fff', fontWeight: '900' },
});
