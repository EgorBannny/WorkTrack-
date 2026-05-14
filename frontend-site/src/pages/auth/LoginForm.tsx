import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiLogin, apiMe } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'

const schema = z.object({
  email: z.email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type FormData = z.infer<typeof schema>

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    try {
      await apiLogin(data.email, data.password)
      const user = await apiMe()
      setUser(user)
      navigate('/orgs')
    } catch {
      setError('root', { message: 'Неверный email или пароль' })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-1">Войти в аккаунт</h2>
      <p className="text-sm text-muted-foreground mb-8">Введите данные для входа</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="name@company.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password">Пароль</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Вхожу...' : 'Войти'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        Нет аккаунта?{' '}
        <button onClick={onSwitch} className="text-primary hover:underline font-medium cursor-pointer">
          Зарегистрироваться
        </button>
      </p>
    </div>
  )
}