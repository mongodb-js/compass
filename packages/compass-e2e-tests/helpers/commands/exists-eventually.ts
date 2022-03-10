import type { CompassBrowser } from '../compass-browser';

export async function existsEventually(
  browser: CompassBrowser,
  selector: string,
  timeout = 1000
): Promise<boolean> {
  try {
    // return true if it exists before the timeout expires
    const element = await browser.$(selector);
    await element.waitForDisplayed({
      timeout,
    });
    return true;
  } catch (err) {
    // return false if not
    return false;
  }
}
