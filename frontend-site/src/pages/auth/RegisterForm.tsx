import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrength, validatePassword } from '@/components/ui/PasswordStrength'
import { apiRegister, apiLogin, apiMe } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'

const schema = z.object({
  display_name: z.string().min(2, 'Минимум 2 символа'),
  email: z.email('Некорректный email'),
  password: z.string()
    .min(8, 'Минимум 8 символов')
    .refine(validatePassword, 'Пароль не соответствует требованиям надёжности'),
})

type FormData = z.infer<typeof schema>

export default function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [autoLogin, setAutoLogin] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch('password', '')

  async function onSubmit(data: FormData) {
    try {
      await apiRegister(data.email, data.password, data.display_name)
      if (autoLogin) {
        await apiLogin(data.email, data.password)
        const user = await apiMe()
        setUser(user)
        navigate('/orgs')
      } else {
        onSwitch()
      }
    } catch {
      setError('root', { message: 'Ошибка регистрации. Возможно, email уже занят' })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Создать аккаунт</h2>
      <p className="text-sm text-muted-foreground mb-8">Заполните данные для регистрации</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reg-name">Имя</Label>
          <Input
            id="reg-name"
            placeholder="Иван Иванов"
            aria-invalid={!!errors.display_name}
            {...register('display_name')}
          />
          {errors.display_name && (
            <p className="text-xs text-destructive">{errors.display_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            placeholder="name@company.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Пароль</Label>
          <Input
            id="reg-password"
            type="password"
            placeholder="Минимум 8 символов"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <PasswordStrength password={password} />
          {errors.password && !password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="auto-login"
            type="checkbox"
            checked={autoLogin}
            onChange={(e) => setAutoLogin(e.target.checked)}
            className="size-4 rounded border-border accent-primary cursor-pointer"
          />
          <label htmlFor="auto-login" className="text-sm text-muted-foreground cursor-pointer select-none">
            Войти после регистрации
          </label>
        </div>

        {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Регистрирую...' : 'Зарегистрироваться'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        Уже есть аккаунт?{' '}
        <button onClick={onSwitch} className="text-primary hover:underline font-medium cursor-pointer">
          Войти
        </button>
      </p>
    </div>
  )
}