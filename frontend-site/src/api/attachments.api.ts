import client from './client'

export interface Attachment {
  id: string
  task_id: string
  filename: string
  mime_type: string
  file_size: number
  created_at: string
  uploader: { id: string; email: string; display_name: string } | null
}

const base = (orgId: string, projectId: string, taskId: string) =>
  `/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments`

export const apiGetAttachments = (orgId: string, projectId: string, taskId: string) =>
  client.get<Attachment[]>(`/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments`).then((r) => r.data)

export const apiUploadAttachment = (orgId: string, projectId: string, taskId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<Attachment>(base(orgId, projectId, taskId), form).then((r) => r.data)
}

export const apiDeleteAttachment = (orgId: string, projectId: string, taskId: string, attachmentId: string) =>
  client.delete(`${base(orgId, projectId, taskId)}/${attachmentId}`)

export function getAttachmentDownloadUrl(orgId: string, projectId: string, taskId: string, attachmentId: string) {
  return `/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}/download`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}