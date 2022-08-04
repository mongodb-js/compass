import type { CompassBrowser } from '../compass-browser';

export async function existsEventually(
  browser: CompassBrowser,
  selector: string,
  timeout?: number
): Promise<boolean> {
  try {
    // return true if it exists before the timeout expires
    const element = await browser.$(selector);
    await element.waitForDisplayed(
      typeof timeout !== 'undefined' ? { timeout } : undefined
    );
    return true;
  } catch (err) {
    // return false if not
    return false;
  }
}
