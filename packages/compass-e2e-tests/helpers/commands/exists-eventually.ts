import { Browser } from 'webdriverio';

export async function existsEventually(
  browser: Browser<'async'>,
  selector: string,
  timeout = 10000
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
