import { useState, useMemo } from 'react'
import { useParams } from 'react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Plus, Search, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'

import { apiGetTasks, apiCreateTask, apiUpdateTask } from '@/api/tasks.api'
import { apiGetProjectMembers } from '@/api/projects.api'
import { queryClient } from '@/api/client'
import { useOrgStore } from '@/store/org.store'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/Avatar'
import { DatePicker } from '@/components/ui/DatePicker'

import {
  COLUMNS, STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS,
  type Task, type TaskStatus, type TaskPriority,
} from '@/types/task'
import { TaskDetailModal } from './TaskDetailModal'
import { cn } from '@/lib/utils'

// ─── Цвета колонок ───────────────────────────────────────
const COLUMN_COLORS: Record<TaskStatus, string> = {
  backlog:     'border-gray-400',
  todo:        'border-blue-400',
  in_progress: 'border-yellow-400',
  review:      'border-violet-400',
  done:        'border-green-400',
}

// ─── Схема создания задачи ────────────────────────────────
const createSchema = z.object({
  title:       z.string().min(1, 'Введите название').max(200),
  description: z.string().max(2000).optional(),
  priority:    z.enum(['low', 'medium', 'high', 'critical']),
  assignee_id: z.string().optional(),
  due_date:    z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

// ─── Карточка задачи ─────────────────────────────────────
function TaskCard({
  task, index, onClick,
}: { task: Task; index: number; onClick: () => void }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            'bg-card border border-border rounded-lg p-3 cursor-pointer',
            'hover:border-primary/40 hover:shadow-sm transition-all',
            snapshot.isDragging && 'shadow-lg rotate-1 opacity-90',
          )}
        >
          {/* Приоритет + заголовок */}
          <div className="flex items-start gap-2 mb-2">
            <div className={cn('size-2 rounded-full shrink-0 mt-1.5', PRIORITY_COLORS[task.priority])} />
            <p className="text-sm font-medium leading-snug line-clamp-2">{task.title}</p>
          </div>

          {/* Футер */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              {task.priority !== 'medium' && (
                <span className="text-xs text-muted-foreground">{PRIORITY_LABELS[task.priority]}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.due_date && (
                <span className={cn('text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                  {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              )}
              {task.assignee && (
                <Avatar
                  src={`/api/users/avatar/${task.assignee.id}`}
                  name={task.assignee.display_name}
                  size="sm"
                  className="size-6 text-[10px]"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

// ─── Модал создания задачи ────────────────────────────────
function CreateTaskModal({
  orgId, projectId, defaultStatus, onClose,
}: { orgId: string; projectId: string; defaultStatus: TaskStatus; onClose: () => void }) {
  const { data: members = [] } = useQuery({
    queryKey: ['project-members', orgId, projectId],
    queryFn: () => apiGetProjectMembers(orgId, projectId),
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { priority: 'medium' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateForm) => apiCreateTask(orgId, projectId, {
      ...data,
      status: defaultStatus,
      assignee_id: data.assignee_id || undefined,
      due_date: data.due_date || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Новая задача — {STATUS_LABELS[defaultStatus]}</h2>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Название *</Label>
            <Input id="task-title" autoComplete="off" placeholder="Что нужно сделать?" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Описание</Label>
            <textarea
              id="task-desc"
              rows={3}
              placeholder="Подробное описание..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Приоритет</Label>
              <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20" {...register('priority')}>
                {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Дедлайн</Label>
              <DatePicker
                value={watch('due_date') || null}
                onChange={(v) => setValue('due_date', v ?? '')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Исполнитель</Label>
            <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20" {...register('assignee_id')}>
              <option value="">Не назначен</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.user.display_name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Создаю...' : 'Создать'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Главная страница ─────────────────────────────────────
export default function BoardPage() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>()
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const canManage = ['owner', 'admin', 'manager'].includes(currentOrg?.role ?? '')

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [createFor, setCreateFor] = useState<TaskStatus | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', orgId, projectId],
    queryFn: () => apiGetTasks(orgId!, projectId!),
    enabled: !!orgId && !!projectId,
  })

  const { mutate: updateTask } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      apiUpdateTask(orgId!, projectId!, id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }),
  })

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (priorityFilter && t.priority !== priorityFilter) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tasks, search, priorityFilter])

  const columns = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      backlog: [], todo: [], in_progress: [], review: [], done: [],
    }
    filteredTasks.forEach((t) => map[t.status].push(t))
    Object.values(map).forEach((col) => col.sort((a, b) => a.position - b.position))
    return map
  }, [filteredTasks])

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as TaskStatus
    if (newStatus !== source.droppableId) {
      updateTask({ id: draggableId, status: newStatus })
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          orgId={orgId!}
          projectId={projectId!}
          onClose={() => setSelectedTask(null)}
        />
      )}
      {createFor && (
        <CreateTaskModal
          orgId={orgId!}
          projectId={projectId!}
          defaultStatus={createFor}
          onClose={() => setCreateFor(null)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Фильтры */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск задач..."
              className="h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 w-48"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus-visible:border-ring"
          >
            <option value="">Все приоритеты</option>
            {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          {(search || priorityFilter) && (
            <button
              onClick={() => { setSearch(''); setPriorityFilter('') }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="size-3" /> Сбросить
            </button>
          )}
        </div>

        {/* Доска */}
        <div className="flex-1 overflow-x-auto">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 px-6 py-4 h-full min-h-0" style={{ minWidth: 'max-content' }}>
              {COLUMNS.map((status) => {
                const col = columns[status]
                return (
                  <div key={status} className="flex flex-col w-72 shrink-0">
                    {/* Заголовок колонки */}
                    <div className={cn('flex items-center justify-between mb-3 pb-2 border-b-2', COLUMN_COLORS[status])}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{STATUS_LABELS[status]}</span>
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                          {col.length}
                        </span>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => setCreateFor(status)}
                          className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Карточки */}
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            'flex-1 space-y-2 rounded-xl p-2 min-h-[200px] transition-colors',
                            snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-muted/30',
                          )}
                        >
                          {col.map((task, i) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              index={i}
                              onClick={() => setSelectedTask(task)}
                            />
                          ))}
                          {provided.placeholder}
                          {col.length === 0 && !snapshot.isDraggingOver && (
                            <p className="text-xs text-muted-foreground text-center py-4">Пусто</p>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        </div>
      </div>
    </>
  )
}