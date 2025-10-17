import Debug from 'debug';
import type { CompassBrowser } from '../compass-browser';
const debug = Debug('compass-e2e-tests:scroll-to-virtual-item');

type ItemConfig = {
  firstItemSelector: string;
  firstChildSelector: string;
  hasElementAppeared: (
    browser: CompassBrowser,
    selector: string
  ) => Promise<boolean>;
  // eslint-disable-next-line no-restricted-globals
  getScrollContainer: (parent: Element | null) => ChildNode | null | undefined;
  calculateTotalHeight: (
    browser: CompassBrowser,
    selector: string,
    getScrollContainerString: string
  ) => Promise<number | null>;
};

const tableConfig: ItemConfig = {
  firstItemSelector: '#lg-table-row-0',
  firstChildSelector: 'tbody tr:first-child',
  hasElementAppeared: async (browser: CompassBrowser, selector: string) => {
    const rowCount = await browser
      .$(`${selector} table`)
      .getAttribute('aria-rowcount');
    const length = await browser.$$(`${selector} tbody tr`).length;
    debug({ rowCount, length });
    return !!(rowCount && length);
  },
  // eslint-disable-next-line no-restricted-globals
  getScrollContainer: (parent: Element | null) => {
    // This is the element inside the leafygreen table that actually scrolls.
    // Unfortunately there is no better selector for it at the time of writing.
    return parent?.querySelector('[tabindex="0"]');
  },
  calculateTotalHeight: async (browser: CompassBrowser, selector: string) => {
    return await browser.$(`${selector} table`).getSize('height');
  },
};

const treeConfig: ItemConfig = {
  firstItemSelector: '[aria-posinset="1"]',
  firstChildSelector: '[role="treeitem"]:first-child',
  hasElementAppeared: async (browser: CompassBrowser, selector: string) => {
    return (await browser.$$(`${selector} [role="treeitem"]`).length) > 0;
  },
  // eslint-disable-next-line no-restricted-globals
  getScrollContainer: (parent: Element | null) => {
    return parent?.firstChild?.firstChild;
  },
  calculateTotalHeight: async (
    browser: CompassBrowser,
    selector: string,
    getScrollContainerString: string
  ) => {
    return await browser.execute(
      (selector, getScrollContainerString) => {
        // eslint-disable-next-line no-restricted-globals
        const container = document.querySelector(selector);
        const scrollContainer = eval(getScrollContainerString)(container);
        const heightContainer = scrollContainer?.firstChild;
        if (!heightContainer) {
          return null;
        }

        return heightContainer.offsetHeight;
      },
      selector,
      getScrollContainerString
    );
  },
};

export async function scrollToVirtualItem(
  browser: CompassBrowser,
  containerSelector: string,
  targetSelector: string,
  role: 'table' | 'tree'
): Promise<boolean> {
  const config = role === 'tree' ? treeConfig : tableConfig;

  let found = false;

  await browser.$(containerSelector).waitForDisplayed();

  debug(await browser.$(containerSelector).getSize());

  // it takes some time for the list to initialise
  await browser.waitUntil(async () => {
    return await config.hasElementAppeared(browser, containerSelector);
  });

  // scroll to the top
  await browser.execute(
    (selector, getScrollContainerString) => {
      // eslint-disable-next-line no-restricted-globals
      const container = document.querySelector(selector);
      const scrollContainer = eval(getScrollContainerString)(container);
      scrollContainer.scrollTop = 0;
    },
    containerSelector,
    config.getScrollContainer.toString()
  );

  const scrollHeight = parseInt(
    await browser.$(containerSelector).getProperty('clientHeight'),
    10
  );
  const totalHeight = await config.calculateTotalHeight(
    browser,
    containerSelector,
    config.getScrollContainer.toString()
  );

  debug({ scrollHeight, totalHeight });

  if (scrollHeight === null || totalHeight === null) {
    debug('scrollHeight === null || totalHeight === null', {
      scrollHeight,
      totalHeight,
    });
    return false;
  }

  // wait for the first element to be visible to make sure this went into effect
  await browser
    .$(`${containerSelector} ${config.firstItemSelector}`)
    .waitForDisplayed();

  let scrollTop = 0;

  await browser.waitUntil(async () => {
    await browser.pause(100);
    const targetElement = browser.$(targetSelector);
    if (await targetElement.isExisting()) {
      await targetElement.waitForDisplayed();
      await targetElement.scrollIntoView();
      // the item is now visible, so stop scrolling
      found = true;
      debug('found the item');

      return true;
    }

    // Browsers don't mind if we scroll past the last possible position. They
    // will only scroll up to the last possible point. Which is handy, because
    // then we don't have to try and calculate that pixel value.
    scrollTop += scrollHeight;

    if (scrollTop <= totalHeight) {
      debug('scrolling to ', scrollTop);

      // scroll for another screen
      await browser.execute(
        (selector, nextScrollTop, getScrollContainerString) => {
          // eslint-disable-next-line no-restricted-globals
          const container = document.querySelector(selector);
          const scrollContainer = eval(getScrollContainerString)(container);
          if (!scrollContainer) {
            debug('no scroll container');
            return;
          }

          scrollContainer.scrollTop = nextScrollTop;
        },
        containerSelector,
        scrollTop,
        // Due to interprocess, we can not pass a function here.
        // So, we stringify it here and then eval to execute it
        config.getScrollContainer.toString()
      );
      // wait for dom to render
      await browser.waitForAnimations(
        `${containerSelector} ${config.firstChildSelector}`
      );
      debug('Scrolled to', scrollTop, 'of', totalHeight);
      return false;
    } else {
      // stop because we got to the end and never found it
      debug('Reached the end of the list without finding the item');
      return true;
    }
  });

  return found;
}
