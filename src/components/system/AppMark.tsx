import { cn } from '@/lib/cn';

/** The app glyph: a rank-up chevron pair inside System corner brackets. */
export function AppMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="Player System"
      className={cn('shrink-0', className)}
    >
      <path
        d="M6 18V6h12M46 6h12v12M58 46v12H46M18 58H6V46"
        fill="none"
        stroke="var(--color-sys)"
        strokeWidth={3}
        strokeLinecap="square"
      />
      <path
        d="M19 44 32 31l13 13"
        fill="none"
        stroke="var(--color-sys)"
        strokeWidth={5}
        strokeLinecap="square"
      />
      <path
        d="M19 31 32 18l13 13"
        fill="none"
        stroke="var(--color-sys)"
        strokeOpacity={0.45}
        strokeWidth={5}
        strokeLinecap="square"
      />
    </svg>
  );
}
