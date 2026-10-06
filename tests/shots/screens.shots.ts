import { test, type Page } from '@playwright/test';
import { settle, unfixChrome, VIEWPORTS } from './helpers';

// Real time on purpose: Playwright's fake clock stalls Motion's entrance animations after a reload.
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

    if (want('status'))
      test('status', async ({ page }) => {
        await page.goto('/status?demo=1');
        await page.getByRole('heading', { name: 'Quest record' }).waitFor();
        await shoot(page, 'status', vp.width);
        await page.getByRole('button', { name: /^Intellect/ }).click();
        await page.waitForTimeout(700);
        await page.screenshot({ path: `screenshots/stat-sheet-${vp.width}.png` });
        await page.keyboard.press('Escape');
        await page.goto('/status/history');
        await page.getByRole('grid').waitFor();
        await shoot(page, 'history', vp.width);
        await page.goto('/status/report');
        await page.getByRole('heading', { name: 'Weekly System Report' }).waitFor();
        await shoot(page, 'report', vp.width, false);
      });

    if (want('quests'))
      test('quests', async ({ page }) => {
        await page.goto('/quests?demo=1');
        await page.getByText('Main quests').waitFor();
        await shoot(page, 'quests', vp.width);
        await page.getByText('Emergency fund').click();
        await page.getByText('Update value').waitFor();
        await shoot(page, 'goal', vp.width);
        await page.goto('/quests');
        await page.getByRole('button', { name: 'New' }).click();
        await page.getByText('Start from a template').waitFor();
        await page.waitForTimeout(700);
        await page.screenshot({ path: `screenshots/new-goal-${vp.width}.png` });
      });

    if (want('settings'))
      test('settings', async ({ page }) => {
        await page.goto('/settings?demo=1');
        await page.getByText('Daily quest library').waitFor();
        await shoot(page, 'settings', vp.width);
        await page.goto('/settings/habits');
        await page.getByRole('switch').first().waitFor();
        await shoot(page, 'settings-habits', vp.width);
        await page.goto('/settings/data');
        await page.getByText('Export backup').waitFor();
        await shoot(page, 'settings-data', vp.width, false);
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
