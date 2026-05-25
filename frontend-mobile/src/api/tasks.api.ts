import client from './client'
import type { Task, TaskStatus, TaskPriority, TaskHistoryEntry } from '../types/task'

const base = (orgId: string, projectId: string) =>
  `/api/orgs/${orgId}/projects/${projectId}/tasks`

export const apiGetTasks = (orgId: string, projectId: string) =>
  client.get<Task[]>(base(orgId, projectId)).then((r) => r.data)

export const apiCreateTask = (
  orgId: string,
  projectId: string,
  data: {
    title: string
    description?: string
    priority?: TaskPriority
    assignee_id?: string
    due_date?: string
    status?: TaskStatus
  },
) => client.post<Task>(base(orgId, projectId), data).then((r) => r.data)

export const apiUpdateTask = (
  orgId: string,
  projectId: string,
  taskId: string,
  data: Partial<{
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    assignee_id: string | null
    due_date: string | null
  }>,
) => client.patch<Task>(`${base(orgId, projectId)}/${taskId}`, data).then((r) => r.data)

export const apiDeleteTask = (orgId: string, projectId: string, taskId: string) =>
  client.delete(`${base(orgId, projectId)}/${taskId}`)

export const apiGetTaskHistory = (orgId: string, projectId: string, taskId: string) =>
  client.get<TaskHistoryEntry[]>(`${base(orgId, projectId)}/${taskId}/history`).then((r) => r.data)