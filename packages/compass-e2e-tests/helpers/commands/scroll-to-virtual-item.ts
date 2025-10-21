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

async function scrollToPosition(
  browser: CompassBrowser,
  containerSelector: string,
  role: 'table' | 'tree',
  scrollPosition: number
) {
  const config = role === 'tree' ? treeConfig : tableConfig;

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
    scrollPosition,
    // Due to interprocess, we can not pass a function here.
    // So, we stringify it here and then eval to execute it
    config.getScrollContainer.toString()
  );

  // TODO: find a better way to wait for the scroll to have taken effect
  await browser.pause(1000);
}

let debugId = 0;

export async function scrollToVirtualItem(
  browser: CompassBrowser,
  containerSelector: string,
  targetSelector: string,
  role: 'table' | 'tree'
): Promise<boolean> {
  debugId += 1;

  const config = role === 'tree' ? treeConfig : tableConfig;

  let found = false;

  await browser.$(containerSelector).waitForDisplayed();

  debug(debugId, await browser.$(containerSelector).getSize());

  // it takes some time for the list to initialise
  await browser.waitUntil(async () => {
    return await config.hasElementAppeared(browser, containerSelector);
  });

  // scroll to the top
  await scrollToPosition(browser, containerSelector, 'table', 0);

  const visibleHeight = parseInt(
    await browser.$(containerSelector).getProperty('clientHeight'),
    10
  );
  // scroll by a quarter of the visible height to give things a chance to appear
  const scrollHeight = visibleHeight; // / 4;

  let totalHeight = await config.calculateTotalHeight(
    browser,
    containerSelector,
    config.getScrollContainer.toString()
  );

  debug(debugId, { scrollHeight, totalHeight });

  if (scrollHeight === null || totalHeight === null) {
    debug(debugId, 'scrollHeight === null || totalHeight === null', {
      scrollHeight,
      totalHeight,
    });
    return false;
  }

  // Add one more scrollHeight to make sure we reach the end. Due to the sticky
  // header in the table case we seem to lose a few rows at the end. There's no
  // real harm in trying to scroll beyond the end - it will either have found
  // the item already and exited the loop or worst case it will attempt to
  // scroll one more time and then still not find the item.
  totalHeight += scrollHeight;

  // wait for the first element to be visible to make sure this went into effect
  await browser
    .$(`${containerSelector} ${config.firstItemSelector}`)
    .waitForDisplayed();

  let scrollTop = 0;

  await browser.screenshot(`scroll-${debugId}-0.png`);

  await browser.waitUntil(async () => {
    await browser.pause(100);
    const targetElement = browser.$(targetSelector);
    if (await targetElement.isExisting()) {
      debug(debugId, 'found the item', targetSelector, 'at', scrollTop);

      await targetElement.waitForDisplayed();
      if (role === 'tree') {
        await targetElement.scrollIntoView();
      } else {
        // element.scrollIntoView() seems to completely mess up the virtual
        // table, but
        const y = await targetElement.getLocation('y');
        // if the element is off-screen, scroll one more screen. It is actually
        // quite likely that the element will start to exist while it is still
        // off screen due to overscan, so we do still have to scroll to have it
        // visible.
        if (y > scrollHeight) {
          // TODO: maybe subtract the header height just in case so that we
          // don't end up with the row under the sticky header?
          const scrollAmount = scrollHeight;
          debug(debugId, 'scrolling to y position', scrollTop + scrollAmount);
          await scrollToPosition(
            browser,
            containerSelector,
            role,
            scrollTop + scrollAmount
          );
        }
      }
      // the item is now visible, so stop scrolling
      found = true;

      await browser.screenshot(`found-${debugId}.png`);

      return true;
    }

    // Browsers don't mind if we scroll past the last possible position. They
    // will only scroll up to the last possible point. Which is handy, because
    // then we don't have to try and calculate that pixel value.
    scrollTop += scrollHeight;

    if (scrollTop <= totalHeight) {
      debug(debugId, 'scrolling to ', scrollTop);

      // scroll for another screen
      await scrollToPosition(browser, containerSelector, role, scrollTop);

      // wait for dom to render
      await browser.waitForAnimations(
        `${containerSelector} ${config.firstChildSelector}`
      );

      debug(debugId, 'Scrolled to', scrollTop, 'of', totalHeight);

      await browser.screenshot(`scroll-${debugId}-${scrollTop}.png`);

      return false;
    } else {
      // stop because we got to the end and never found it
      debug(debugId, 'Reached the end of the list without finding the item');
      return true;
    }
  });

  return found;
}
