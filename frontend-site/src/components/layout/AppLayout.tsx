import { useState } from 'react'
import { Outlet } from 'react-router'
import { Header } from './Header'
import { LeftDrawer } from './LeftDrawer'
import { RightDrawer } from './RightDrawer'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function AppLayout() {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onMenuClick={() => setLeftOpen(true)}
        onAvatarClick={() => setRightOpen(true)}
      />

      <LeftDrawer isOpen={leftOpen} onClose={() => setLeftOpen(false)} />
      <RightDrawer isOpen={rightOpen} onClose={() => setRightOpen(false)} />

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <div className="fixed bottom-4 right-4 z-30">
        <ThemeToggle />
      </div>
    </div>
  )
}