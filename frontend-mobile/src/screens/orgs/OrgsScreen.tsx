import { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGetMyOrgs, apiCreateOrg } from '../../api/orgs.api'
import { useOrgStore } from '../../store/org.store'
import { useAuthStore } from '../../store/auth.store'
import { apiLogout } from '../../api/auth.api'
import { Avatar } from '../../components/Avatar'
import { Spinner } from '../../components/Spinner'
import { Colors, Spacing, FontSize, Radius } from '../../theme'
import { ROLE_LABELS, type OrgWithRole } from '../../types/org'

export default function OrgsScreen() {
  const qc = useQueryClient()
  const setCurrentOrg = useOrgStore((s) => s.setCurrentOrg)
  const setUser = useAuthStore((s) => s.setUser)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: apiGetMyOrgs,
  })

  const { mutate: createOrg, isPending } = useMutation({
    mutationFn: () => apiCreateOrg(newName.trim(), newDesc.trim() || undefined),
    onSuccess: (org) => {
      qc.invalidateQueries({ queryKey: ['orgs'] })
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      setCurrentOrg(org)
    },
    onError: () => Alert.alert('Ошибка', 'Не удалось создать организацию'),
  })

  async function handleLogout() {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти', style: 'destructive',
        onPress: async () => {
          try { await apiLogout() } finally { setUser(null) }
        },
      },
    ])
  }

  function handleCreate() {
    if (!newName.trim()) { Alert.alert('Ошибка', 'Укажите название'); return }
    createOrg()
  }

  if (isLoading) return <Spinner />

  return (
    <SafeAreaView style={styles.safe}>
      {/* Шапка */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>WorkTrack</Text>
          <Text style={styles.headerSub}>Выберите организацию</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orgs.filter((o) => o.is_active)}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Нет организаций</Text>
            <Text style={styles.emptyText}>
              Создайте новую или примите приглашение
            </Text>
          </View>
        }
        renderItem={({ item: org }) => (
          <TouchableOpacity
            style={styles.orgCard}
            onPress={() => setCurrentOrg(org)}
            activeOpacity={0.7}
          >
            <Avatar src={`/api/orgs/${org.id}/avatar`} name={org.name} size={52} />
            <View style={styles.orgInfo}>
              <Text style={styles.orgName} numberOfLines={1}>{org.name}</Text>
              <Text style={styles.orgRole}>{ROLE_LABELS[org.role]}</Text>
              {org.description ? (
                <Text style={styles.orgDesc} numberOfLines={1}>{org.description}</Text>
              ) : null}
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setShowCreate(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.createIcon}>＋</Text>
            <Text style={styles.createText}>Создать организацию</Text>
          </TouchableOpacity>
        }
      />

      {/* Модал создания */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Новая организация</Text>
            <TouchableOpacity onPress={() => { setShowCreate(false); setNewName(''); setNewDesc('') }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.label}>Название *</Text>
            <TextInput
              style={styles.input}
              placeholder="Название организации"
              placeholderTextColor={Colors.textFaint}
              value={newName}
              onChangeText={setNewName}
            />
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Описание</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Краткое описание..."
              placeholderTextColor={Colors.textFaint}
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, isPending && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending
                ? <ActivityIndicator color={Colors.primaryForeground} />
                : <Text style={styles.submitText}>Создать</Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { fontSize: FontSize.sm, color: Colors.destructive, fontWeight: '500' },
  list: { padding: Spacing.md, gap: Spacing.sm },
  orgCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  orgInfo: { flex: 1, minWidth: 0 },
  orgName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  orgRole: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  orgDesc: { fontSize: FontSize.xs, color: Colors.textFaint, marginTop: 2 },
  arrow: { fontSize: 22, color: Colors.textFaint },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  createIcon: { fontSize: 22, color: Colors.textMuted },
  createText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: '500' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  modalBody: { padding: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.background,
  },
  submitBtn: {
    height: 48, backgroundColor: Colors.primary, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg,
  },
  submitText: { color: Colors.primaryForeground, fontSize: FontSize.md, fontWeight: '600' },
})