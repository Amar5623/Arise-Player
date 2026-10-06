import type { Transition } from 'motion/react';

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const SPRING_UI: Transition = { type: 'spring', stiffness: 520, damping: 40, mass: 1 };
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 260, damping: 30, mass: 1 };

export const DUR = { 1: 0.15, 2: 0.2, 3: 0.25, 4: 0.6 } as const;
