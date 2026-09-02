import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Toaster } from '@/components/ui/Toaster'
import { ShortcutsModal } from '@/components/help/ShortcutsModal'
import { useAnalyticsInit } from '@/hooks/useAnalyticsInit'

// The editor tools are fixed-height, non-scrolling app surfaces (see ARCHITECTURE.md's flex-basis note) —
// a footer below them would either get clipped or force the whole page to scroll. Every other route is a
// normal scrolling content page, where a footer belongs.
const NO_FOOTER_PATHS = ['/playground', '/compose']

export function AppShell() {
  useAnalyticsInit()
  const location = useLocation()
  const showFooter = !NO_FOOTER_PATHS.includes(location.pathname)

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      {showFooter && <Footer />}
      <Toaster />
      <ShortcutsModal />
    </div>
  )
}
