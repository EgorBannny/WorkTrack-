import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-9 w-full rounded-lg border px-3 text-sm outline-none transition-colors',
          'bg-white text-gray-900 border-gray-200 placeholder:text-gray-400',
          'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
          'dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-700 dark:placeholder:text-zinc-500',
          'dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className,
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}