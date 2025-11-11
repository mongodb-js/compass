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
      const open = await browser.isModalOpen(selector);
      return reverse ? !open : open;
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
