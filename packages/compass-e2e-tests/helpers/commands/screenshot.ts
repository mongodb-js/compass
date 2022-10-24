import path from 'path';
import type { CompassBrowser } from '../compass-browser';
import { LOG_PATH } from '../compass';

export async function screenshot(
  browser: CompassBrowser,
  filename: string
): Promise<void> {
  // Give animations a second. Hard to have a generic way to know if animations
  // are still in progress or not.
  await browser.pause(1000);
  await browser.saveScreenshot(path.join(LOG_PATH, 'screenshots', filename));
}
