import { useEffect, useState } from 'react';
import { msToMidnight } from '@/lib/dates';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** Live time to the daily reset (local midnight). */
export function Countdown({ className }: { className?: string }) {
  const [left, setLeft] = useState(() => msToMidnight());
  useEffect(() => {
    const t = window.setInterval(() => setLeft(msToMidnight()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const h = Math.floor(left / 3_600_000);
  return (
    <time
      className={className}
      aria-label={`Daily reset in ${h} hours ${Math.floor((left % 3_600_000) / 60_000)} minutes`}
    >
      {fmt(left)}
    </time>
  );
}
