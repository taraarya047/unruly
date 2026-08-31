import { create } from 'zustand'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (pref: ThemePreference) => void
}

const STORAGE_KEY = 'svgplayground:theme'

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : pref
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

function readInitial(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null
  return stored ?? 'system'
}

const initialPreference = readInitial()
const initialResolved = typeof window === 'undefined' ? 'light' : resolveTheme(initialPreference)

export const useThemeStore = create<ThemeState>((set) => ({
  preference: initialPreference,
  resolved: initialResolved,
  setPreference: (pref) => {
    window.localStorage.setItem(STORAGE_KEY, pref)
    const resolved = resolveTheme(pref)
    applyTheme(resolved)
    set({ preference: pref, resolved })
  },
}))

if (typeof window !== 'undefined') {
  applyTheme(initialResolved)

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useThemeStore.getState().preference !== 'system') return
    const resolved = resolveTheme('system')
    applyTheme(resolved)
    useThemeStore.setState({ resolved })
  })
}
