import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Camera } from 'lucide-react'
import { apiUpdateProfile, apiUploadUserAvatar, apiDeleteUserAvatar } from '@/api/profile.api'
import { useAuthStore } from '@/store/auth.store'
import { apiMe } from '@/api/auth.api'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarCropper } from '@/components/ui/AvatarCropper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validatePassword } from '@/utils/password'
import { PasswordStrength } from '@/components/ui/PasswordStrength'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

const nameSchema = z.object({
  display_name: z.string().min(2, 'Минимум 2 символа').max(100),
})

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Минимум 8 символов')
    .refine(validatePassword, 'Пароль не соответствует требованиям'),
})

type NameForm = z.infer<typeof nameSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarKey, setAvatarKey] = useState(0)

  const nameForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { display_name: user?.display_name ?? '' },
  })

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })
  const watchedPassword = passwordForm.watch('password', '')

  const { mutate: saveName, isPending: isSavingName, isSuccess: nameSaved } = useMutation({
    mutationFn: (data: NameForm) => apiUpdateProfile({ display_name: data.display_name }),
    onSuccess: async () => {
      const updated = await apiMe()
      setUser(updated)
    },
  })

  const { mutate: savePassword, isPending: isSavingPassword, isSuccess: passwordSaved } = useMutation({
    mutationFn: (data: PasswordForm) => apiUpdateProfile({ password: data.password }),
    onSuccess: () => passwordForm.reset(),
  })

  const { mutate: deleteAvatar, isPending: isDeletingAvatar } = useMutation({
    mutationFn: apiDeleteUserAvatar,
    onSuccess: () => setAvatarKey((k) => k + 1),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    if (!ALLOWED.includes(file.type)) { setAvatarError('Только JPEG, PNG или WebP'); e.target.value = ''; return }
    if (file.size > MAX_SIZE) { setAvatarError('Файл больше 5MB'); e.target.value = ''; return }
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  async function handleCropConfirm(blob: Blob) {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    await apiUploadUserAvatar(blob)
    setAvatarKey((k) => k + 1)
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
    <div className="flex-1 p-8 max-w-xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-8">Профиль</h1>

      {/* Аватар */}
      <section className="mb-8 pb-8 border-b border-border">
        <h2 className="text-base font-medium mb-4">Фото профиля</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              key={avatarKey}
              src={user ? `/api/users/avatar/${user.id}` : null}
              name={user?.display_name}
              size="lg"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              <Camera className="size-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Изменить фото
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeletingAvatar}
              onClick={() => deleteAvatar()}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 block"
            >
              Удалить
            </Button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
        </div>
        {avatarError && <p className="text-xs text-destructive mt-2">{avatarError}</p>}
      </section>

      {/* Имя */}
      <section className="mb-8 pb-8 border-b border-border">
        <h2 className="text-base font-medium mb-4">Имя</h2>
        <form onSubmit={nameForm.handleSubmit((d) => saveName(d))} className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Отображаемое имя</Label>
            <Input
              id="display-name"
              autoComplete="name"
              aria-invalid={!!nameForm.formState.errors.display_name}
              {...nameForm.register('display_name')}
            />
            {nameForm.formState.errors.display_name && (
              <p className="text-xs text-destructive">{nameForm.formState.errors.display_name.message}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isSavingName}>
              {isSavingName ? 'Сохраняю...' : 'Сохранить'}
            </Button>
            {nameSaved && <p className="text-xs text-green-500">Сохранено</p>}
          </div>
        </form>
      </section>

      {/* Email (только просмотр) */}
      <section className="mb-8 pb-8 border-b border-border">
        <h2 className="text-base font-medium mb-4">Email</h2>
        <p className="text-sm text-muted-foreground mb-1">Адрес электронной почты</p>
        <p className="text-sm font-medium">{user?.email}</p>
      </section>

      {/* Пароль */}
      <section>
        <h2 className="text-base font-medium mb-4">Смена пароля</h2>
        <form onSubmit={passwordForm.handleSubmit((d) => savePassword(d))} className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Новый пароль</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Минимум 8 символов"
              aria-invalid={!!passwordForm.formState.errors.password}
              {...passwordForm.register('password')}
            />
            <PasswordStrength password={watchedPassword} />
            {passwordForm.formState.errors.password && !watchedPassword && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isSavingPassword}>
              {isSavingPassword ? 'Сохраняю...' : 'Сменить пароль'}
            </Button>
            {passwordSaved && <p className="text-xs text-green-500">Пароль изменён</p>}
          </div>
        </form>
      </section>
    </div>
  )
}