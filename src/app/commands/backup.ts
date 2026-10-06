/** JSON backup, validated import, the tracker CSV, and reset. */
import { z } from 'zod';
import { sessionsToCsv } from '@/engine/csv';
import { db, SCHEMA_VERSION } from '@/db/db';
import { ALL_TABLES, repo } from '@/db/repos';

const BackupSchema = z.object({
  app: z.literal('player-system'),
  schema: z.number().int().positive(),
  exportedAt: z.string(),
  tables: z.object({
    profile: z.array(z.record(z.string(), z.unknown())),
    player: z.array(z.record(z.string(), z.unknown())),
    ladders: z.array(
      z.object({
        key: z.enum(['push', 'squat', 'pull']),
        step: z.number(),
        target: z.number(),
        fails: z.number(),
      }),
    ),
    exercises: z.array(z.object({ exerciseId: z.string(), target: z.number(), fails: z.number() })),
    habits: z.array(
      z.object({ id: z.string(), enabled: z.boolean(), tier: z.number(), since: z.string() }),
    ),
    days: z.array(
      z
        .object({ date: z.string(), quests: z.array(z.record(z.string(), z.unknown())) })
        .passthrough(),
    ),
    sessions: z.array(
      z
        .object({
          id: z.string(),
          date: z.string(),
          entries: z.array(z.record(z.string(), z.unknown())),
        })
        .passthrough(),
    ),
    goals: z.array(z.object({ id: z.string(), title: z.string() }).passthrough()),
    body: z.array(z.object({ date: z.string() }).passthrough()),
    xp: z.array(
      z
        .object({
          id: z.string(),
          date: z.string(),
          amount: z.number(),
          source: z.string(),
          ref: z.string(),
        })
        .passthrough(),
    ),
    meta: z.array(z.object({ key: z.string(), value: z.unknown() })),
  }),
});

export type Backup = z.infer<typeof BackupSchema>;

export async function exportBackup(): Promise<string> {
  const tables = Object.fromEntries(
    await Promise.all(ALL_TABLES.map(async (t) => [t.name, await t.toArray()] as const)),
  );
  return JSON.stringify(
    { app: 'player-system', schema: SCHEMA_VERSION, exportedAt: new Date().toISOString(), tables },
    null,
    2,
  );
}

export type ImportResult =
  { ok: true; days: number; sessions: number } | { ok: false; error: string };

/** Replaces everything with the backup, atomically. Rejects anything that doesn't validate. */
export async function importBackup(text: string): Promise<ImportResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not JSON.' };
  }
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'That file is not a Player System backup.' };
  if (parsed.data.schema > SCHEMA_VERSION)
    return { ok: false, error: 'That backup comes from a newer version of the app.' };
  const t = parsed.data.tables;
  await db.transaction('rw', ALL_TABLES, async () => {
    for (const table of ALL_TABLES) await table.clear();
    for (const table of ALL_TABLES) {
      const rows = t[table.name as keyof typeof t] as unknown[];
      // Shapes were validated above; Dexie takes the rows as stored.
      if (rows.length)
        await (table as unknown as { bulkPut: (r: unknown[]) => Promise<unknown> }).bulkPut(rows);
    }
  });
  return { ok: true, days: t.days.length, sessions: t.sessions.length };
}

export async function exportTrainingCsv(): Promise<string> {
  return sessionsToCsv(await repo.sessions.all());
}

export async function resetAll(): Promise<void> {
  await db.transaction('rw', ALL_TABLES, async () => {
    for (const table of ALL_TABLES) await table.clear();
  });
}

export function download(name: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
