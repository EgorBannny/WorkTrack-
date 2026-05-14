import { cn } from '@/lib/utils'

const CRITERIA = [
  { label: 'Минимум 8 символов',             test: (p: string) => p.length >= 8 },
  { label: 'Заглавная буква (A-Z или А-ЯЁ)', test: (p: string) => /[A-ZА-ЯЁ]/.test(p) },
  { label: 'Строчная буква (a-z или а-яё)',  test: (p: string) => /[a-zа-яё]/.test(p) },
  { label: 'Цифра (0-9)',                    test: (p: string) => /[0-9]/.test(p) },
  { label: 'Спецсимвол (!@#$...)',           test: (p: string) => /[^A-Za-zА-ЯЁа-яё0-9\s]/.test(p) },
  { label: 'Без пробелов',                   test: (p: string) => !/\s/.test(p) },
]

function getStrength(passed: number): { label: string; color: string; width: string } {
  if (passed <= 2) return { label: 'Слабый',  color: 'bg-destructive', width: 'w-2/6' }
  if (passed <= 4) return { label: 'Средний', color: 'bg-yellow-500',  width: 'w-4/6' }
  return             { label: 'Надёжный',     color: 'bg-green-500',   width: 'w-full' }
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const results = CRITERIA.map((c) => ({ ...c, passed: c.test(password) }))
  const hasMinLength = password.length >= 8
  const passed = hasMinLength ? results.filter((c) => c.passed).length : 0
  const { label, color, width } = getStrength(passed)

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-300', color, width)} />
        </div>
        <span className={cn(
          'text-xs font-medium w-16 text-right shrink-0',
          passed <= 2 ? 'text-destructive' : passed <= 4 ? 'text-yellow-500' : 'text-green-500',
        )}>
          {label}
        </span>
      </div>

      <ul className="space-y-1">
        {results.map((c) => (
          <li key={c.label} className={cn(
            'flex items-center gap-1.5 text-xs transition-colors',
            c.passed ? 'text-green-500' : 'text-muted-foreground',
          )}>
            <span className="shrink-0">{c.passed ? '✓' : '○'}</span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function validatePassword(password: string): boolean {
  return CRITERIA.every((c) => c.test(password))
}