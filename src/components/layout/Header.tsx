import { Link, NavLink, useLocation } from 'react-router-dom'
import { useDesignStore } from '@/state/useDesignStore'
import { useThemeStore } from '@/state/useThemeStore'
import { useSavedStore } from '@/state/useSavedStore'
import { useCurrentDesign } from '@/hooks/useCurrentDesign'
import { generatorRegistry } from '@/engine/registry'
import { IconButton } from '@/components/ui/IconButton'
import { ExportMenu } from '@/components/export/ExportMenu'
import { UndoIcon, RedoIcon, SaveIcon, SunIcon, MoonIcon, HelpIcon } from '@/components/ui/icons'
import { useUIStore } from '@/state/useUIStore'
import { useToastStore } from '@/state/useToastStore'
import clsx from 'clsx'

export function Header() {
  const location = useLocation()
  const isPlayground = location.pathname === '/playground'

  const undo = useDesignStore((s) => s.undo)
  const redo = useDesignStore((s) => s.redo)
  const canUndo = useDesignStore((s) => s.canUndo())
  const canRedo = useDesignStore((s) => s.canRedo())
  const generatorId = useDesignStore((s) => s.generatorId)
  const parameters = useDesignStore((s) => s.parameters)
  const seed = useDesignStore((s) => s.seed)
  const palette = useDesignStore((s) => s.palette)

  const resolvedTheme = useThemeStore((s) => s.resolved)
  const setPreference = useThemeStore((s) => s.setPreference)
  const save = useSavedStore((s) => s.save)
  const show = useToastStore((s) => s.show)
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen)

  const design = useCurrentDesign()
  const generator = generatorRegistry.get(generatorId)

  const handleSave = () => {
    save({ name: generator?.name ?? 'Design', generatorId, parameters, seed, palette })
    show('Saved to your library')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-text">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l2.2 6.8H21l-5.6 4.1L17.6 21 12 16.9 6.4 21l2.2-7.1L3 9.8h6.8L12 3Z" fill="currentColor" />
            </svg>
          </span>
          Unruly
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <NavItem to="/playground" label="Playground" />
          <NavItem to="/explore" label="Explore" />
          <NavItem to="/saved" label="Saved" />
        </nav>
      </div>

      {isPlayground && generator && (
        <div className="hidden text-sm font-medium text-text-muted lg:block">{generator.name}</div>
      )}

      <div className="flex items-center gap-1">
        {isPlayground && (
          <>
            <IconButton label="Undo (⌘Z)" onClick={undo} disabled={!canUndo}>
              <UndoIcon />
            </IconButton>
            <IconButton label="Redo (⌘⇧Z)" onClick={redo} disabled={!canRedo}>
              <RedoIcon />
            </IconButton>
            <IconButton label="Save (⌘S)" onClick={handleSave}>
              <SaveIcon />
            </IconButton>
            <div className="mx-1 h-6 w-px bg-border" />
          </>
        )}
        <IconButton
          label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </IconButton>
        <IconButton label="Help & shortcuts" onClick={() => setShortcutsOpen(true)}>
          <HelpIcon />
        </IconButton>
        {isPlayground && (
          <div className="ml-2 hidden md:block">
            <ExportMenu design={design} background={palette.background} />
          </div>
        )}
      </div>
    </header>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx('rounded-full px-3 py-1.5 text-sm font-medium transition-colors', isActive ? 'bg-control-bg text-text' : 'text-text-muted hover:text-text')
      }
    >
      {label}
    </NavLink>
  )
}
