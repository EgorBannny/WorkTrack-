import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'size-3.5',
  md: 'size-5',
  lg: 'size-7',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent opacity-70',
        sizes[size],
        className,
      )}
    />
  )
}