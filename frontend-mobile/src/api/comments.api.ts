import client from './client'
import type { Comment } from '../types/task'

const base = (orgId: string, projectId: string, taskId: string) =>
  `/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/comments`

export const apiGetComments = (orgId: string, projectId: string, taskId: string) =>
  client.get<Comment[]>(base(orgId, projectId, taskId)).then((r) => r.data)

export const apiCreateComment = (orgId: string, projectId: string, taskId: string, content: string) =>
  client.post<Comment>(base(orgId, projectId, taskId), { content }).then((r) => r.data)

export const apiUpdateComment = (orgId: string, projectId: string, taskId: string, commentId: string, content: string) =>
  client.patch<Comment>(`${base(orgId, projectId, taskId)}/${commentId}`, { content }).then((r) => r.data)

export const apiDeleteComment = (orgId: string, projectId: string, taskId: string, commentId: string) =>
  client.delete(`${base(orgId, projectId, taskId)}/${commentId}`)