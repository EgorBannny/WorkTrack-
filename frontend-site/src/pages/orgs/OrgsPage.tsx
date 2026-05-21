import { useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, X, MoreHorizontal, Trash2, Camera, Settings } from 'lucide-react'
import { apiGetMyOrgs, apiCreateOrg, apiUploadOrgAvatar, apiDeleteOrg } from '@/api/orgs.api'
import { OrgSettingsModal } from './OrgSettingsModal'
import { DeleteOrgModal } from './DeleteOrgModal'
import { useOrgStore } from '@/store/org.store'
import { queryClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarCropper } from '@/components/ui/AvatarCropper'
import { ROLE_LABELS, type OrgWithRole } from '@/types/org'
import { cn } from '@/lib/utils'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

const createSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  description: z.string().max(500, 'Максимум 500 символов').optional(),
})
type CreateForm = z.infer<typeof createSchema>

export default function OrgsPage() {
  const navigate = useNavigate()
  const setCurrentOrg = useOrgStore((s) => s.setCurrentOrg)

  const [showCreate, setShowCreate] = useState(false)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [settingsOrg, setSettingsOrg] = useState<OrgWithRole | null>(null)
  const [orgToDelete, setOrgToDelete] = useState<OrgWithRole | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: apiGetMyOrgs,
  })

  const { mutate: createOrg, isPending } = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      apiCreateOrg(name, description || undefined),
    onSuccess: async (org) => {
      if (avatarBlob) {
        try { await apiUploadOrgAvatar(org.id, avatarBlob) } catch { /* не блокируем */ }
      }
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
      resetCreate()
      handleSelectOrg(org)
    },
  })

  const { mutate: confirmDelete, isPending: isDeleting } = useMutation<void, Error, string>({
    mutationFn: (orgId: string) => apiDeleteOrg(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
      setOrgToDelete(null)
      setMenuOpenId(null)
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  })

  function resetCreate() {
    setShowCreate(false)
    setAvatarBlob(null)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    setAvatarError(null)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    reset()
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)

    if (!ALLOWED.includes(file.type)) {
      setAvatarError('Только JPEG, PNG или WebP')
      e.target.value = ''
      return
    }
    if (file.size > MAX_SIZE) {
      setAvatarError('Файл больше 5MB')
      e.target.value = ''
      return
    }

    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  function handleCropConfirm(blob: Blob) {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarBlob(blob)
    setAvatarPreview(URL.createObjectURL(blob))
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function handleSelectOrg(org: OrgWithRole) {
    setCurrentOrg(org)
    navigate(`/orgs/${org.id}/projects`)
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
    {cropSrc && (
      <AvatarCropper
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null) }}
      />
    )}
    {settingsOrg && (
      <OrgSettingsModal
        org={settingsOrg}
        onClose={() => setSettingsOrg(null)}
      />
    )}
    {orgToDelete && (
      <DeleteOrgModal
        orgName={orgToDelete.name}
        isPending={isDeleting}
        onConfirm={() => confirmDelete(orgToDelete.id)}
        onCancel={() => setOrgToDelete(null)}
      />
    )}
    <div className="flex-1 flex flex-col items-center pt-16 px-4">
      <div className="w-full max-w-md">

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold mb-1">
            {orgs.length === 0 ? 'У вас нет организаций' : 'Выберите организацию'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {orgs.length === 0
              ? <>Создайте новую или примите приглашение —<br />
                  проверьте вкладку <span className="text-foreground font-medium">Приглашения</span> в меню</>
              : 'Войдите в существующую или создайте новую'
            }
          </p>
        </div>

        {/* Список */}
        <div className="flex flex-col gap-2">
          {orgs.map((org) => (
            <div key={org.id} className={cn('relative group', menuOpenId === org.id && 'z-10')}>
              <button
                onClick={() => handleSelectOrg(org)}
                disabled={!org.is_active}
                className={cn(
                  'flex items-center gap-4 w-full px-5 py-4 rounded-xl',
                  'border border-border bg-card text-left',
                  'hover:border-primary/40 hover:bg-primary/5 transition-colors',
                  !org.is_active && 'opacity-50 cursor-not-allowed',
                )}
              >
                <Avatar
                  src={`/api/orgs/${org.id}/avatar`}
                  name={org.name}
                  size="lg"
                  className="rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base truncate">{org.name}</p>
                  <p className="text-sm text-muted-foreground">{ROLE_LABELS[org.role]}</p>
                  {org.description && (
                    <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{org.description}</p>
                  )}
                </div>
              </button>

              {/* Три точки */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === org.id ? null : org.id) }}
                  className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MoreHorizontal className="size-4" />
                </button>

                {menuOpenId === org.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-0 top-9 z-20 w-48 bg-popover border border-border rounded-lg shadow-md py-1 overflow-hidden">
                      {org.role === 'owner' && (
                        <>
                          <button
                            onClick={() => { setSettingsOrg(org); setMenuOpenId(null) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                          >
                            <Settings className="size-3.5 shrink-0" />
                            Настройки
                          </button>
                          <div className="h-px bg-border mx-2 my-1" />
                          <button
                            onClick={() => { setOrgToDelete(org); setMenuOpenId(null) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="size-3.5 shrink-0" />
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Создать */}
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-4 w-full px-5 py-4 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
            >
              <div className="size-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Plus className="size-5" />
              </div>
              <span className="text-base font-medium">Создать организацию</span>
            </button>
          )}
        </div>

        {/* Форма создания */}
        {showCreate && (
          <div className="mt-2 border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Новая организация</p>
              <button
                onClick={resetCreate}
                className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => createOrg({ name: d.name, description: d.description }))} className="space-y-4">
              {/* Аватар */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative size-16 rounded-xl overflow-hidden bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center group"
                >
                  {avatarPreview
                    ? <img src={avatarPreview} className="size-full object-cover" alt="" />
                    : <Camera className="size-5 text-muted-foreground" />
                  }
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="size-4 text-white" />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              {avatarError && <p className="text-xs text-destructive text-center">{avatarError}</p>}

              {/* Название */}
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Название</Label>
                <Input
                  id="org-name"
                  placeholder="Название организации"
                  autoComplete="off"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* Описание */}
              <div className="space-y-1.5">
                <Label htmlFor="org-desc">Описание <span className="text-muted-foreground font-normal">(необязательно)</span></Label>
                <textarea
                  id="org-desc"
                  rows={2}
                  placeholder="Краткое описание..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={resetCreate}>
                  Отмена
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? 'Создаю...' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
    </>
  )
}