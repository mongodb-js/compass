import { inspect } from 'node:util';
import type { WaitForOptions } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function waitForOpenModal(
  browser: CompassBrowser,
  selector: Parameters<CompassBrowser['$$']>[0],
  { reverse = false, ...options }: WaitForOptions = {}
): Promise<void> {
  await browser.waitUntil(
    async () => {
      const modals = await browser.getOpenModals(selector);
      if (reverse) {
        return modals.length === 0;
      } else {
        for (const modal of modals) {
          // Ensure any modals are interactable if open
          await modal.waitForClickable({
            timeout: 500,
            timeoutMsg: 'Timeout waiting for open modal to become clickable',
          });
        }
        return modals.length > 0;
      }
    },
    {
      timeout: 2_000,
      timeoutMsg: `Timeout waiting for modal '${inspect(selector)}' to ${
        reverse ? 'close' : 'open'
      }`,
      ...options,
    }
  );
}
