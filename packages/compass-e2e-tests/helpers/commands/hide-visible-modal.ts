import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

import Debug from 'debug';

const debug = Debug('compass-e2e-tests');

export async function hideVisibleModal(browser: CompassBrowser): Promise<void> {
  // If there's some race condition where something else is closing the modal at
  // the same time we're trying to close the modal, then make it error out
  // quickly so it can be ignored and we move on.

  if (await browser.$(Selectors.LGModal).isDisplayed()) {
    // close any modals that might be in the way
    const waitOptions = { timeout: 2_000 };
    try {
      await browser.clickVisible(Selectors.LGModalClose, waitOptions);
      await browser.$(Selectors.LGModal).waitForDisplayed({ reverse: true });
    } catch (err) {
      // if the modal disappears by itself in the meantime, that's fine
      debug('ignoring', err);
    }
  }
}
