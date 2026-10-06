import { Barbell, CalendarCheck, ChartPolar, Target, type Icon } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate } from 'react-router';
import { tabOf, useTabs, type TabRoot } from '@/app/stores/tabs';
import { cn } from '@/lib/cn';

interface Tab {
  to: TabRoot;
  label: string;
  icon: Icon;
}

const TABS: readonly Tab[] = [
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/train', label: 'Train', icon: Barbell },
  { to: '/status', label: 'Status', icon: ChartPolar },
  { to: '/quests', label: 'Quests', icon: Target },
];

export interface TabBarProps {
  /** Kit only: render as if this tab were active, statically positioned. */
  preview?: TabRoot;
  className?: string;
}

/** Four tabs, blurred bar, sys indicator that slides between them. */
export function TabBar({ preview, className }: TabBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const last = useTabs((st) => st.last);
  const current = preview ?? tabOf(pathname);

  return (
    <nav
      aria-label={preview ? 'Main (preview)' : 'Main'}
      className={cn(
        'z-(--z-tabbar) border-t border-line bg-s1/82 backdrop-blur-bar',
        preview
          ? 'relative'
          : 'fixed inset-x-0 bottom-0 mx-auto max-w-(--frame-w) pb-(--safe-bottom)',
        className,
      )}
    >
      {current && (
        <span
          aria-hidden
          className="slide-indicator pointer-events-none absolute top-0 left-0 flex h-0.5 w-1/4 justify-center"
          style={{ transform: `translateX(${TABS.findIndex((t) => t.to === current) * 100}%)` }}
        >
          <span className="h-full w-6 bg-sys" />
        </span>
      )}
      <ul className="grid min-h-(--tabbar-h) grid-cols-4">
        {TABS.map(({ to, label, icon: Glyph }) => {
          const isActive = current === to;
          const dest = isActive ? to : (last[to] ?? to);
          return (
            <li key={to} className="contents">
              <Link
                to={dest}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => {
                  if (!isActive || preview) return;
                  // Tapping the active tab pops to its root, then scrolls to the top.
                  e.preventDefault();
                  if (pathname !== to) navigate(to);
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative flex min-w-0 tap flex-col items-center justify-center gap-1 px-1 py-2 outline-offset-[-4px] transition-colors duration-(--dur-1) active:bg-s2"
              >
                <Glyph
                  weight={isActive ? 'regular' : 'light'}
                  className={cn(
                    'size-6 shrink-0 transition-colors duration-(--dur-1)',
                    isActive ? 'text-sys' : 'text-ink-3 group-hover:text-ink-2',
                  )}
                />
                <span
                  className={cn(
                    'max-w-full truncate hud-11 transition-colors duration-(--dur-1)',
                    isActive ? 'text-sys' : 'text-ink-3 group-hover:text-ink-2',
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
