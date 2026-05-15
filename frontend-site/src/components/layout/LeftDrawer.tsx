import { Building2, Bell, Mail, MessageSquare, Layers } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: Building2,    label: 'Организации',  href: '/orgs' },
  { icon: Bell,         label: 'Уведомления',  href: '/notifications' },
  { icon: Mail,         label: 'Приглашения',  href: '/invitations' },
  { icon: MessageSquare, label: 'Сообщения',   href: '/messages' },
]

interface LeftDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function LeftDrawer({ isOpen, onClose }: LeftDrawerProps) {
  const navigate = useNavigate()
  const location = useLocation()

  function handleNav(href: string) {
    navigate(href)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border',
        'flex flex-col transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Шапка дровера */}
        <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="size-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">WorkTrack</span>
          </div>

        </div>

        {/* Навигация */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
            <button
              key={href}
              onClick={() => handleNav(href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                location.pathname.startsWith(href)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}