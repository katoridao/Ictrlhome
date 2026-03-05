import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ScriptScreen({ navigation }) {
  const { theme, styles: themeStyles } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: themeStyles.background }]}
    >
      {/* StatusBar tự đổi theo theme để rõ pin/giờ */}
      <StatusBar
        barStyle={theme === 'DARK' ? 'light-content' : 'dark-content'}
        backgroundColor={themeStyles.primary}
      />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: themeStyles.primary }]}>
        <Text style={styles.sortText}>Sắp xếp</Text>
        <Text style={styles.headerTitle}>Kịch bản</Text>
        <TouchableOpacity>
          <Image
            source={require('../../public/img/add.png')}
            style={{ width: 22, height: 22, tintColor: '#fff' }}
          />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView contentContainerStyle={styles.body}>
        <ScriptItem
          icon={require('../../public/img/tv.png')}
          title="Kịch bản 1"
          themeStyles={themeStyles}
        />
        <ScriptItem
          icon={require('../../public/img/fan.png')}
          title="Kịch bản mới"
          themeStyles={themeStyles}
        />
      </ScrollView>
    </View>
  );
}

function ScriptItem({ icon, title, themeStyles }) {
  return (
    <View style={[styles.card, { backgroundColor: themeStyles.card }]}>
      {/* KHÔNG CÓ tintColor: Giữ màu gốc của icon (như màu xanh của TV/Quạt) */}
      <Image source={icon} style={styles.scriptIcon} />

      <Text style={[styles.cardText, { color: themeStyles.text }]}>
        {title}
      </Text>

      <View style={styles.cardActions}>
        <TouchableOpacity>
          {/* Giữ màu gốc của icon clip (ghim) */}
          <Image
            source={require('../../public/img/clip.png')}
            style={[styles.actionIcon, { tintColor: '#FF0000' }]}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          {/* Giữ màu gốc của icon menu-dots */}
          <Image
            source={require('../../public/img/menu-dots.png')}
            style={[styles.actionIcon, { tintColor: '#FF0000' }]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  sortText: { color: '#fff', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 90 },
  card: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  scriptIcon: { width: 30, height: 30, marginRight: 12 },
  cardText: { flex: 1, fontSize: 16, fontWeight: '500' },
  cardActions: { flexDirection: 'row' },
  actionIcon: { width: 20, height: 20 },
});
