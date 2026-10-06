/** Titles (brief §7). Unlock predicates live in engine/titles.ts. */
export interface TitleDef {
  id: string;
  name: string;
  /** How to earn it, shown on locked titles. */
  condition: string;
}

export const TITLES: readonly TitleDef[] = [
  { id: 'awakened', name: 'The Awakened', condition: 'Become a Player.' },
  { id: 'gate-breaker', name: 'Gate Breaker', condition: 'Clear your first Gate.' },
  { id: 'flawless', name: 'Flawless', condition: 'Finish every quest in a day.' },
  { id: 'iron-will', name: 'Iron Will', condition: 'Hold a 7-day streak.' },
  { id: 'unbreakable', name: 'Unbreakable', condition: 'Hold a 30-day streak.' },
  { id: 'dungeon-regular', name: 'Dungeon Regular', condition: 'Clear 25 Gates.' },
  { id: 'ascender', name: 'Ascender', condition: 'Unlock a new ladder step.' },
  { id: 'grounded', name: 'Grounded', condition: 'Reach the full push-up.' },
  { id: 'bar-conqueror', name: 'Bar Conqueror', condition: 'Reach the full pull-up.' },
  { id: 'scholar', name: 'Scholar', condition: 'Raise INT to 25.' },
  { id: 'treasurer', name: 'Treasurer', condition: 'Raise WLT to 25.' },
  { id: 'magnetic', name: 'Magnetic', condition: 'Raise CHA to 25.' },
  { id: 'quest-finisher', name: 'Quest Finisher', condition: 'Clear a main quest.' },
  { id: 'rising-hunter', name: 'Rising Hunter', condition: 'Reach level 10.' },
];

export function titleName(id: string | null | undefined): string | null {
  return TITLES.find((t) => t.id === id)?.name ?? null;
}
