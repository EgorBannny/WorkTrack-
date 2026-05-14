import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:
    'bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400',
  secondary:
    'bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-100 dark:text-gray-200 dark:border-zinc-700 dark:hover:bg-zinc-800',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800',
  danger:
    'bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-400',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}