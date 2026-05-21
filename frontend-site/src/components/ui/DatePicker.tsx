import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

interface DatePickerProps {
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function toDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDisplay(iso: string) {
  const d = toDate(iso)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}. ${d.getFullYear()}`
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDow = (first.getDay() + 6) % 7 // 0=Mon

  const days: { date: Date; current: boolean }[] = []

  for (let i = startDow - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), current: false })
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(year, month, d), current: true })
  }
  while (days.length % 7 !== 0) {
    days.push({ date: new Date(year, month + 1, days.length - last.getDate() - startDow + 1), current: false })
  }

  return days
}

export function DatePicker({ value, onChange, placeholder = 'Выберите дату', className, disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const today = new Date()
  const selected = value ? toDate(value) : null
  const [view, setView] = useState(() => selected ?? today)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const days = getCalendarDays(view.getFullYear(), view.getMonth())

  function prevMonth() { setView(new Date(view.getFullYear(), view.getMonth() - 1, 1)) }
  function nextMonth() { setView(new Date(view.getFullYear(), view.getMonth() + 1, 1)) }

  function selectDay(d: Date) {
    onChange(toIso(d))
    setOpen(false)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
  }

  const isSelected = (d: Date) => selected && toIso(d) === toIso(selected)
  const isToday = (d: Date) => toIso(d) === toIso(today)

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Input */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 outline-none transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'border-ring ring-3 ring-ring/20',
        )}
      >
        <span className={cn('flex items-center gap-2', !value && 'text-muted-foreground')}>
          <CalendarDays className="size-3.5 shrink-0" />
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <span
            onClick={clear}
            className="text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            <X className="size-3.5" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg p-3 w-64">
          {/* Навигация */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="size-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
            <button type="button" onClick={nextMonth} className="size-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Дни недели */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-xs text-muted-foreground py-1 font-medium">{w}</div>
            ))}
          </div>

          {/* Числа */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map(({ date, current }, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(date)}
                className={cn(
                  'h-8 w-full rounded-lg text-sm transition-colors',
                  !current && 'text-muted-foreground/40',
                  current && !isSelected(date) && !isToday(date) && 'hover:bg-muted',
                  isToday(date) && !isSelected(date) && 'text-primary font-semibold',
                  isSelected(date) && 'bg-primary text-primary-foreground font-semibold',
                )}
              >
                {date.getDate()}
              </button>
            ))}
          </div>

          {/* Сегодня */}
          <button
            type="button"
            onClick={() => selectDay(today)}
            className="mt-2 w-full text-xs text-primary hover:underline py-1"
          >
            Сегодня
          </button>
        </div>
      )}
    </div>
  )
}