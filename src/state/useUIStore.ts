import { create } from 'zustand'

interface UIState {
  shortcutsOpen: boolean
  setShortcutsOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  shortcutsOpen: false,
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
}))
