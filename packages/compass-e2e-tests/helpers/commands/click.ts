import type { CompassBrowser } from '../compass-browser';

export async function click(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  const clickElement = await browser.$(selector);
  await clickElement.click();
}
