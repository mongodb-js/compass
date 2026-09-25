import type { CompassBrowser } from '../compass-browser.ts';

export async function expandAccordion(
  browser: CompassBrowser,
  selector: string
): Promise<boolean> {
  const accordion = browser.$(selector);
  await accordion.waitForDisplayed();

  const isOpen = await accordion.getAttribute('open');

  if (!isOpen) {
    const summary = await accordion.$('summary');
    await summary.click();
    await browser.waitUntil(async () => {
      return (await accordion.getAttribute('open')) !== null;
    });
    return false; // it was collapsed and had to expand
  }

  return true; // it was expanded already
}
