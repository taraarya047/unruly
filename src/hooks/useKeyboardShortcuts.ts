import { useEffect } from 'react'
import { useDesignStore } from '@/state/useDesignStore'
import { useSavedStore } from '@/state/useSavedStore'
import { useToastStore } from '@/state/useToastStore'
import { useUIStore } from '@/state/useUIStore'
import { generatorRegistry } from '@/engine/registry'

function isTypingTarget(el: EventTarget | null) {
  const tag = (el as HTMLElement)?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement)?.isContentEditable
}

/** Global playground shortcuts — see spec §51. Skipped while typing in a field. */
export function useKeyboardShortcuts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      const store = useDesignStore.getState()

      if (mod && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault()
        store.redo()
        return
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        store.undo()
        return
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        const generator = generatorRegistry.get(store.generatorId)
        useSavedStore.getState().save({
          name: generator?.name ?? 'Design',
          generatorId: store.generatorId,
          parameters: store.parameters,
          seed: store.seed,
          palette: store.palette,
        })
        useToastStore.getState().show('Saved to your library')
        return
      }
      if (mod) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          store.randomizeEvolve()
          break
        case 'r':
        case 'R':
          store.randomizeNew()
          break
        case 'c':
        case 'C':
          store.randomizeRecolor()
          break
        case 'f':
        case 'F':
          window.dispatchEvent(new CustomEvent('playground:fit'))
          break
        case '0':
          window.dispatchEvent(new CustomEvent('playground:fit'))
          break
        case '?':
          useUIStore.getState().setShortcutsOpen(true)
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
