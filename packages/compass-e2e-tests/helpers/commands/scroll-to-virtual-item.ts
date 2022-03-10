import type { CompassBrowser } from '../compass-browser';

export async function scrollToVirtualItem(
  browser: CompassBrowser,
  containerSelector: string,
  targetSelector: string
): Promise<boolean> {
  let found = false;

  await browser.$(containerSelector).waitForDisplayed();

  // it takes some time for the grid to initialise
  await browser.waitUntil(async () => {
    const rowCount = await browser
      .$(`${containerSelector} [role="grid"]`)
      .getAttribute('aria-rowcount');
    const length = await browser.$$(`${containerSelector} [role="row"]`).length;

    return !!(rowCount && length);
  });

  // scroll to the top and return the height of the scrollbar area and the
  // scroll content
  const [scrollHeight, totalHeight] = await browser.execute((selector) => {
    const container = document.querySelector(selector);
    const scrollContainer = container?.firstChild;
    const heightContainer = scrollContainer?.firstChild;
    if (!heightContainer) {
      return [null, null];
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    scrollContainer.scrollTop = 0;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return [scrollContainer.clientHeight, heightContainer.offsetHeight];
  }, containerSelector);

  if (scrollHeight === null || totalHeight === null) {
    return false;
  }

  // wait for element 0 to be visible to make sure this went into effect
  await browser
    .$(`${containerSelector} [data-vlist-item-idx="0"]`)
    .waitForDisplayed();

  let scrollTop = 0;
  let topIdx = '0';

  await browser.waitUntil(async () => {
    const targetElement = await browser.$(targetSelector);
    if (await targetElement.isExisting()) {
      await targetElement.waitForDisplayed();
      await targetElement.scrollIntoView();
      // the item is now visible, so stop scrolling
      found = true;
      return true;
    }

    // Browsers don't mind if we scroll past the last possible position. They
    // will only scroll up to the last possible point. Which is handy, because
    // then we don't have to try and calculate that pixel value.
    scrollTop += scrollHeight;

    if (scrollTop <= totalHeight) {
      // scroll for another screen
      await browser.execute(
        (selector, nextScrollTop) => {
          const container = document.querySelector(selector);
          const scrollContainer = container?.firstChild;
          if (!scrollContainer) {
            return;
          }

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          scrollContainer.scrollTop = nextScrollTop;
        },
        containerSelector,
        scrollTop
      );

      // wait for the top one to be different to make sure that the grid updated
      await browser.waitUntil(async () => {
        const idx = await browser
          .$(
            `${containerSelector} [role="row"]:first-child [role="gridcell"]:first-child`
          )
          .getAttribute('data-vlist-item-idx');

        if (idx === topIdx) {
          return false;
        } else {
          topIdx = idx;
          return true;
        }
      });

      return false;
    } else {
      // stop because we got to the end and never found it
      return true;
    }
  });

  return found;
}
