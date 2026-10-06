import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  event: BeforeInstallPromptEvent | null;
  installed: boolean;
}

/** Captures Chrome's install prompt so Settings can offer it on demand. */
export const useInstall = create<InstallState>(() => ({
  event: null,
  installed:
    typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches,
}));

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useInstall.setState({ event: e as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () =>
    useInstall.setState({ event: null, installed: true }),
  );
}

export async function promptInstall(): Promise<boolean> {
  const e = useInstall.getState().event;
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  useInstall.setState({ event: null });
  return outcome === 'accepted';
}

export const isIOS = () =>
  typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
