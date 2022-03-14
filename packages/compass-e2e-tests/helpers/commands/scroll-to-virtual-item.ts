import type { CompassBrowser } from '../compass-browser';

type ItemConfig = {
  firstItemSelector: string;
  firstItemIndex: string;
  indexAttribute: string;
  firstChildSelector: string;
  waitUntilElementAppears: (
    browser: CompassBrowser,
    selector: string
  ) => Promise<boolean>;
};

const gridConfig: ItemConfig = {
  firstItemSelector: '[data-vlist-item-idx="0"]',
  firstItemIndex: '0',
  indexAttribute: 'data-vlist-item-idx',
  firstChildSelector: '[role="row"]:first-child [role="gridcell"]:first-child',
  waitUntilElementAppears: async (
    browser: CompassBrowser,
    selector: string
  ) => {
    const rowCount = await browser
      .$(`${selector} [role="grid"]`)
      .getAttribute('aria-rowcount');
    const length = await browser.$$(`${selector} [role="row"]`).length;
    return !!(rowCount && length);
  },
};

const treeConfig: ItemConfig = {
  firstItemSelector: '[aria-posinset="1"]',
  firstItemIndex: '1',
  indexAttribute: 'aria-posinset',
  firstChildSelector: '[role="treeitem"]:first-child',
  waitUntilElementAppears: async (
    browser: CompassBrowser,
    selector: string
  ) => {
    return (await browser.$$(`${selector} [role="treeitem"]`).length) > 0;
  },
};

export async function scrollToVirtualItem(
  browser: CompassBrowser,
  containerSelector: string,
  targetSelector: string,
  role: 'grid' | 'tree'
): Promise<boolean> {
  const config = role === 'tree' ? treeConfig : gridConfig;

  let found = false;

  await browser.$(containerSelector).waitForDisplayed();

  // it takes some time for the grid to initialise
  await browser.waitUntil(async () => {
    return await config.waitUntilElementAppears(browser, containerSelector);
  });

  // scroll to the top and return the height of the scrollbar area and the
  // scroll content
  const [scrollHeight, totalHeight] = await browser.execute(
    (selector, itemRole) => {
      const container = document.querySelector(selector);
      const scrollContainer =
        itemRole === 'tree'
          ? container?.firstChild?.firstChild
          : container?.firstChild;
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
    },
    containerSelector,
    role
  );

  if (scrollHeight === null || totalHeight === null) {
    return false;
  }

  // wait for the first element to be visible to make sure this went into effect
  await browser
    .$(`${containerSelector} ${config.firstItemSelector}`)
    .waitForDisplayed();

  let scrollTop = 0;
  let topIdx = config.firstItemIndex;

  await browser.waitUntil(async () => {
    await browser.pause(50);
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
        (selector, nextScrollTop, itemRole) => {
          const container = document.querySelector(selector);
          const scrollContainer =
            itemRole === 'tree'
              ? container?.firstChild?.firstChild
              : container?.firstChild;
          if (!scrollContainer) {
            return;
          }

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          scrollContainer.scrollTop = nextScrollTop;
        },
        containerSelector,
        scrollTop,
        role
      );

      // wait for the top one to be different to make sure that the grid updated
      await browser.waitUntil(async () => {
        const idx = await browser
          .$(`${containerSelector} ${config.firstChildSelector}`)
          .getAttribute(config.indexAttribute);

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
