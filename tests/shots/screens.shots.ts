import { test, type Page } from '@playwright/test';
import { settle, unfixChrome, VIEWPORTS } from './helpers';

/** A fixed morning, so countdowns and "today" are the same on every run. */
const NOW = new Date('2026-10-06T07:40:00+05:30');

/** Toasts are transient; clear them so they don't cover what the shot is about. */
async function clearToasts(page: Page) {
  for (let i = 0; i < 6; i++) {
    const btn = page.getByRole('button', { name: 'Dismiss' }).first();
    if (!(await btn.isVisible().catch(() => false))) break;
    await btn.click({ force: true });
    await page.waitForTimeout(300);
  }
}

async function shoot(page: Page, name: string, width: number, full = true) {
  await settle(page);
  await clearToasts(page);
  await page.screenshot({ path: `screenshots/${name}-${width}-fold.png` });
  if (full) {
    await unfixChrome(page);
    await page.screenshot({ path: `screenshots/${name}-${width}.png`, fullPage: true });
  }
  // Mobile emulation widens innerWidth to fit overflowing content, so compare with the set viewport.
  const overflow = (await page.evaluate(() => document.documentElement.scrollWidth)) - width;
  if (overflow > 0) throw new Error(`${name}: horizontal overflow ${overflow}px at ${width}`);
}

const only = process.env.SHOTS?.split(',');
const want = (name: string) => !only || only.includes(name);

for (const vp of VIEWPORTS) {
  test.describe(`${vp.width}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.clock.setFixedTime(NOW);
      await page.setViewportSize(vp);
    });

    if (want('onboarding'))
      test('onboarding', async ({ page }) => {
        await page.goto('/onboarding/1');
        await shoot(page, 'onboarding-1', vp.width, false);
        await page.getByRole('button', { name: 'Accept' }).click();
        await shoot(page, 'onboarding-2', vp.width);
        await page.goto('/onboarding/3');
        await shoot(page, 'onboarding-3', vp.width);
        await page.goto('/onboarding/4');
        await shoot(page, 'onboarding-4', vp.width);
      });

    if (want('today'))
      test('today', async ({ page }) => {
        await page.goto('/today?demo=1');
        await page.getByText('Daily quest').first().waitFor();
        await shoot(page, 'today', vp.width);
      });

    if (want('train'))
      test('train', async ({ page }) => {
        await page.goto('/train?demo=1');
        await page.getByText('Corrective warm-up, 8 min').waitFor();
        await shoot(page, 'gate', vp.width);
        await page.locator('a[href^="/train/exercise/"]').first().click();
        await page.getByText('How to do it').waitFor();
        await shoot(page, 'exercise', vp.width);
      });

    if (want('focus'))
      test('focus and cleared', async ({ page }) => {
        await page.goto('/gate/focus?demo=1');
        await page.getByRole('button', { name: 'Begin' }).waitFor();
        await shoot(page, 'focus-warmup', vp.width, false);
        await page.getByRole('button', { name: 'Begin' }).click();
        await page.getByRole('button', { name: /^Set 1: log/ }).click();
        await page.getByRole('button', { name: /^Set 2: log/ }).click();
        await page.waitForTimeout(400);
        await shoot(page, 'focus-rest', vp.width, false);
        await page.getByRole('button', { name: 'Skip rest' }).click();
        await page.getByRole('radio', { name: '8' }).click();
        await shoot(page, 'focus', vp.width, false);
        // Log everything and clear.
        for (;;) {
          const sets = page.getByRole('button', { name: /^Set \d+: log/ });
          while ((await sets.count()) > 0) {
            await sets.first().click();
            const skip = page.getByRole('button', { name: 'Skip rest' });
            if (await skip.isVisible().catch(() => false)) await skip.click();
          }
          const next = page.getByRole('button', { name: 'Next exercise' });
          if (await next.isVisible().catch(() => false)) await next.click();
          else break;
        }
        await page.getByRole('button', { name: 'Clear Gate' }).click();
        await page.getByText('XP gained').waitFor();
        await page.waitForTimeout(400);
        const cont = page.getByRole('button', { name: 'Continue' });
        if (await cont.isVisible().catch(() => false)) {
          await page.waitForTimeout(900);
          await page.screenshot({ path: `screenshots/levelup-${vp.width}.png` });
          await cont.click();
        }
        await shoot(page, 'cleared', vp.width);
      });
  });
}
