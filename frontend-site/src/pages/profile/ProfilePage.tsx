import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Camera } from 'lucide-react'
import { apiUpdateProfile, apiUploadUserAvatar, apiDeleteUserAvatar } from '@/api/profile.api'
import { apiLogin, apiMe } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
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
const emailSchema = z.object({
  email: z.email('Некорректный email'),
})
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Введите текущий пароль'),
  new_password: z.string()
    .min(8, 'Минимум 8 символов')
    .refine(validatePassword, 'Пароль не соответствует требованиям'),
})

type NameForm = z.infer<typeof nameSchema>
type EmailForm = z.infer<typeof emailSchema>
type PasswordForm = z.infer<typeof passwordSchema>

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pb-8 mb-8 border-b border-border last:border-0 last:mb-0 last:pb-0">
      <h2 className="text-base font-medium mb-4">{title}</h2>
      {children}
    </section>
  )
}

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
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: user?.email ?? '' },
  })
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })
  const watchedPassword = passwordForm.watch('new_password', '')

  const { mutate: saveName, isPending: isSavingName, isSuccess: nameSaved } = useMutation({
    mutationFn: (data: NameForm) => apiUpdateProfile({ display_name: data.display_name }),
    onSuccess: async () => { const u = await apiMe(); setUser(u) },
  })

  const { mutate: saveEmail, isPending: isSavingEmail, isSuccess: emailSaved } = useMutation({
    mutationFn: (data: EmailForm) => apiUpdateProfile({ email: data.email }),
    onSuccess: async () => { const u = await apiMe(); setUser(u) },
  })

  const { mutate: savePassword, isPending: isSavingPassword, isSuccess: passwordSaved } = useMutation({
    mutationFn: async (data: PasswordForm) => {
      try {
        await apiLogin(user!.email, data.current_password)
      } catch {
        throw new Error('Неверный текущий пароль')
      }
      await apiUpdateProfile({ password: data.new_password })
    },
    onSuccess: () => passwordForm.reset(),
    onError: (err: Error) => {
      passwordForm.setError('current_password', { message: err.message })
    },
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
      <Section title="Фото профиля">
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
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Изменить фото
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeletingAvatar}
              onClick={() => deleteAvatar()}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Удалить
            </Button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
        </div>
        {avatarError && <p className="text-xs text-destructive mt-2">{avatarError}</p>}
      </Section>

      {/* Имя */}
      <Section title="Имя">
        <form onSubmit={nameForm.handleSubmit((d) => saveName(d))} className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Отображаемое имя</Label>
            <Input id="display-name" autoComplete="name" aria-invalid={!!nameForm.formState.errors.display_name} {...nameForm.register('display_name')} />
            {nameForm.formState.errors.display_name && (
              <p className="text-xs text-destructive">{nameForm.formState.errors.display_name.message}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isSavingName}>{isSavingName ? 'Сохраняю...' : 'Сохранить'}</Button>
            {nameSaved && <p className="text-xs text-green-500">Сохранено</p>}
          </div>
        </form>
      </Section>

      {/* Email */}
      <Section title="Email">
        <form onSubmit={emailForm.handleSubmit((d) => saveEmail(d))} className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="email">Адрес электронной почты</Label>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!emailForm.formState.errors.email} {...emailForm.register('email')} />
            {emailForm.formState.errors.email && (
              <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isSavingEmail}>{isSavingEmail ? 'Сохраняю...' : 'Сохранить'}</Button>
            {emailSaved && <p className="text-xs text-green-500">Сохранено</p>}
          </div>
        </form>
      </Section>

      {/* Пароль */}
      <Section title="Смена пароля">
        <form onSubmit={passwordForm.handleSubmit((d) => savePassword(d))} className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Текущий пароль</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              placeholder="Введите текущий пароль"
              aria-invalid={!!passwordForm.formState.errors.current_password}
              {...passwordForm.register('current_password')}
            />
            {passwordForm.formState.errors.current_password && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.current_password.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Новый пароль</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Минимум 8 символов"
              {...passwordForm.register('new_password')}
            />
            <PasswordStrength password={watchedPassword} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isSavingPassword}>{isSavingPassword ? 'Сохраняю...' : 'Сменить пароль'}</Button>
            {passwordSaved && <p className="text-xs text-green-500">Пароль изменён</p>}
          </div>
        </form>
      </Section>
    </div>
  )
}