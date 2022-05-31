import type { CompassBrowser } from '../compass-browser';

export async function expandAccordion(
  browser: CompassBrowser,
  selector: string
): Promise<boolean> {
  const expandButton = await browser.$(selector);
  await expandButton.waitForDisplayed();

  if ((await expandButton.getAttribute('aria-expanded')) === 'false') {
    await expandButton.click();
    await browser.waitUntil(async () => {
      return (await expandButton.getAttribute('aria-expanded')) === 'true';
    });
    return false; // it was collapsed and had to expand
  }

  return true; // it was expanded already
}
