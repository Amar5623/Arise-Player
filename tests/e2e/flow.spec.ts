import { expect, test, type Page } from '@playwright/test';

/**
 * Shifts Date (not performance.now or animation frames, which Motion needs) by `ms`.
 * Init scripts stack, so a second call moves the app another step forward.
 */
async function shiftDate(page: Page, ms: number) {
  await page.addInitScript((offset: number) => {
    const Real = Date;
    class Shifted extends Real {
      constructor(...args: ConstructorParameters<typeof Date> | []) {
        if (args.length === 0) super(Real.now() + offset);
        else super(...(args as ConstructorParameters<typeof Date>));
      }
      static override now() {
        return Real.now() + offset;
      }
    }
    globalThis.Date = Shifted as DateConstructor;
  }, ms);
}

/** Milliseconds from now to 08:00 on the coming Monday (a Gate day). */
function toNextMondayMorning(): number {
  const now = new Date();
  const target = new Date(now);
  target.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  target.setHours(8, 0, 0, 0);
  return target.getTime() - now.getTime();
}

test('onboarding to Gate cleared, level-up, and next-day penalty', async ({ page }) => {
  test.setTimeout(120_000);
  await shiftDate(page, toNextMondayMorning());

  // Awakening
  await page.goto('/onboarding/1');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByLabel('Name').fill('Tester');
  await page.getByLabel('Weight').fill('78');
  await page.getByLabel('Height').fill('176');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Starting point' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Daily quests' })).toBeVisible();
  await page.getByRole('button', { name: 'Become a Player' }).click();

  // Today: morning status check
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole('heading', { name: 'Morning status check' })).toBeVisible();
  await page.getByRole('radiogroup', { name: 'Energy' }).getByRole('radio', { name: '4' }).click();
  await page
    .getByRole('radiogroup', { name: 'Soreness' })
    .getByRole('radio', { name: '2' })
    .click();
  await page
    .getByRole('radiogroup', { name: 'Sharp or joint pain' })
    .getByRole('radio', { name: 'No' })
    .click();
  await page.getByRole('button', { name: 'Log status' }).click();
  await expect(page.getByText('Optimal')).toBeVisible();

  // Check two quests
  await page.getByRole('checkbox', { name: 'AM skincare' }).click();
  await expect(page.getByRole('checkbox', { name: 'AM skincare' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('checkbox', { name: /^Water/ }).click();
  await expect(page.getByRole('checkbox', { name: /^Water/ })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  // Gate in Focus Mode
  await page.getByRole('button', { name: 'Start Gate' }).click();
  await expect(page).toHaveURL(/\/train$/);
  await expect(page.getByRole('heading', { name: 'Push + Core' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Gate' }).click();
  await expect(page).toHaveURL(/\/gate\/focus$/);
  for (const box of await page.getByRole('checkbox').all()) await box.click();
  await page.getByRole('button', { name: 'Begin' }).click();
  for (;;) {
    const set = page.getByRole('button', { name: /^Set \d+: log/ }).first();
    while (await set.isVisible().catch(() => false)) {
      await set.click();
      const skip = page.getByRole('button', { name: 'Skip rest' });
      if (await skip.isVisible().catch(() => false)) await skip.click();
    }
    await page.getByRole('radiogroup', { name: 'RPE' }).getByRole('radio', { name: '8' }).click();
    const next = page.getByRole('button', { name: 'Next exercise' });
    if (await next.isVisible().catch(() => false)) await next.click();
    else break;
  }
  await page.getByRole('button', { name: 'Clear Gate' }).click();

  // Gate Cleared, then the level-up takeover
  await expect(page).toHaveURL(/\/gate\/cleared\//);
  await expect(page.getByText('XP gained')).toBeVisible();
  await expect(page.getByText('Target up to', { exact: false }).first()).toBeVisible();
  const levelUp = page.getByRole('dialog', { name: /Level up/ });
  await expect(levelUp).toBeVisible();
  await levelUp.getByRole('button', { name: 'Continue' }).click();
  await expect(levelUp).toBeHidden();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page).toHaveURL(/\/today$/);

  // Next day: yesterday closed under 50%, so a penalty is issued.
  await shiftDate(page, 24 * 3600 * 1000);
  await page.goto('/today');
  await expect(page.getByRole('alert').filter({ hasText: 'Penalty issued' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: '20-min brisk walk' })).toBeVisible();
});
