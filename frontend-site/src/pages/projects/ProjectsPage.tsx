import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, MoreHorizontal, FolderOpen, Settings, Trash2, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { apiGetProjects, apiCreateProject, apiUpdateProject, apiDeleteProject } from '@/api/projects.api'
import { queryClient } from '@/api/client'
import { useOrgStore } from '@/store/org.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/project'

const ROLE_CAN_MANAGE = ['owner', 'admin', 'manager']

function getProjectColor(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-violet-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Схемы ───────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100),
  description: z.string().max(500).optional(),
})
const editSchema = createSchema
type CreateForm = z.infer<typeof createSchema>

// ─── Компонент редактирования ─────────────────────────────
function EditProjectModal({ project, orgId, onClose }: { project: Project; orgId: string; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: project.name, description: project.description ?? '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateForm) =>
      apiUpdateProject(orgId, project.id, { name: data.name, description: data.description || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects', orgId] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Настройки проекта</h2>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Название</Label>
            <Input id="edit-name" autoComplete="off" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Описание <span className="text-muted-foreground font-normal">(необязательно)</span></Label>
            <textarea
              id="edit-desc"
              rows={3}
              placeholder="Краткое описание проекта..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
              {...register('description')}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Сохраняю...' : 'Сохранить'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Карточка проекта ─────────────────────────────────────
function ProjectCard({
  project, canManage, onEdit, onDelete, onClick,
}: {
  project: Project
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
  onClick: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const color = getProjectColor(project.name)

  return (
    <div className={cn('relative group rounded-xl border border-border bg-card', !project.is_active && 'opacity-50')}>
      {/* Цветная шапка */}
      <div className={cn('h-2 w-full rounded-t-xl', color)} />

      <div
        className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onClick}
      >
        {/* Иконка + название */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn('size-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0', color)}>
            {getInitials(project.name)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-semibold text-sm leading-tight truncate">{project.name}</p>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>

        {/* Футер */}
        <div className="flex items-center justify-between mt-4">
          {project.creator && (
            <div className="flex items-center gap-1.5">
              <Avatar
                src={`/api/users/avatar/${project.creator.id}`}
                name={project.creator.display_name}
                size="sm"
              />
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {project.creator.display_name}
              </span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">{formatDate(project.created_at)}</span>
        </div>
      </div>

      {/* Три точки */}
      {canManage && (
        <div className="absolute top-4 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <MoreHorizontal className="size-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 bg-popover border border-border rounded-lg shadow-md py-1">
                <button
                  onClick={() => { setMenuOpen(false); onEdit() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Settings className="size-3.5 shrink-0" />
                  Настройки
                </button>
                <div className="h-px bg-border mx-2 my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="size-3.5 shrink-0" />
                  Удалить
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Главная страница ─────────────────────────────────────
export default function ProjectsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const canManage = currentOrg ? ROLE_CAN_MANAGE.includes(currentOrg.role) : false

  const [showCreate, setShowCreate] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', orgId],
    queryFn: () => apiGetProjects(orgId!),
    enabled: !!orgId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  })

  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateForm) => apiCreateProject(orgId!, data.name, data.description),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects', orgId] }); reset(); setShowCreate(false) },
  })

  const { mutate: deleteProjectMutate, isPending: isDeleting } = useMutation({
    mutationFn: (projectId: string) => apiDeleteProject(orgId!, projectId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects', orgId] }); setDeleteProject(null) },
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      {editProject && (
        <EditProjectModal project={editProject} orgId={orgId!} onClose={() => setEditProject(null)} />
      )}

      {deleteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteProject(null)} />
          <div className="relative w-full max-w-sm bg-background rounded-2xl border border-border shadow-lg p-6">
            <h3 className="font-semibold mb-2">Удалить проект?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Проект <span className="font-medium text-foreground">«{deleteProject.name}»</span> будет архивирован.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDeleteProject(null)}>Отмена</Button>
              <Button
                disabled={isDeleting}
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => deleteProjectMutate(deleteProject.id)}
              >
                {isDeleting ? 'Удаляю...' : 'Удалить'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-8">
        {/* Шапка страницы */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Проекты</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {projects.length === 0 ? 'Нет проектов' : `${projects.length} ${projects.length === 1 ? 'проект' : projects.length < 5 ? 'проекта' : 'проектов'}`}
            </p>
          </div>
          {canManage && !showCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="size-4" />
              Новый проект
            </Button>
          )}
        </div>

        {/* Форма создания */}
        {showCreate && (
          <div className="mb-6 border border-border rounded-xl p-5 bg-card">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">Новый проект</p>
              <button
                onClick={() => { setShowCreate(false); reset() }}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit((d) => createProject(d))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-name">Название</Label>
                  <Input id="proj-name" placeholder="Название проекта" autoComplete="off" aria-invalid={!!errors.name} {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-desc">Описание <span className="text-muted-foreground font-normal">(необязательно)</span></Label>
                  <Input id="proj-desc" placeholder="Краткое описание" autoComplete="off" {...register('description')} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); reset() }}>Отмена</Button>
                <Button type="submit" disabled={isCreating}>{isCreating ? 'Создаю...' : 'Создать'}</Button>
              </div>
            </form>
          </div>
        )}

        {/* Пустое состояние */}
        {projects.length === 0 && !showCreate && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Нет проектов</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {canManage ? 'Создайте первый проект чтобы начать' : 'В этой организации пока нет проектов'}
            </p>
            {canManage && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="size-4" />
                Создать проект
              </Button>
            )}
          </div>
        )}

        {/* Сетка */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.filter((p) => p.is_active).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                canManage={canManage}
                onEdit={() => setEditProject(project)}
                onDelete={() => setDeleteProject(project)}
                onClick={() => navigate(`/orgs/${orgId}/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}