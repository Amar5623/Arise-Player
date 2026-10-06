import type { Page } from '@playwright/test';

export const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 360, height: 780 },
] as const;

/**
 * Forces :hover / :active / :focus-visible on elements marked data-kit-state, through the
 * DevTools protocol, so every state renders in a still screenshot without changing components.
 */
export async function forceKitStates(page: Page): Promise<void> {
  // :focus-within can't be forced through CDP; real focus is the only way to render it.
  await page.evaluate(() => {
    document.querySelector<HTMLInputElement>('[data-kit-state="focus-within"] input')?.focus();
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
    nodeId: root.nodeId,
    selector: '[data-kit-state]',
  });
  for (const nodeId of nodeIds) {
    const { node } = await cdp.send('DOM.describeNode', { nodeId });
    const attrs = node.attributes ?? [];
    const state = attrs[attrs.indexOf('data-kit-state') + 1] ?? 'hover';
    let target = nodeId;
    if (node.nodeName !== 'BUTTON' && node.nodeName !== 'INPUT') {
      const inner = await cdp.send('DOM.querySelector', { nodeId, selector: 'button, input' });
      if (inner.nodeId) target = inner.nodeId;
    }
    if (state === 'focus-within') continue;
    const pseudo = state === 'focus-visible' ? ['focus', 'focus-visible'] : [state];
    await cdp.send('CSS.forcePseudoState', { nodeId: target, forcedPseudoClasses: pseudo });
  }
}

/** Lets fonts load and entrance motion settle before a capture. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}

/** For full-page captures: pin fixed chrome to the document bottom instead of the first viewport. */
export async function unfixChrome(page: Page): Promise<void> {
  await page.addStyleTag({
    content: 'nav[aria-label="Main"],[data-cta-dock]{position:absolute!important}',
  });
}
