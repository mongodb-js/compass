import { Selectors } from '../compass';
import type { CompassBrowser } from '../compass-browser';

export async function isModalEventuallyOpen(
  browser: CompassBrowser,
  selector: string = Selectors.LGModal,
  timeout?: number
): Promise<boolean> {
  try {
    await browser.waitForOpenModal(selector, { timeout });
    // return true if it opens before the timeout expires
    return true;
  } catch {
    return false;
  }
}
