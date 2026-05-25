import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Layers } from 'lucide-react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const FEATURES = [
  'Управление проектами и задачами',
  'Роли и участники организации',
  'Приоритеты, статусы, дедлайны',
  'История изменений задач',
]

const STACK = ['FastAPI', 'React', 'PostgreSQL', 'Redis', 'Docker']

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="h-screen flex relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>

      {/* ── Левая панель (десктоп) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[460px] shrink-0 bg-muted border-r border-border p-10">
        <div>
          {/* Логотип */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="size-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">WorkTrack</span>
          </div>

          {/* Описание */}
          <h1 className="text-2xl font-semibold leading-snug mb-2">
            Корпоративный портал управления задачами и проектами
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Проект по производственной практике
          </p>

          {/* Возможности */}
          <div className="space-y-3 mb-8">
            {FEATURES.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>

          {/* Стек */}
          <div className="flex flex-wrap gap-2">
            {STACK.map((tech) => (
              <span
                key={tech}
                className="text-xs px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Предупреждение */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
          <p className="text-sm text-muted-foreground">
            Учебный проект по производственной практике. Не предназначен для реального использования.
          </p>
        </div>
      </div>

      {/* ── Правая панель — форма ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-sm">

            {/* Мобильная шапка */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <Layers className="size-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold">WorkTrack</span>
            </div>

            {mode === 'login'
              ? <LoginForm onSwitch={() => setMode('register')} />
              : <RegisterForm onSwitch={() => setMode('login')} />
            }
          </div>
        </div>
      </div>

    </div>
  )
}