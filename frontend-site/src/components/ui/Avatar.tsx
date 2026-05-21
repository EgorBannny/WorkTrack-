import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className={cn(
      'rounded-full shrink-0 overflow-hidden font-medium',
      'bg-primary/10 text-primary flex items-center justify-center',
      sizes[size],
      className,
    )}>
      {src && !imgError
        ? <img
            src={src}
            alt={name ?? ''}
            className="size-full object-cover"
            onError={() => setImgError(true)}
          />
        : getInitials(name)
      }
    </div>
  )
}