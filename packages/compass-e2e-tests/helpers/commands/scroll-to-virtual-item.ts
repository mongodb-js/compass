import type { CompassBrowser } from '../compass-browser';

export async function scrollToVirtualItem(
  browser: CompassBrowser,
  itemsSelector: string,
  targetSelector: string
): Promise<boolean> {
  let found = false;

  let lastId: string;

  // Start by scrolling down, then scroll back up. This is necessary in case we
  // started off somewhere in the middle and the item we're looking for is above
  // it.
  for (const direction of [1, -1]) {
    await browser.waitUntil(async () => {
      const targetElement = await browser.$(targetSelector);
      if (await targetElement.isExisting()) {
        await targetElement.waitForDisplayed();
        await targetElement.scrollIntoView();
        // the item is now visible, so stop scrolling
        found = true;
        return true;
      }

      const elements = await browser.$$(itemsSelector);
      const edgeElement = elements[direction === 1 ? elements.length - 1 : 0];
      await edgeElement.waitForDisplayed();
      await edgeElement.scrollIntoView();

      const thisId = await edgeElement.getAttribute('data-id');

      if (thisId === lastId) {
        // once we reach the end, go back up the other direction
        // NOTE: this would be the first place to look if this starts flaking.
        // Not sure if new items are guaranteed to have appeared immediately
        // after we scrolled to the first/last one so we might need a better way
        // of detecting that we reached the end before going back up the other way.
        return true;
      }

      // keep scrolling
      lastId = thisId;
      return false;
    });

    if (found) {
      return true;
    }
  }

  return found;
}
