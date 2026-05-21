import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { X, Camera } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { apiUpdateOrg, apiUploadOrgAvatar, apiDeleteOrgAvatar } from '@/api/orgs.api'
import { queryClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarCropper } from '@/components/ui/AvatarCropper'
import type { OrgWithRole } from '@/types/org'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

const schema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  description: z.string().max(500, 'Максимум 500 символов').optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  org: OrgWithRole
  onClose: () => void
}

export function OrgSettingsModal({ org, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: org.name,
      description: org.description ?? '',
    },
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      await apiUpdateOrg(org.id, {
        name: data.name,
        description: data.description || null,
      })
      if (avatarBlob) {
        await apiUploadOrgAvatar(org.id, avatarBlob)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
      onClose()
    },
  })

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)

    if (!ALLOWED.includes(file.type)) { setAvatarError('Только JPEG, PNG или WebP'); e.target.value = ''; return }
    if (file.size > MAX_SIZE) { setAvatarError('Файл больше 5MB'); e.target.value = ''; return }

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

  async function handleDeleteAvatar() {
    try {
      await apiDeleteOrgAvatar(org.id)
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
      setAvatarBlob(null)
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
    } catch { /* нет аватара — ок */ }
  }

  if (cropSrc) {
    return (
      <AvatarCropper
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null) }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Настройки организации</h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => save(d))} className="px-6 py-5 space-y-5">
          {/* Аватар */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar
                src={avatarPreview ?? `/api/orgs/${org.id}/avatar`}
                name={org.name}
                size="lg"
                className="rounded-xl size-20"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
            <button
              type="button"
              onClick={handleDeleteAvatar}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Удалить фото
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Название */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-name">Название</Label>
            <Input
              id="settings-name"
              autoComplete="off"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Описание */}
          <div className="space-y-1.5">
            <Label htmlFor="settings-desc">Описание</Label>
            <textarea
              id="settings-desc"
              rows={3}
              placeholder="Краткое описание организации..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Сохраняю...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}