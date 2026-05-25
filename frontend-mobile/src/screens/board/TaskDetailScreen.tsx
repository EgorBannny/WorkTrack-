import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { apiGetTasks, apiUpdateTask, apiDeleteTask, apiGetTaskHistory } from '../../api/tasks.api'
import { apiGetComments, apiCreateComment, apiDeleteComment } from '../../api/comments.api'
import { apiGetProjectMembers } from '../../api/projects.api'
import { useAuthStore } from '../../store/auth.store'
import { useOrgStore } from '../../store/org.store'
import { Avatar } from '../../components/Avatar'
import { Spinner } from '../../components/Spinner'
import { Colors, Spacing, FontSize, Radius } from '../../theme'
import type { RootStackParamList } from '../../navigation/types'
import {
  STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS,
  type TaskStatus, type TaskPriority,
} from '../../types/task'

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  )
}
const sectionStyles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function TaskDetailScreen({ route, navigation }: Props) {
  const { orgId, projectId, taskId } = route.params
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const canManage = ['owner', 'admin', 'manager'].includes(currentOrg?.role ?? '')

  const [commentText, setCommentText] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', orgId, projectId],
    queryFn: () => apiGetTasks(orgId, projectId),
  })
  const task = tasks.find((t) => t.id === taskId)

  const { data: comments = [] } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => apiGetComments(orgId, projectId, taskId),
  })

  const { data: history = [] } = useQuery({
    queryKey: ['task-history', taskId],
    queryFn: () => apiGetTaskHistory(orgId, projectId, taskId),
    enabled: showHistory,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['project-members', orgId, projectId],
    queryFn: () => apiGetProjectMembers(orgId, projectId),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] })
    qc.invalidateQueries({ queryKey: ['task-comments', taskId] })
  }

  const { mutate: updateField } = useMutation({
    mutationFn: (data: Parameters<typeof apiUpdateTask>[3]) => apiUpdateTask(orgId, projectId, taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }),
  })

  const { mutate: deleteTask } = useMutation({
    mutationFn: () => apiDeleteTask(orgId, projectId, taskId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }); navigation.goBack() },
  })

  const { mutate: addComment, isPending: addingComment } = useMutation({
    mutationFn: () => apiCreateComment(orgId, projectId, taskId, commentText.trim()),
    onSuccess: () => { setCommentText(''); invalidate() },
  })

  const { mutate: removeComment } = useMutation({
    mutationFn: (id: string) => apiDeleteComment(orgId, projectId, taskId, id),
    onSuccess: invalidate,
  })

  function confirmDeleteTask() {
    Alert.alert('Удалить задачу?', task?.title, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteTask() },
    ])
  }

  function confirmDeleteComment(id: string) {
    Alert.alert('Удалить комментарий?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => removeComment(id) },
    ])
  }

  function showStatusPicker() {
    const statuses: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done']
    Alert.alert('Статус', undefined,
      statuses.map((s) => ({
        text: STATUS_LABELS[s] + (task?.status === s ? ' ✓' : ''),
        onPress: () => updateField({ status: s }),
      })).concat([{ text: 'Отмена', onPress: () => {} }]),
    )
  }

  function showPriorityPicker() {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical']
    Alert.alert('Приоритет', undefined,
      priorities.map((p) => ({
        text: PRIORITY_LABELS[p] + (task?.priority === p ? ' ✓' : ''),
        onPress: () => updateField({ priority: p }),
      })).concat([{ text: 'Отмена', onPress: () => {} }]),
    )
  }

  function showAssigneePicker() {
    Alert.alert('Исполнитель', undefined,
      [
        { text: 'Не назначен' + (!task?.assignee ? ' ✓' : ''), onPress: () => updateField({ assignee_id: null }) },
        ...members.map((m) => ({
          text: m.user.display_name + (task?.assignee?.id === m.user_id ? ' ✓' : ''),
          onPress: () => updateField({ assignee_id: m.user_id }),
        })),
        { text: 'Отмена', onPress: () => {} },
      ],
    )
  }

  if (!task) return <Spinner />

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Заголовок */}
        <Text style={styles.taskTitle}>{task.title}</Text>

        {/* Описание */}
        <Section title="Описание">
          <Text style={styles.description}>
            {task.description || <Text style={{ fontStyle: 'italic' }}>Нет описания</Text>}
          </Text>
        </Section>

        {/* Свойства */}
        <Section title="Свойства">
          <View style={styles.propGrid}>
            <TouchableOpacity style={styles.propItem} onPress={showStatusPicker}>
              <Text style={styles.propLabel}>Статус</Text>
              <Text style={styles.propValue}>{STATUS_LABELS[task.status]}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.propItem} onPress={showPriorityPicker}>
              <Text style={styles.propLabel}>Приоритет</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.dot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                <Text style={styles.propValue}>{PRIORITY_LABELS[task.priority]}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.propItem} onPress={showAssigneePicker}>
              <Text style={styles.propLabel}>Исполнитель</Text>
              {task.assignee
                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Avatar src={`/api/users/avatar/${task.assignee.id}`} name={task.assignee.display_name} size={20} />
                    <Text style={styles.propValue}>{task.assignee.display_name}</Text>
                  </View>
                : <Text style={[styles.propValue, { color: Colors.textFaint }]}>Не назначен</Text>
              }
            </TouchableOpacity>
            <View style={styles.propItem}>
              <Text style={styles.propLabel}>Дедлайн</Text>
              <Text style={[styles.propValue, isOverdue ? { color: Colors.destructive } : null]}>
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                  : <Text style={{ color: Colors.textFaint }}>Не указан</Text>
                }
              </Text>
            </View>
          </View>
        </Section>

        {/* Комментарии */}
        <Section title={`Комментарии (${comments.length})`}>
          {comments.map((c) => {
            const isOwn = c.author?.id === currentUser?.id
            return (
              <View key={c.id} style={styles.comment}>
                <Avatar src={c.author ? `/api/users/avatar/${c.author.id}` : null} name={c.author?.display_name} size={32} />
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{c.author?.display_name ?? '—'}</Text>
                    <Text style={styles.commentDate}>{formatDate(c.created_at)}</Text>
                    {(isOwn || canManage) && (
                      <TouchableOpacity onPress={() => confirmDeleteComment(c.id)} style={styles.commentDelete}>
                        <Text style={styles.commentDeleteText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.commentText}>{c.content}</Text>
                </View>
              </View>
            )
          })}

          {/* Новый комментарий */}
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentField}
              placeholder="Написать комментарий..."
              placeholderTextColor={Colors.textFaint}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!commentText.trim() || addingComment) && { opacity: 0.4 }]}
              onPress={() => { if (commentText.trim()) addComment() }}
              disabled={!commentText.trim() || addingComment}
            >
              {addingComment
                ? <ActivityIndicator color={Colors.primaryForeground} size="small" />
                : <Text style={styles.sendText}>→</Text>
              }
            </TouchableOpacity>
          </View>
        </Section>

        {/* История */}
        <Section title="История">
          <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
            <Text style={styles.historyToggle}>
              {showHistory ? '▲ Скрыть' : '▼ Показать историю изменений'}
            </Text>
          </TouchableOpacity>
          {showHistory && history.map((h) => (
            <View key={h.id} style={styles.historyItem}>
              <Text style={styles.historyText}>
                <Text style={styles.historyUser}>{h.user?.display_name ?? 'Система'}</Text>
                {' изменил '}
                <Text style={{ fontWeight: '500' }}>{h.field_changed}</Text>
              </Text>
              {(h.old_value || h.new_value) && (
                <Text style={styles.historyValues}>
                  {h.old_value && <Text style={{ textDecorationLine: 'line-through' }}>{h.old_value}</Text>}
                  {h.old_value && h.new_value ? ' → ' : ''}
                  {h.new_value}
                </Text>
              )}
              <Text style={styles.historyDate}>{formatDate(h.created_at)}</Text>
            </View>
          ))}
        </Section>

        {/* Удалить задачу */}
        {canManage && (
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteTask}>
            <Text style={styles.deleteBtnText}>Удалить задачу</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md },
  taskTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  description: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  propGrid: { gap: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden' },
  propItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  propLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  propValue: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '500' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  comment: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  commentDate: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
  commentDelete: { padding: 4 },
  commentDeleteText: { fontSize: 12, color: Colors.textFaint },
  commentText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  commentInput: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end', marginTop: Spacing.sm },
  commentField: {
    flex: 1, minHeight: 40, maxHeight: 120, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: FontSize.sm, color: Colors.text,
  },
  sendBtn: {
    width: 40, height: 40, backgroundColor: Colors.primary,
    borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center',
  },
  sendText: { color: Colors.primaryForeground, fontSize: 18 },
  historyToggle: { fontSize: FontSize.sm, color: Colors.primary, marginBottom: Spacing.sm },
  historyItem: {
    borderLeftWidth: 2, borderLeftColor: Colors.border,
    paddingLeft: Spacing.sm, marginBottom: Spacing.sm,
  },
  historyText: { fontSize: FontSize.xs, color: Colors.textMuted },
  historyUser: { fontWeight: '600', color: Colors.text },
  historyValues: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  historyDate: { fontSize: FontSize.xs, color: Colors.textFaint, marginTop: 2 },
  deleteBtn: {
    marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.destructive,
    borderRadius: Radius.sm, paddingVertical: 12, alignItems: 'center',
  },
  deleteBtnText: { color: Colors.destructive, fontSize: FontSize.sm, fontWeight: '600' },
})