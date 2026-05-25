import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueries } from '@tanstack/react-query'
import { useOrgStore } from '../../store/org.store'
import {
  apiGetOverview, apiGetMembersWorkload, apiGetPriorities,
  type OverviewData, type MemberWorkload, type PrioritiesData,
} from '../../api/analytics.api'
import { Spinner } from '../../components/Spinner'
import { Colors, Spacing, FontSize, Radius } from '../../theme'

const STATUS_CONFIG = [
  { key: 'backlog',     label: 'Бэклог',       color: '#6b7280' },
  { key: 'todo',        label: 'К выполнению',  color: '#3b82f6' },
  { key: 'in_progress', label: 'В работе',      color: '#f59e0b' },
  { key: 'review',      label: 'На проверке',   color: '#8b5cf6' },
  { key: 'done',        label: 'Готово',         color: '#22c55e' },
]

const PRIORITY_CONFIG = [
  { key: 'critical', label: 'Критический', color: '#ef4444' },
  { key: 'high',     label: 'Высокий',     color: '#f97316' },
  { key: 'medium',   label: 'Средний',     color: '#f59e0b' },
  { key: 'low',      label: 'Низкий',      color: '#6b7280' },
]

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? value / max : 0
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={barStyles.value}>{value}</Text>
    </View>
  )
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { width: 110, fontSize: FontSize.sm, color: Colors.text },
  track: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  value: { width: 28, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
})

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.title}>{title}</Text>
      {children}
    </View>
  )
}
const cardStyles = StyleSheet.create({
  card: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, backgroundColor: Colors.card, marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
})

export default function AnalyticsScreen() {
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const orgId = currentOrg!.id
  const myRole = currentOrg!.role
  const allowed = ['owner', 'admin', 'manager'].includes(myRole)

  const [overviewQ, workloadQ, prioritiesQ] = useQueries({
    queries: [
      { queryKey: ['analytics-overview', orgId], queryFn: () => apiGetOverview(orgId), enabled: allowed },
      { queryKey: ['analytics-workload', orgId], queryFn: () => apiGetMembersWorkload(orgId), enabled: allowed },
      { queryKey: ['analytics-priorities', orgId], queryFn: () => apiGetPriorities(orgId), enabled: allowed },
    ],
  })

  if (!allowed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.noAccess}>
          <Text style={styles.noAccessTitle}>Нет доступа</Text>
          <Text style={styles.noAccessText}>Аналитика доступна только для менеджеров и выше</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (overviewQ.isLoading) return <Spinner />

  const overview = overviewQ.data
  const workload = workloadQ.data ?? []
  const priorities = prioritiesQ.data

  const maxWorkload = workload.length > 0 ? Math.max(...workload.map((w) => w.task_count)) : 1

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Аналитика</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Общая статистика */}
        {overview && (
          <Card title="Задачи по статусам">
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Всего задач</Text>
              <Text style={styles.totalValue}>{overview.total}</Text>
            </View>
            {STATUS_CONFIG.map(({ key, label, color }) => (
              <BarRow
                key={key}
                label={label}
                value={(overview as Record<string, number>)[key] ?? 0}
                max={overview.total || 1}
                color={color}
              />
            ))}
          </Card>
        )}

        {/* Приоритеты */}
        {priorities && (
          <Card title="Задачи по приоритетам">
            {PRIORITY_CONFIG.map(({ key, label, color }) => (
              <BarRow
                key={key}
                label={label}
                value={(priorities as Record<string, number>)[key] ?? 0}
                max={Math.max(...Object.values(priorities)) || 1}
                color={color}
              />
            ))}
          </Card>
        )}

        {/* Нагрузка участников */}
        {workload.length > 0 && (
          <Card title="Нагрузка участников">
            {workload.slice(0, 10).map((w, i) => (
              <View key={w.user.id} style={styles.workloadRow}>
                <Text style={styles.workloadRank}>{i + 1}</Text>
                <Text style={styles.workloadName} numberOfLines={1}>{w.user.display_name}</Text>
                <View style={styles.workloadBar}>
                  <View
                    style={[
                      styles.workloadFill,
                      { width: `${(w.task_count / maxWorkload) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.workloadCount}>{w.task_count}</Text>
              </View>
            ))}
          </Card>
        )}

        {overview?.total === 0 && (
          <Text style={styles.emptyText}>Нет данных — задачи ещё не созданы</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.md },
  noAccess: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  noAccessTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  noAccessText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  totalLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  totalValue: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  workloadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  workloadRank: { width: 20, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  workloadName: { width: 100, fontSize: FontSize.sm, color: Colors.text },
  workloadBar: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  workloadFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  workloadCount: { width: 28, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  emptyText: { textAlign: 'center', color: Colors.textMuted, paddingVertical: 40 },
})