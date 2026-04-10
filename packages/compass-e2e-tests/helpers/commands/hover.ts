import type { CompassBrowser } from '../compass-browser.ts';

export async function hover(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  await browser.$(selector).moveTo();
}
