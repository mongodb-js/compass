import { Selectors } from '../compass';
import type { CompassBrowser } from '../compass-browser';

// TODO: Wait for any animation to settle before resolving?
export function getOpenModals(
  browser: CompassBrowser,
  selector: Parameters<CompassBrowser['$$']>[0] = Selectors.LGModal
): Promise<WebdriverIO.Element[]> {
  return browser.$$(selector).filter(async (element) => {
    const tagName = await element.getTagName();
    if (tagName !== 'dialog') {
      throw new Error(
        `Expected selector to match dialogs, matched '${tagName}'`
      );
    }
    const open = await element.getAttribute('open');
    return open === 'true';
  });
}
