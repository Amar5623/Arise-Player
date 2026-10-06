import { create } from 'zustand';
import type { SystemTone } from '@/components/system/tone';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: string;
  tone: SystemTone;
  /** Header label, e.g. NOTIFICATION, PENALTY ISSUED. */
  label: string;
  /** The System's line. */
  message: string;
  detail?: string;
  action?: ToastAction;
  /** Stays until dismissed or acted on. */
  persist?: boolean;
}

interface ToastState {
  queue: Toast[];
  push: (toast: Omit<Toast, 'id'> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let seq = 0;

export const useToasts = create<ToastState>((set) => ({
  queue: [],
  push: (toast) => {
    const id = toast.id ?? `t${++seq}`;
    set((s) => (s.queue.some((t) => t.id === id) ? s : { queue: [...s.queue, { ...toast, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),
  clear: () => set({ queue: [] }),
}));

export const toast = (t: Omit<Toast, 'id'> & { id?: string }) => useToasts.getState().push(t);
