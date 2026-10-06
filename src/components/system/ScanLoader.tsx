import { cn } from '@/lib/cn';

/** The System thinking. Used while AI analyses. */
export function ScanLoader({
  label = 'Analysing',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col gap-2', className)}>
      <p className="hud-13 text-sys">{label}…</p>
      <span aria-hidden className="scan-track block" />
    </div>
  );
}
