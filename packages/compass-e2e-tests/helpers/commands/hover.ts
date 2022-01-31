import type { CompassBrowser } from '../compass-browser';

export async function hover(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  const puppeteerBrowser = await browser.getPuppeteer();
  const pages = await puppeteerBrowser.pages();
  const page = pages[0];
  await page.hover(selector);
}
