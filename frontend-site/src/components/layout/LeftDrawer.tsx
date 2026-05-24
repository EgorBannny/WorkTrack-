import { Building2, Mail, Layers, Users, FolderOpen, BarChart2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router'
import { useOrgStore } from '@/store/org.store'
import { cn } from '@/lib/utils'

const GLOBAL_NAV = [
  { icon: Building2, label: 'Организации', href: '/orgs' },
  { icon: Mail,      label: 'Приглашения', href: '/invitations' },
]

interface LeftDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function LeftDrawer({ isOpen, onClose }: LeftDrawerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentOrg = useOrgStore((s) => s.currentOrg)

  const orgNav = currentOrg ? [
    { icon: FolderOpen, label: 'Проекты',    href: `/orgs/${currentOrg.id}/projects` },
    { icon: Users,      label: 'Участники',  href: `/orgs/${currentOrg.id}/members` },
    { icon: BarChart2,  label: 'Аналитика',  href: `/orgs/${currentOrg.id}/analytics` },
  ] : []

  function handleNav(href: string) {
    navigate(href)
    onClose()
  }

  function NavItem({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
    const active = location.pathname === href || location.pathname.startsWith(href + '/')
    return (
      <button
        onClick={() => handleNav(href)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
          active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        )}
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </button>
    )
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border',
        'flex flex-col transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="size-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">WorkTrack</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Орг-контекст */}
          {orgNav.length > 0 && (
            <>
              <p className="px-3 py-1 text-xs font-medium text-muted-foreground/60 uppercase tracking-wide">
                {currentOrg!.name}
              </p>
              {orgNav.map((item) => <NavItem key={item.href} {...item} />)}
              <div className="h-px bg-border mx-1 my-2" />
            </>
          )}

          {/* Глобальная навигация */}
          {GLOBAL_NAV.map((item) => <NavItem key={item.href} {...item} />)}
        </nav>
      </div>
    </>
  )
}