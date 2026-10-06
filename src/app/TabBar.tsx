import { Barbell, CalendarCheck, ChartPolar, Target, type Icon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import { SPRING_UI } from '@/lib/motion';

interface Tab {
  to: string;
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
  preview?: string;
  className?: string;
}

/** Four tabs, blurred bar, sys indicator that slides between them. */
export function TabBar({ preview, className }: TabBarProps) {
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
      <ul className="grid min-h-(--tabbar-h) grid-cols-4">
        {TABS.map(({ to, label, icon: Glyph }) => (
          <li key={to} className="contents">
            <NavLink
              to={to}
              className="group relative flex min-w-0 tap flex-col items-center justify-center gap-1 px-1 py-2 outline-offset-[-4px] transition-colors duration-(--dur-1) active:bg-s2"
            >
              {({ isActive: routeActive }) => {
                const isActive = preview ? preview === to : routeActive;
                return (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId={preview ? undefined : 'tab-indicator'}
                        transition={SPRING_UI}
                        className="absolute top-0 h-0.5 w-6 bg-sys"
                      />
                    )}
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
                  </>
                );
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
