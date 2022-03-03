import type { CompassBrowser } from '../compass-browser';

export async function clickParent(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  const element = await browser.$(selector).parentElement();
  await element.waitForExist();
  await element.click();
}
