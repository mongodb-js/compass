import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function hideToasts(browser: CompassBrowser): Promise<void> {
  const toastContainer = await browser.$(Selectors.LGToastContainer);
  const isToastContainerVisible = await toastContainer.isDisplayed();
  if (!isToastContainerVisible) {
    return;
  }
  const toasts = await toastContainer.$$('div');
  for (const toast of toasts) {
    await browser.hover(Selectors.LGToastContainer);
    const isToastVisible = await toast.isDisplayed();
    if (!isToastVisible) {
      continue;
    }
    await toast.$(Selectors.LGToastCloseButton).click();
    await toast.waitForExist({ reverse: true });
  }
}
