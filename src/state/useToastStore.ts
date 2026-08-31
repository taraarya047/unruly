import { create } from 'zustand'

interface Toast {
  id: number
  message: string
}

interface ToastState {
  toasts: Toast[]
  show: (message: string) => void
  dismiss: (id: number) => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message) => {
    const id = ++counter
    set((state) => ({ toasts: [...state.toasts, { id, message }] }))
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 2600)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
