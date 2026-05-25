import { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiGetProjects, apiCreateProject, apiDeleteProject } from '../../api/projects.api'
import { useOrgStore } from '../../store/org.store'
import { Spinner } from '../../components/Spinner'
import { Colors, Spacing, FontSize, Radius } from '../../theme'
import type { RootStackParamList } from '../../navigation/types'
import type { Project } from '../../types/project'

type Nav = NativeStackNavigationProp<RootStackParamList>

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#22c55e', '#f97316',
  '#ec4899', '#14b8a6', '#ef4444', '#3b82f6',
]

function projectColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return PROJECT_COLORS[Math.abs(h) % PROJECT_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default function ProjectsScreen() {
  const navigation = useNavigation<Nav>()
  const qc = useQueryClient()
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const orgId = currentOrg!.id
  const canManage = ['owner', 'admin', 'manager'].includes(currentOrg!.role)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', orgId],
    queryFn: () => apiGetProjects(orgId),
  })

  const { mutate: createProject, isPending } = useMutation({
    mutationFn: () => apiCreateProject(orgId, newName.trim(), newDesc.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', orgId] })
      setShowCreate(false); setNewName(''); setNewDesc('')
    },
    onError: () => Alert.alert('Ошибка', 'Не удалось создать проект'),
  })

  const { mutate: deleteProject } = useMutation({
    mutationFn: (projectId: string) => apiDeleteProject(orgId, projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', orgId] }),
  })

  function confirmDelete(project: Project) {
    Alert.alert('Удалить проект?', `«${project.name}» будет архивирован.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteProject(project.id) },
    ])
  }

  if (isLoading) return <Spinner />

  const active = projects.filter((p) => p.is_active)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Шапка */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orgName}>{currentOrg!.name}</Text>
          <Text style={styles.title}>Проекты</Text>
        </View>
        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.addText}>＋ Новый</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={active}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Нет проектов</Text>
            {canManage && (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
                <Text style={styles.emptyBtnText}>Создать проект</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item: project }) => {
          const color = projectColor(project.name)
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Board', {
                orgId, projectId: project.id, projectName: project.name,
              })}
              onLongPress={canManage ? () => confirmDelete(project) : undefined}
              activeOpacity={0.7}
            >
              <View style={[styles.colorBar, { backgroundColor: color }]} />
              <View style={styles.cardBody}>
                <View style={[styles.projectIcon, { backgroundColor: color }]}>
                  <Text style={styles.projectInitials}>{initials(project.name)}</Text>
                </View>
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                  {project.description ? (
                    <Text style={styles.projectDesc} numberOfLines={2}>{project.description}</Text>
                  ) : null}
                  <Text style={styles.projectDate}>{formatDate(project.created_at)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* Модал создания */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Новый проект</Text>
            <TouchableOpacity onPress={() => { setShowCreate(false); setNewName(''); setNewDesc('') }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>Название *</Text>
            <TextInput
              style={styles.input}
              placeholder="Название проекта"
              placeholderTextColor={Colors.textFaint}
              value={newName}
              onChangeText={setNewName}
            />
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Описание</Text>
            <TextInput
              style={[styles.input, { height: 72 }]}
              placeholder="Краткое описание..."
              placeholderTextColor={Colors.textFaint}
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, (!newName.trim() || isPending) && { opacity: 0.5 }]}
              onPress={() => { if (newName.trim()) createProject() }}
              disabled={!newName.trim() || isPending}
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
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  orgName: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  addBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: Radius.sm,
  },
  addText: { color: Colors.primaryForeground, fontSize: FontSize.sm, fontWeight: '600' },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, overflow: 'hidden',
  },
  colorBar: { height: 4, width: '100%' },
  cardBody: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.md },
  projectIcon: {
    width: 44, height: 44, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  projectInitials: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  projectInfo: { flex: 1 },
  projectName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  projectDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  projectDate: { fontSize: FontSize.xs, color: Colors.textFaint, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: FontSize.lg, color: Colors.textMuted, marginBottom: 16 },
  emptyBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: Radius.sm,
  },
  emptyBtnText: { color: Colors.primaryForeground, fontWeight: '600' },
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
    fontSize: FontSize.md, color: Colors.text,
  },
  submitBtn: {
    height: 48, backgroundColor: Colors.primary, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg,
  },
  submitText: { color: Colors.primaryForeground, fontSize: FontSize.md, fontWeight: '600' },
})