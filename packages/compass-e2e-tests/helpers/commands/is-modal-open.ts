import { Selectors } from '../compass';
import type { CompassBrowser } from '../compass-browser';

export async function isModalOpen(
  browser: CompassBrowser,
  selector: Parameters<CompassBrowser['$$']>[0] = Selectors.LGModal
): Promise<boolean> {
  const modals = await browser.getOpenModals(selector);
  return modals.length > 0;
}
