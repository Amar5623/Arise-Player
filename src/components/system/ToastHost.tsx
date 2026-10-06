import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { useToasts, type Toast } from '@/app/stores/toasts';
import { cn } from '@/lib/cn';
import { TONE_GLYPH } from './tone';
import { SPRING_UI } from '@/lib/motion';

const AUTO_MS = 3200;

/** Shows the head of the queue, dropping from the top. Swipe up or tap × to dismiss. */
export function ToastHost() {
  const head = useToasts((s) => s.queue[0]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-(--z-toast) mx-auto max-w-(--frame-w) px-3 pt-[calc(8px+var(--safe-top))]">
      <AnimatePresence mode="wait">
        {head && <LiveToast key={head.id} toast={head} />}
      </AnimatePresence>
    </div>
  );
}

function LiveToast({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  const reduce = useReducedMotion();
  const [held, setHeld] = useState(false);
  // A toast with an action stays until handled; others pause while touched, hovered or focused.
  const sticky = toast.persist ?? !!toast.action;

  useEffect(() => {
    if (sticky || held) return;
    const t = window.setTimeout(() => dismiss(toast.id), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [toast.id, sticky, held, dismiss]);

  return (
    <motion.div
      className="pointer-events-auto"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onPointerDown={() => setHeld(true)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      initial={reduce ? { opacity: 0 } : { y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { y: -16, opacity: 0, transition: { duration: 0.15 } }}
      transition={SPRING_UI}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -24 || info.velocity.y < -300) dismiss(toast.id);
      }}
    >
      <ToastFrame toast={toast} onDismiss={() => dismiss(toast.id)} />
    </motion.div>
  );
}

/** The toast's look: a compact System Window. Rendered statically in /kit. */
export function ToastFrame({
  toast,
  onDismiss,
  className,
}: {
  toast: Toast;
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <div
      role={toast.tone === 'bad' || toast.tone === 'warn' ? 'alert' : 'status'}
      data-tone={toast.tone}
      className={cn('sys-window bg-s1', className)}
    >
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <span key={c} data-c={c} className="sys-tick" />
      ))}
      <div className="flex items-start gap-1 py-2 pr-1 pl-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-1.5">
          <p className="hud-11 text-(--tone)">
            <span aria-hidden>[&nbsp;{TONE_GLYPH[toast.tone]}&nbsp;]&nbsp;&nbsp;</span>
            {toast.label}
          </p>
          <p className="text-15 font-medium text-ink">{toast.message}</p>
          {toast.detail && <p className="text-13 text-ink-2">{toast.detail}</p>}
        </div>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.run();
              onDismiss();
            }}
            className="my-auto min-h-11 shrink-0 tap rounded-ctl px-3 hud-13 text-(--tone) hover:bg-s3 active:bg-s4"
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="grid size-11 shrink-0 tap place-items-center rounded-ctl text-ink-3 hover:bg-s3 hover:text-ink active:bg-s4"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
