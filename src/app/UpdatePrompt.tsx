import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast, useToasts } from '@/app/stores/toasts';

/** Offline-ready service worker; a new version announces itself as a System toast with Reload. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;
    toast({
      id: 'update',
      tone: 'sys',
      label: 'Update',
      message: 'New version available.',
      action: { label: 'Reload', run: () => void updateServiceWorker(true) },
      persist: true,
    });
    return () => useToasts.getState().dismiss('update');
  }, [needRefresh, updateServiceWorker]);

  return null;
}
