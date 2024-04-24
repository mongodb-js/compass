import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

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
    await browser.hover(Selectors.LGToastContainer);
    const isToastVisible = await toast.isDisplayed();
    if (!isToastVisible) {
      continue;
    }
    await browser.clickVisible(toast.$(Selectors.LGToastCloseButton));
    await toast.waitForExist({ reverse: true });
  }
}
