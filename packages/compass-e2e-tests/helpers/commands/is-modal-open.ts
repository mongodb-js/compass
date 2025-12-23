import { Selectors } from '../compass';
import type { CompassBrowser } from '../compass-browser';

export async function isModalOpen(
  browser: CompassBrowser,
  selector: string = Selectors.LGModal
): Promise<boolean> {
  /* eslint-disable-next-line @typescript-eslint/await-thenable -- WebdriverIO chainable promise array should be awaited */
  const modals = await browser.getOpenModals(selector);
  const count = await modals.length;
  return count > 0;
}
