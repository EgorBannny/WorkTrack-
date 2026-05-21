export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface TaskUser {
  id: string
  email: string
  display_name: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  position: number
  due_date: string | null
  created_at: string
  updated_at: string
  creator: TaskUser | null
  assignee: TaskUser | null
}

export interface TaskHistoryEntry {
  id: string
  field_changed: string
  old_value: string | null
  new_value: string | null
  created_at: string
  user: TaskUser | null
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog:     'Бэклог',
  todo:        'К выполнению',
  in_progress: 'В работе',
  review:      'На проверке',
  done:        'Готово',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:      'Низкий',
  medium:   'Средний',
  high:     'Высокий',
  critical: 'Критический',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:      'bg-gray-400',
  medium:   'bg-yellow-400',
  high:     'bg-orange-500',
  critical: 'bg-red-500',
}

export const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done']