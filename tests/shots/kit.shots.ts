import { test } from '@playwright/test';
import { forceKitStates, settle, unfixChrome, VIEWPORTS } from './helpers';

for (const vp of VIEWPORTS) {
  test(`kit ${vp.width}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/kit?still');
    await settle(page);
    await page.screenshot({ path: `screenshots/kit-${vp.width}-fold.png` });
    await forceKitStates(page);
    await unfixChrome(page);
    await page.screenshot({ path: `screenshots/kit-${vp.width}.png`, fullPage: true });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    if (overflow > 0) throw new Error(`Horizontal overflow of ${overflow}px at ${vp.width}`);
  });

  test(`kit overlays ${vp.width}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/kit?still');
    await settle(page);
    await page.getByRole('button', { name: 'Open sheet' }).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `screenshots/kit-sheet-${vp.width}.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Level up' }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `screenshots/kit-levelup-${vp.width}.png` });
  });
}
