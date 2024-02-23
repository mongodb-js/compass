import type { CompassBrowser } from '../compass-browser';

export async function hover(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  await browser.$(selector).moveTo();
}
