import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

import Debug from 'debug';

const debug = Debug('compass-e2e-tests');

export async function hideVisibleModal(browser: CompassBrowser): Promise<void> {
  // If there's some race condition where something else is closing the modal at
  // the same time we're trying to close the modal, then make it error out
  // quickly so it can be ignored and we move on.

  /* eslint-disable-next-line @typescript-eslint/await-thenable -- WebdriverIO chainable promise array should be awaited */
  const openModals = await browser.getOpenModals(Selectors.LGModal);
  for (const modal of openModals) {
    try {
      await browser.clickVisible(browser.$(modal).$(Selectors.LGModalClose), {
        timeout: 2_000,
      });
    } catch (err) {
      // if the modal disappears by itself in the meantime, that's fine
      debug('ignoring', err instanceof Error ? err.stack : err);
    }
  }
  await browser.waitForOpenModal(Selectors.LGModal, {
    reverse: true,
  });
}
