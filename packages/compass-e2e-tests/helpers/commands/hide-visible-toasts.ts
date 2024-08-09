import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

import Debug from 'debug';

const debug = Debug('compass-e2e-tests');

export async function hideAllVisibleToasts(
  browser: CompassBrowser
): Promise<void> {
  const toastContainer = await browser.$(Selectors.LGToastContainer);
  const isToastContainerVisible = await toastContainer.isDisplayed();
  if (!isToastContainerVisible) {
    return;
  }
  // LG toasts are stacked in scroll container and we need to close them all.
  const toasts = await toastContainer.$$('div');
  for (const toast of toasts) {
    try {
      await browser.hover(Selectors.LGToastContainer);
      const isToastVisible = await toast.isDisplayed();
      if (!isToastVisible) {
        continue;
      }
      debug('closing toast', await toast.getAttribute('data-testid'));
      await browser.clickVisible(toast.$(Selectors.LGToastCloseButton));
      await toast.waitForExist({ reverse: true });
    } catch (err) {
      // if the toast disappears by itself in the meantime, that's fine
      continue;
    }
  }
}
