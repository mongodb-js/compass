import { inspect } from 'node:util';
import type { WaitForOptions } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function waitForOpenModal(
  browser: CompassBrowser,
  selector: string,
  { reverse = false, ...options }: WaitForOptions = {}
): Promise<void> {
  await browser.waitUntil(
    async () => {
      /* eslint-disable-next-line @typescript-eslint/await-thenable -- WebdriverIO chainable promise array should be awaited */
      const modals = await browser.getOpenModals(selector);
      const count = await modals.length;
      if (reverse) {
        return count === 0;
      } else if (count === 0) {
        return false;
      } else {
        for (const modal of modals) {
          // Ensure any modals are interactable if open
          await modal.waitForClickable({
            timeoutMsg: 'Timeout waiting for open modal to become clickable',
            ...options,
          });
        }
        return true;
      }
    },
    {
      timeoutMsg: `Timeout waiting for modal '${inspect(selector)}' to ${
        reverse ? 'close' : 'open'
      }`,
      ...options,
    }
  );
}
