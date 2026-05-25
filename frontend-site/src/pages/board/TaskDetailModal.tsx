import { useRef, useState } from 'react'
import { DatePicker } from '@/components/ui/DatePicker'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  X, Pencil, Trash2, Paperclip, Download, ChevronDown, ChevronUp, Send,
  FileText, FileImage, FileSpreadsheet, File, Eye,
} from 'lucide-react'

import { apiUpdateTask, apiDeleteTask, apiGetTaskHistory } from '@/api/tasks.api'
import { apiGetComments, apiCreateComment, apiUpdateComment, apiDeleteComment } from '@/api/comments.api'
import { apiGetAttachments, apiUploadAttachment, apiDeleteAttachment, getAttachmentDownloadUrl, formatFileSize, type Attachment } from '@/api/attachments.api'
import { apiGetProjectMembers } from '@/api/projects.api'
import { queryClient } from '@/api/client'
import client from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { useOrgStore } from '@/store/org.store'

import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/button'
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS, type Task, type TaskStatus, type TaskPriority } from '@/types/task'
import { cn } from '@/lib/utils'

const FIELD_LABELS: Record<string, string> = {
  title: 'Название', description: 'Описание', status: 'Статус',
  priority: 'Приоритет', assignee_id: 'Исполнитель', due_date: 'Дедлайн',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  task: Task
  orgId: string
  projectId: string
  onClose: () => void
}

export function TaskDetailModal({ task, orgId, projectId, onClose }: Props) {
  const currentUser = useAuthStore((s) => s.user)
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const canManage = ['owner', 'admin', 'manager'].includes(currentOrg?.role ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(task.title)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descVal, setDescVal] = useState(task.description ?? '')
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', orgId, projectId] })
    queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] })
    queryClient.invalidateQueries({ queryKey: ['task-history', task.id] })
    queryClient.invalidateQueries({ queryKey: ['task-attachments', task.id] })
  }

  // Data
  const { data: comments = [] } = useQuery({ queryKey: ['task-comments', task.id], queryFn: () => apiGetComments(orgId, projectId, task.id) })
  const { data: history = [] } = useQuery({ queryKey: ['task-history', task.id], queryFn: () => apiGetTaskHistory(orgId, projectId, task.id), enabled: showHistory })
  const { data: members = [] } = useQuery({ queryKey: ['project-members', orgId, projectId], queryFn: () => apiGetProjectMembers(orgId, projectId) })

  // Mutations
  const { mutate: updateField } = useMutation({
    mutationFn: (data: Parameters<typeof apiUpdateTask>[3]) => apiUpdateTask(orgId, projectId, task.id, data),
    onSuccess: invalidate,
  })
  const { mutate: deleteTask } = useMutation({
    mutationFn: () => apiDeleteTask(orgId, projectId, task.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }); onClose() },
  })
  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: () => apiCreateComment(orgId, projectId, task.id, commentText),
    onSuccess: () => { setCommentText(''); invalidate() },
  })
  const { mutate: saveComment } = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => apiUpdateComment(orgId, projectId, task.id, id, content),
    onSuccess: () => { setEditingCommentId(null); invalidate() },
  })
  const { mutate: deleteComment } = useMutation({
    mutationFn: (id: string) => apiDeleteComment(orgId, projectId, task.id, id),
    onSuccess: invalidate,
  })
  const { mutate: uploadFile } = useMutation({
    mutationFn: (file: File) => apiUploadAttachment(orgId, projectId, task.id, file),
    onSuccess: invalidate,
  })
  const { mutate: deleteFile } = useMutation({
    mutationFn: (attachmentId: string) => apiDeleteAttachment(orgId, projectId, task.id, attachmentId),
    onSuccess: invalidate,
  })

  const { data: attachments = [] } = useQuery({
    queryKey: ['task-attachments', task.id],
    queryFn: () => apiGetAttachments(orgId, projectId, task.id),
  })

  function getFileIcon(mime: string) {
    if (mime.startsWith('image/')) return FileImage
    if (mime === 'application/pdf') return FileText
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return FileSpreadsheet
    if (mime.includes('word') || mime.includes('document') || mime === 'text/plain') return FileText
    return File
  }

  async function openInBrowser(a: Attachment) {
    const url = getAttachmentDownloadUrl(orgId, projectId, task.id, a.id)
    const res = await client.get(url, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: a.mime_type })
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
  }

  async function downloadFile(a: Attachment) {
    const url = getAttachmentDownloadUrl(orgId, projectId, task.id, a.id)
    const res = await client.get(url, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = a.filename
    link.click()
    URL.revokeObjectURL(blobUrl)
  }


  function saveTitleIfChanged() {
    if (titleVal.trim() && titleVal !== task.title) updateField({ title: titleVal.trim() })
    setEditingTitle(false)
  }

  function saveDescIfChanged() {
    const newDesc = descVal.trim() || null
    if (newDesc !== task.description) updateField({ description: newDesc })
    setEditingDesc(false)
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-2xl border border-border shadow-xl flex flex-col overflow-hidden">
        {/* Шапка */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                autoFocus
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onBlur={saveTitleIfChanged}
                onKeyDown={(e) => e.key === 'Enter' && saveTitleIfChanged()}
                className="w-full text-lg font-semibold bg-transparent border-b border-primary outline-none"
              />
            ) : (
              <h2
                className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={() => setEditingTitle(true)}
                title="Нажмите чтобы редактировать"
              >
                {task.title}
              </h2>
            )}
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
            <X className="size-4" />
          </button>
        </div>

        {/* Тело */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">

            {/* Левая колонка — описание + комментарии */}
            <div className="lg:col-span-2 px-6 py-5 space-y-6">

              {/* Описание */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Описание</p>
                {editingDesc ? (
                  <textarea
                    autoFocus
                    value={descVal}
                    onChange={(e) => setDescVal(e.target.value)}
                    onBlur={saveDescIfChanged}
                    rows={4}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                  />
                ) : (
                  <div
                    className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 min-h-[60px]"
                    onClick={() => setEditingDesc(true)}
                  >
                    {task.description
                      ? <p className="whitespace-pre-wrap text-foreground">{task.description}</p>
                      : <p className="italic">Нажмите чтобы добавить описание...</p>
                    }
                  </div>
                )}
              </div>

              {/* Вложения */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Вложения {attachments.length > 0 && `(${attachments.length})`}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Paperclip className="size-3" /> Прикрепить
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
                </div>

                {attachments.length === 0
                  ? <p className="text-xs text-muted-foreground italic">Нет вложений</p>
                  : (
                    <div className="space-y-2">
                      {attachments.map((a) => {
                        const Icon = getFileIcon(a.mime_type)
                        const isImage = a.mime_type.startsWith('image/')
                        const isPdf = a.mime_type === 'application/pdf'
                        const canPreview = isImage || isPdf

                        return (
                          <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/30 group/att">
                            <Icon className="size-5 text-muted-foreground shrink-0" />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{a.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(a.file_size)}
                                {a.uploader && ` · ${a.uploader.display_name}`}
                              </p>
                            </div>

                            {/* Действия */}
                            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover/att:opacity-100 transition-opacity">
                              {canPreview && (
                                <button
                                  onClick={() => openInBrowser(a)}
                                  title="Открыть"
                                  className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                  <Eye className="size-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => downloadFile(a)}
                                title="Скачать"
                                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <Download className="size-3.5" />
                              </button>
                              {(a.uploader?.id === currentUser?.id || canManage) && (
                                <button
                                  onClick={() => deleteFile(a.id)}
                                  title="Удалить"
                                  className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }
              </div>

              {/* Комментарии */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Комментарии ({comments.length})
                </p>
                <div className="space-y-4 mb-4">
                  {comments.map((c) => {
                    const isOwn = c.author?.id === currentUser?.id
                    const isEditing = editingCommentId === c.id
                    return (
                      <div key={c.id} className="flex gap-3">
                        <Avatar src={c.author ? `/api/users/avatar/${c.author.id}` : null} name={c.author?.display_name} size="sm" className="shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{c.author?.display_name ?? 'Неизвестно'}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                          </div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                autoFocus
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveComment({ id: c.id, content: editingCommentText })}>Сохранить</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>Отмена</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="group/comment relative">
                              <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
                              {(isOwn || canManage) && (
                                <div className="absolute top-0 right-0 sm:opacity-0 sm:group-hover/comment:opacity-100 flex gap-1">
                                  {isOwn && (
                                    <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.content) }} className="size-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                      <Pencil className="size-3" />
                                    </button>
                                  )}
                                  <button onClick={() => deleteComment(c.id)} className="size-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors">
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Новый комментарий */}
                <div className="flex gap-3">
                  <Avatar src={currentUser ? `/api/users/avatar/${currentUser.id}` : null} name={currentUser?.display_name} size="sm" className="shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Написать комментарий..."
                      rows={2}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                      onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey && commentText.trim()) addComment() }}
                    />
                    {commentText.trim() && (
                      <Button size="sm" disabled={isAddingComment} onClick={() => addComment()}>
                        <Send className="size-3.5" /> Отправить
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка — свойства */}
            <div className="px-6 py-5 border-t lg:border-t-0 lg:border-l border-border space-y-4">

              {/* Статус */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Статус</p>
                <select
                  value={task.status}
                  onChange={(e) => updateField({ status: e.target.value as TaskStatus })}
                  className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring"
                >
                  {(['backlog', 'todo', 'in_progress', 'review', 'done'] as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {/* Приоритет */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Приоритет</p>
                <select
                  value={task.priority}
                  onChange={(e) => updateField({ priority: e.target.value as TaskPriority })}
                  className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring"
                >
                  {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className={cn('size-2 rounded-full', PRIORITY_COLORS[task.priority])} />
                  <span className="text-xs text-muted-foreground">{PRIORITY_LABELS[task.priority]}</span>
                </div>
              </div>

              {/* Исполнитель */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Исполнитель</p>
                <select
                  value={task.assignee?.id ?? ''}
                  onChange={(e) => updateField({ assignee_id: e.target.value || null })}
                  className="w-full h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring"
                >
                  <option value="">Не назначен</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.user.display_name}</option>
                  ))}
                </select>
                {task.assignee && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Avatar src={`/api/users/avatar/${task.assignee.id}`} name={task.assignee.display_name} size="sm" className="size-5 text-[10px]" />
                    <span className="text-xs text-muted-foreground">{task.assignee.display_name}</span>
                  </div>
                )}
              </div>

              {/* Дедлайн */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Дедлайн</p>
                <DatePicker
                  value={task.due_date}
                  onChange={(v) => updateField({ due_date: v })}
                  className={isOverdue ? '[&>button]:text-destructive [&>button]:border-destructive/50' : ''}
                />
              </div>

              {/* Создатель */}
              {task.creator && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Создал</p>
                  <div className="flex items-center gap-2">
                    <Avatar src={`/api/users/avatar/${task.creator.id}`} name={task.creator.display_name} size="sm" className="size-5 text-[10px]" />
                    <span className="text-xs">{task.creator.display_name}</span>
                  </div>
                </div>
              )}

              {/* Дата создания */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Создана</p>
                <p className="text-xs">{formatDate(task.created_at)}</p>
              </div>

              {/* История */}
              <div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showHistory ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  История изменений
                </button>
                {showHistory && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {history.length === 0
                      ? <p className="text-xs text-muted-foreground italic">Нет изменений</p>
                      : history.map((h) => (
                        <div key={h.id} className="text-xs border-l-2 border-border pl-2">
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">{h.user?.display_name ?? 'Система'}</span>
                            {' '}изменил{' '}
                            <span className="font-medium">{FIELD_LABELS[h.field_changed] ?? h.field_changed}</span>
                          </p>
                          {(h.old_value || h.new_value) && (
                            <p className="text-muted-foreground/70">
                              {h.old_value && <span className="line-through">{h.old_value}</span>}
                              {h.old_value && h.new_value && ' → '}
                              {h.new_value && <span>{h.new_value}</span>}
                            </p>
                          )}
                          <p className="text-muted-foreground/60">{formatDate(h.created_at)}</p>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Удалить задачу */}
              {canManage && (
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => { if (confirm('Удалить задачу?')) deleteTask() }}
                  >
                    <Trash2 className="size-3.5" />
                    Удалить задачу
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}