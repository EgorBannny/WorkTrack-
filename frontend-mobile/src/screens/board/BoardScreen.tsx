import { useState, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { apiGetTasks, apiCreateTask, apiUpdateTask } from '../../api/tasks.api'
import { apiGetProjectMembers } from '../../api/projects.api'
import { useOrgStore } from '../../store/org.store'
import { Spinner } from '../../components/Spinner'
import { Avatar } from '../../components/Avatar'
import { Colors, Spacing, FontSize, Radius } from '../../theme'
import type { RootStackParamList } from '../../navigation/types'
import {
  COLUMNS, STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS,
  type Task, type TaskStatus, type TaskPriority,
} from '../../types/task'

type Props = NativeStackScreenProps<RootStackParamList, 'Board'>
type Nav = NativeStackNavigationProp<RootStackParamList>

const STATUS_TAB_COLORS: Record<TaskStatus, string> = {
  backlog: '#6b7280',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  done: '#22c55e',
}

// ─── Карточка задачи ─────────────────────────────────────
function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
        <Text style={styles.cardTitle} numberOfLines={2}>{task.title}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.priorityLabel}>{PRIORITY_LABELS[task.priority]}</Text>
        <View style={styles.cardRight}>
          {task.due_date && (
            <Text style={[styles.dueDate, isOverdue && { color: Colors.destructive }]}>
              {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </Text>
          )}
          {task.assignee && (
            <Avatar src={`/api/users/avatar/${task.assignee.id}`} name={task.assignee.display_name} size={22} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── Модал создания ───────────────────────────────────────
function CreateTaskModal({
  orgId, projectId, defaultStatus, onClose,
}: { orgId: string; projectId: string; defaultStatus: TaskStatus; onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assigneeId, setAssigneeId] = useState('')

  const { data: members = [] } = useQuery({
    queryKey: ['project-members', orgId, projectId],
    queryFn: () => apiGetProjectMembers(orgId, projectId),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => apiCreateTask(orgId, projectId, {
      title: title.trim(), priority,
      assignee_id: assigneeId || undefined,
      status: defaultStatus,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] })
      onClose()
    },
    onError: () => Alert.alert('Ошибка', 'Не удалось создать задачу'),
  })

  const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical']

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Новая задача — {STATUS_LABELS[defaultStatus]}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Название *</Text>
          <TextInput
            style={styles.input}
            placeholder="Что нужно сделать?"
            placeholderTextColor={Colors.textFaint}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Приоритет</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            <View style={styles.pills}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.pill, priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.pillText, priority === p && { color: '#fff' }]}>
                    {PRIORITY_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {members.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>Исполнитель</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={styles.pills}>
                  <TouchableOpacity
                    style={[styles.pill, !assigneeId && styles.pillActive]}
                    onPress={() => setAssigneeId('')}
                  >
                    <Text style={[styles.pillText, !assigneeId && styles.pillActiveText]}>Не назначен</Text>
                  </TouchableOpacity>
                  {members.map((m) => (
                    <TouchableOpacity
                      key={m.user_id}
                      style={[styles.pill, assigneeId === m.user_id && styles.pillActive]}
                      onPress={() => setAssigneeId(m.user_id)}
                    >
                      <Text style={[styles.pillText, assigneeId === m.user_id && styles.pillActiveText]}>
                        {m.user.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (!title.trim() || isPending) && { opacity: 0.5 }]}
            onPress={() => { if (title.trim()) mutate() }}
            disabled={!title.trim() || isPending}
          >
            {isPending
              ? <ActivityIndicator color={Colors.primaryForeground} />
              : <Text style={styles.submitText}>Создать задачу</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

// ─── Главный экран ────────────────────────────────────────
export default function BoardScreen({ route }: Props) {
  const navigation = useNavigation<Nav>()
  const { orgId, projectId } = route.params
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const canManage = ['owner', 'admin', 'manager'].includes(currentOrg?.role ?? '')
  const qc = useQueryClient()

  const [activeStatus, setActiveStatus] = useState<TaskStatus>('todo')
  const [search, setSearch] = useState('')
  const [createFor, setCreateFor] = useState<TaskStatus | null>(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', orgId, projectId],
    queryFn: () => apiGetTasks(orgId, projectId),
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      apiUpdateTask(orgId, projectId, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }),
  })

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status !== activeStatus) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tasks, activeStatus, search])

  const counts = useMemo(() => {
    const m: Record<TaskStatus, number> = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 }
    tasks.forEach((t) => m[t.status]++)
    return m
  }, [tasks])

  if (isLoading) return <Spinner />

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Поиск */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск задач..."
          placeholderTextColor={Colors.textFaint}
          value={search}
          onChangeText={setSearch}
        />
        {canManage && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setCreateFor(activeStatus)}
          >
            <Text style={styles.addText}>＋</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Вкладки статусов */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsRow}
        contentContainerStyle={styles.tabsContent}
      >
        {COLUMNS.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.tab,
              activeStatus === status && {
                borderBottomColor: STATUS_TAB_COLORS[status],
                borderBottomWidth: 2.5,
              },
            ]}
            onPress={() => setActiveStatus(status)}
          >
            <Text
              style={[
                styles.tabText,
                activeStatus === status
                  ? { color: STATUS_TAB_COLORS[status], fontWeight: '600' }
                  : { color: Colors.textMuted },
              ]}
            >
              {STATUS_LABELS[status]}
            </Text>
            <View style={[styles.tabBadge, { backgroundColor: STATUS_TAB_COLORS[status] + '22' }]}>
              <Text style={[styles.tabBadgeText, { color: STATUS_TAB_COLORS[status] }]}>
                {counts[status]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Список задач */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.taskList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Нет задач</Text>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => navigation.navigate('TaskDetail', { orgId, projectId, taskId: item.id })}
          />
        )}
      />

      {/* Модал изменения статуса (долгое нажатие) */}
      {createFor && (
        <CreateTaskModal
          orgId={orgId}
          projectId={projectId}
          defaultStatus={createFor}
          onClose={() => setCreateFor(null)}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  searchRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchInput: {
    flex: 1, height: 40, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: 12,
    fontSize: FontSize.sm, color: Colors.text,
  },
  addBtn: {
    width: 40, height: 40, backgroundColor: Colors.primary,
    borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center',
  },
  addText: { color: Colors.primaryForeground, fontSize: 22, lineHeight: 28 },
  tabsRow: { borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 48 },
  tabsContent: { paddingHorizontal: Spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.sm, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: FontSize.sm },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.full },
  tabBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  taskList: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: Spacing.sm },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  cardTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '500', color: Colors.text },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priorityLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dueDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyText: { textAlign: 'center', color: Colors.textMuted, paddingVertical: 40 },
  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, flex: 1 },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  modalBody: { padding: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.md, color: Colors.text, marginBottom: Spacing.md,
  },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: FontSize.sm, color: Colors.text },
  pillActiveText: { color: '#fff' },
  submitBtn: {
    height: 48, backgroundColor: Colors.primary, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg,
  },
  submitText: { color: Colors.primaryForeground, fontSize: FontSize.md, fontWeight: '600' },
})