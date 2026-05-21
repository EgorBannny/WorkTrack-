import client from './client'
import type { Task, TaskStatus, TaskPriority, TaskHistoryEntry } from '@/types/task'

const base = (orgId: string, projectId: string) =>
  `/api/orgs/${orgId}/projects/${projectId}/tasks`

export async function apiGetTasks(
  orgId: string,
  projectId: string,
  params?: { status_filter?: TaskStatus; priority?: TaskPriority; assignee_id?: string; search?: string },
): Promise<Task[]> {
  const res = await client.get<Task[]>(base(orgId, projectId), { params })
  return res.data
}

export async function apiCreateTask(
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
): Promise<Task> {
  const res = await client.post<Task>(base(orgId, projectId), data)
  return res.data
}

export async function apiUpdateTask(
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
): Promise<Task> {
  const res = await client.patch<Task>(`${base(orgId, projectId)}/${taskId}`, data)
  return res.data
}

export async function apiUpdateTaskPosition(
  orgId: string,
  projectId: string,
  taskId: string,
  position: number,
): Promise<Task> {
  const res = await client.patch<Task>(`${base(orgId, projectId)}/${taskId}/position`, { position })
  return res.data
}

export async function apiDeleteTask(orgId: string, projectId: string, taskId: string): Promise<void> {
  await client.delete(`${base(orgId, projectId)}/${taskId}`)
}

export async function apiGetTaskHistory(
  orgId: string,
  projectId: string,
  taskId: string,
): Promise<TaskHistoryEntry[]> {
  const res = await client.get<TaskHistoryEntry[]>(`${base(orgId, projectId)}/${taskId}/history`)
  return res.data
}