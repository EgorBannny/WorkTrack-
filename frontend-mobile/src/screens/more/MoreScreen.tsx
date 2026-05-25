import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiLogout } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { useOrgStore } from '../../store/org.store'
import { Avatar } from '../../components/Avatar'
import { Colors, Spacing, FontSize, Radius } from '../../theme'
import type { RootStackParamList } from '../../navigation/types'

type Nav = NativeStackNavigationProp<RootStackParamList>

function MenuItem({
  emoji, label, onPress, danger,
}: { emoji: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={[styles.menuLabel, danger && { color: Colors.destructive }]}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  )
}

export default function MoreScreen() {
  const navigation = useNavigation<Nav>()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const setCurrentOrg = useOrgStore((s) => s.setCurrentOrg)

  function handleSwitchOrg() {
    setCurrentOrg(null)
  }

  function handleLogout() {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти', style: 'destructive',
        onPress: async () => {
          try { await apiLogout() } finally { setUser(null); setCurrentOrg(null) }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Профиль */}
      <TouchableOpacity
        style={styles.profileCard}
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.8}
      >
        <Avatar src={user ? `/api/users/avatar/${user.id}` : null} name={user?.display_name} size={52} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.display_name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Текущая организация */}
      {currentOrg && (
        <View style={styles.orgCard}>
          <Text style={styles.orgLabel}>Текущая организация</Text>
          <Text style={styles.orgName}>{currentOrg.name}</Text>
        </View>
      )}

      {/* Меню */}
      <View style={styles.section}>
        <MenuItem emoji="📬" label="Приглашения" onPress={() => navigation.navigate('Invitations')} />
        <View style={styles.separator} />
        <MenuItem emoji="🏢" label="Сменить организацию" onPress={handleSwitchOrg} />
      </View>

      <View style={styles.section}>
        <MenuItem emoji="🚪" label="Выйти из аккаунта" onPress={handleLogout} danger />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.card },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.background, padding: Spacing.md,
    borderBottomWidth: 1, borderTopWidth: 1,
    borderColor: Colors.border, marginBottom: Spacing.lg,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  orgCard: {
    backgroundColor: Colors.background, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg,
  },
  orgLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  orgName: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text, marginTop: 2 },
  section: {
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  menuEmoji: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  menuArrow: { fontSize: 20, color: Colors.textFaint },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 56 },
})