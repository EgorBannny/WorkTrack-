import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiLogin, apiRegister, apiMe } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { Colors, Spacing, FontSize, Radius } from '../../theme'

export default function AuthScreen() {
  const setUser = useAuthStore((s) => s.setUser)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  // login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // register extra
  const [displayName, setDisplayName] = useState('')

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Ошибка', 'Заполните все поля'); return }
    setLoading(true)
    try {
      await apiLogin(email.trim(), password)
      const user = await apiMe()
      setUser(user)
    } catch {
      Alert.alert('Ошибка', 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!displayName || !email || !password) { Alert.alert('Ошибка', 'Заполните все поля'); return }
    if (password.length < 8) { Alert.alert('Ошибка', 'Пароль — минимум 8 символов'); return }
    setLoading(true)
    try {
      await apiRegister(email.trim(), password, displayName.trim())
      await apiLogin(email.trim(), password)
      const user = await apiMe()
      setUser(user)
    } catch {
      Alert.alert('Ошибка', 'Email уже занят или произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Лого */}
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>⚡</Text>
            </View>
            <Text style={styles.logoText}>WorkTrack</Text>
          </View>

          <Text style={styles.title}>
            {mode === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Введите данные для входа' : 'Заполните данные для регистрации'}
          </Text>

          <View style={styles.form}>
            {mode === 'register' && (
              <View style={styles.field}>
                <Text style={styles.label}>Имя</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Иван Иванов"
                  placeholderTextColor={Colors.textFaint}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="name@company.com"
                placeholderTextColor={Colors.textFaint}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Пароль</Text>
              <TextInput
                style={styles.input}
                placeholder={mode === 'register' ? 'Минимум 8 символов' : '••••••••'}
                placeholderTextColor={Colors.textFaint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={Colors.primaryForeground} />
                : <Text style={styles.btnText}>{mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xl },
  logoIcon: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 20 },
  logoText: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  form: { gap: Spacing.md },
  field: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.text },
  input: {
    height: 48, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: 14,
    fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.background,
  },
  btn: {
    height: 48, backgroundColor: Colors.primary,
    borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.primaryForeground, fontSize: FontSize.md, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  switchText: { fontSize: FontSize.sm, color: Colors.textMuted },
  switchLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
})