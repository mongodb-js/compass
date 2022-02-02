import type { CompassBrowser } from '../compass-browser';

export async function clickVisible(
  browser: CompassBrowser,
  selector: string,
  scrollIntoView = true
): Promise<void> {
  const element = await browser.$(selector);

  // Allow opting out of scrolling the item into view because that can be quite
  // finicky for things that only display on hover.
  if (scrollIntoView) {
    // You can't scroll a thing that doesn't exist yet
    await element.waitForExist();

    // The element can be displayed, but not on screen and then click will silently fail.
    // Furthermore, the default scrollIntoView() behaviour is to align the element
    // to the top of the screen which can leave the item visible, yet apparently
    // not enough because click can still silently do nothing.  Aligning with the
    // bottom of the screen seems to be more reliable. My guess is because of fixed
    // position things at the top.
    await element.scrollIntoView(false);
  }

  await element.waitForDisplayed();

  // Clicking a thing that's still animating is unreliable at best.
  await browser.waitForAnimations(selector);

  await element.click();
}
