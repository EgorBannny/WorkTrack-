import { useParams } from 'react-router'
import { useQueries } from '@tanstack/react-query'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import { useOrgStore } from '@/store/org.store'
import { apiGetOverview, apiGetMembersWorkload, apiGetTimeline, apiGetPriorities } from '@/api/analytics.api'
import { Avatar } from '@/components/ui/Avatar'

const STATUS_COLORS: Record<string, string> = {
  backlog:     '#6b7280',
  todo:        '#3b82f6',
  in_progress: '#f59e0b',
  review:      '#8b5cf6',
  done:        '#22c55e',
}

const STATUS_LABELS: Record<string, string> = {
  backlog:     'Бэклог',
  todo:        'К выполнению',
  in_progress: 'В работе',
  review:      'На проверке',
  done:        'Готово',
}

const PRIORITY_COLORS: Record<string, string> = {
  low:      '#6b7280',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
}

const PRIORITY_LABELS: Record<string, string> = {
  low:      'Низкий',
  medium:   'Средний',
  high:     'Высокий',
  critical: 'Критический',
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl p-5 bg-card">
      <h3 className="text-sm font-medium mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function AnalyticsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const myRole = currentOrg?.role ?? 'employee'
  const allowed = ['owner', 'admin', 'manager'].includes(myRole)

  const [overviewQ, workloadQ, timelineQ, prioritiesQ] = useQueries({
    queries: [
      { queryKey: ['analytics-overview', orgId], queryFn: () => apiGetOverview(orgId!), enabled: !!orgId && allowed },
      { queryKey: ['analytics-workload', orgId], queryFn: () => apiGetMembersWorkload(orgId!), enabled: !!orgId && allowed },
      { queryKey: ['analytics-timeline', orgId], queryFn: () => apiGetTimeline(orgId!), enabled: !!orgId && allowed },
      { queryKey: ['analytics-priorities', orgId], queryFn: () => apiGetPriorities(orgId!), enabled: !!orgId && allowed },
    ],
  })

  if (!allowed) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <p className="text-lg font-semibold mb-1">Нет доступа</p>
          <p className="text-sm text-muted-foreground">Аналитика доступна только для менеджеров и выше</p>
        </div>
      </div>
    )
  }

  const isLoading = overviewQ.isLoading || workloadQ.isLoading || timelineQ.isLoading || prioritiesQ.isLoading

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const overview = overviewQ.data
  const workload = workloadQ.data ?? []
  const timeline = timelineQ.data ?? []
  const priorities = prioritiesQ.data

  const statusPieData = overview
    ? Object.entries(STATUS_LABELS).map(([key, label]) => ({
        name: label,
        value: overview[key as keyof typeof overview] as number,
        color: STATUS_COLORS[key],
      })).filter((d) => d.value > 0)
    : []

  const priorityPieData = priorities
    ? Object.entries(PRIORITY_LABELS).map(([key, label]) => ({
        name: label,
        value: priorities[key as keyof typeof priorities],
        color: PRIORITY_COLORS[key],
      })).filter((d) => d.value > 0)
    : []

  const timelineData = timeline.map((t) => ({
    date: new Date(t.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    count: t.count,
  }))

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-8">Аналитика</h1>

      {/* Стат-карточки */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="border border-border rounded-xl p-4 bg-card col-span-2 sm:col-span-3 lg:col-span-1">
            <p className="text-xs text-muted-foreground mb-2">Всего задач</p>
            <p className="text-2xl font-bold">{overview.total}</p>
          </div>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <StatCard
              key={key}
              label={label}
              value={overview[key as keyof typeof overview] as number}
              color={STATUS_COLORS[key]}
            />
          ))}
        </div>
      )}

      {/* Графики — первый ряд */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {statusPieData.length > 0 && (
          <SectionCard title="Задачи по статусам">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                  {statusPieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} задач`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        {priorityPieData.length > 0 && (
          <SectionCard title="Задачи по приоритетам">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                  {priorityPieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} задач`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </SectionCard>
        )}
      </div>

      {/* Timeline */}
      {timelineData.length > 0 && (
        <div className="mb-4">
          <SectionCard title="Создание задач по дням">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip formatter={(v) => [`${v} задач`, 'Создано']} />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>
      )}

      {/* Нагрузка участников */}
      {workload.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Нагрузка участников">
            <ResponsiveContainer width="100%" height={Math.max(180, workload.length * 44)}>
              <BarChart data={workload.map((w) => ({ name: w.user.display_name, tasks: w.task_count }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip formatter={(v) => [`${v} задач`, '']} />
                <Bar dataKey="tasks" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Рейтинг по задачам">
            <div className="space-y-3">
              {workload.slice(0, 8).map((w, i) => (
                <div key={w.user.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <Avatar src={`/api/users/avatar/${w.user.id}`} name={w.user.display_name} size="sm" />
                  <span className="text-sm flex-1 truncate">{w.user.display_name}</span>
                  <span className="text-sm font-semibold shrink-0">{w.task_count}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Пусто */}
      {!isLoading && overview?.total === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">Нет данных — задачи ещё не созданы</p>
      )}
    </div>
  )
}