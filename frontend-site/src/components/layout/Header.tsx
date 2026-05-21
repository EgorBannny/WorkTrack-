import { Menu, Layers } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth.store'

interface HeaderProps {
  onMenuClick: () => void
  onAvatarClick: () => void
}

export function Header({ onMenuClick, onAvatarClick }: HeaderProps) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-16 flex items-center justify-between px-5 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="size-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Меню"
        >
          <Menu className="size-6" />
        </button>

        <Link
          to="/orgs"
          title="Главная страница WorkTrack"
          className="flex items-center gap-2.5 rounded-lg"
        >
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base select-none">WorkTrack</span>
        </Link>
      </div>

      <button
        onClick={onAvatarClick}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Профиль"
      >
        <Avatar src={user ? `/api/users/avatar/${user.id}` : null} name={user?.display_name} size="md" />
      </button>
    </header>
  )
}