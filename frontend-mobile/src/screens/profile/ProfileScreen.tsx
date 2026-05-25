import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation } from '@tanstack/react-query'
import { apiUpdateProfile } from '../../api/profile.api'
import { apiLogin, apiMe } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { Avatar } from '../../components/Avatar'
import { Colors, Spacing, FontSize, Radius } from '../../theme'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const { mutate: saveName, isPending: savingName, isSuccess: nameSaved } = useMutation({
    mutationFn: () => apiUpdateProfile({ display_name: displayName.trim() }),
    onSuccess: async () => { const u = await apiMe(); setUser(u) },
    onError: () => Alert.alert('Ошибка', 'Не удалось сохранить имя'),
  })

  const { mutate: saveEmail, isPending: savingEmail, isSuccess: emailSaved } = useMutation({
    mutationFn: () => apiUpdateProfile({ email: email.trim() }),
    onSuccess: async () => { const u = await apiMe(); setUser(u) },
    onError: () => Alert.alert('Ошибка', 'Не удалось сохранить email'),
  })

  const { mutate: savePassword, isPending: savingPassword, isSuccess: passwordSaved } = useMutation({
    mutationFn: async () => {
      try {
        await apiLogin(user!.email, currentPassword)
      } catch {
        throw new Error('Неверный текущий пароль')
      }
      await apiUpdateProfile({ password: newPassword })
    },
    onSuccess: () => { setCurrentPassword(''); setNewPassword('') },
    onError: (e: Error) => Alert.alert('Ошибка', e.message),
  })

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Аватар */}
        <View style={styles.avatarSection}>
          <Avatar src={user ? `/api/users/avatar/${user.id}` : null} name={user?.display_name} size={72} />
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{user?.display_name}</Text>
            <Text style={styles.avatarEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Имя */}
        <Section title="Отображаемое имя">
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.saveBtn, savingName && { opacity: 0.6 }]}
            onPress={() => saveName()}
            disabled={savingName}
          >
            {savingName
              ? <ActivityIndicator color={Colors.primaryForeground} size="small" />
              : <Text style={styles.saveBtnText}>Сохранить</Text>
            }
          </TouchableOpacity>
          {nameSaved && <Text style={styles.savedText}>✓ Сохранено</Text>}
        </Section>

        {/* Email */}
        <Section title="Email">
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TouchableOpacity
            style={[styles.saveBtn, savingEmail && { opacity: 0.6 }]}
            onPress={() => saveEmail()}
            disabled={savingEmail}
          >
            {savingEmail
              ? <ActivityIndicator color={Colors.primaryForeground} size="small" />
              : <Text style={styles.saveBtnText}>Сохранить</Text>
            }
          </TouchableOpacity>
          {emailSaved && <Text style={styles.savedText}>✓ Сохранено</Text>}
        </Section>

        {/* Смена пароля */}
        <Section title="Смена пароля">
          <Text style={styles.fieldLabel}>Текущий пароль</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Введите текущий пароль"
            placeholderTextColor={Colors.textFaint}
            autoComplete="current-password"
          />
          <Text style={[styles.fieldLabel, { marginTop: Spacing.sm }]}>Новый пароль</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Минимум 8 символов"
            placeholderTextColor={Colors.textFaint}
            autoComplete="new-password"
          />
          <TouchableOpacity
            style={[styles.saveBtn, savingPassword && { opacity: 0.6 }]}
            onPress={() => {
              if (newPassword.length < 8) { Alert.alert('Ошибка', 'Пароль — минимум 8 символов'); return }
              savePassword()
            }}
            disabled={savingPassword}
          >
            {savingPassword
              ? <ActivityIndicator color={Colors.primaryForeground} size="small" />
              : <Text style={styles.saveBtnText}>Сменить пароль</Text>
            }
          </TouchableOpacity>
          {passwordSaved && <Text style={styles.savedText}>✓ Пароль изменён</Text>}
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md },
  avatarSection: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, marginBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatarInfo: { flex: 1 },
  avatarName: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  avatarEmail: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  section: {
    marginBottom: Spacing.lg, paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.md, color: Colors.text, marginBottom: Spacing.sm,
  },
  saveBtn: {
    alignSelf: 'flex-start', backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.sm,
  },
  saveBtnText: { color: Colors.primaryForeground, fontSize: FontSize.sm, fontWeight: '600' },
  savedText: { fontSize: FontSize.sm, color: Colors.success, marginTop: 6 },
})