import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Toaster } from '@/components/ui/Toaster'
import { ShortcutsModal } from '@/components/help/ShortcutsModal'
import { useAnalyticsInit } from '@/hooks/useAnalyticsInit'

export function AppShell() {
  useAnalyticsInit()

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Toaster />
      <ShortcutsModal />
    </div>
  )
}
