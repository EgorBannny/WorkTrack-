import { Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth.store'
import { apiLogout } from '@/api/auth.api'

interface RightDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function RightDrawer({ isOpen, onClose }: RightDrawerProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  async function handleLogout() {
    await apiLogout()
    setUser(null)
    navigate('/')
  }

  function handleSettings() {
    navigate('/profile')
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
        'fixed inset-y-0 right-0 z-50 w-72 bg-background border-l border-border',
        'flex flex-col transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}>
        {/* Профиль */}
        <div className="flex flex-col items-center gap-3 px-6 py-8 border-b border-border">
          <Avatar userId={user?.id} name={user?.display_name} size="lg" />
          <div className="text-center">
            <p className="font-semibold">{user?.display_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Действия */}
        <div className="flex-1 p-3 space-y-1">
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
          >
            <Settings className="size-4 shrink-0" />
            Настройки профиля
          </button>
        </div>

        {/* Выход */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
          >
            <LogOut className="size-4 shrink-0" />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  )
}