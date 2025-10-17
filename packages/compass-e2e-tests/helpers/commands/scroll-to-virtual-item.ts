import type { CompassBrowser } from '../compass-browser';

type ItemConfig = {
  firstItemSelector: string;
  firstChildSelector: string;
  waitUntilElementAppears: (
    browser: CompassBrowser,
    selector: string
  ) => Promise<boolean>;
  // eslint-disable-next-line no-restricted-globals
  getScrollContainer: (parent: Element | null) => ChildNode | null | undefined;
};

const tableConfig: ItemConfig = {
  firstItemSelector: '#lg-table-row-0',
  firstChildSelector: 'tbody tr:first-child',
  waitUntilElementAppears: async (
    browser: CompassBrowser,
    selector: string
  ) => {
    const rowCount = await browser
      .$(`${selector} table`)
      .getAttribute('aria-rowcount');
    const length = await browser.$$(`${selector} tbody tr`).length;
    return !!(rowCount && length);
  },
  // eslint-disable-next-line no-restricted-globals
  getScrollContainer: (parent: Element | null) => {
    return parent?.firstChild;
  },
};

const treeConfig: ItemConfig = {
  firstItemSelector: '[aria-posinset="1"]',
  firstChildSelector: '[role="treeitem"]:first-child',
  waitUntilElementAppears: async (
    browser: CompassBrowser,
    selector: string
  ) => {
    return (await browser.$$(`${selector} [role="treeitem"]`).length) > 0;
  },
  // eslint-disable-next-line no-restricted-globals
  getScrollContainer: (parent: Element | null) => {
    return parent?.firstChild?.firstChild;
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

  // it takes some time for the list to initialise
  await browser.waitUntil(async () => {
    return await config.waitUntilElementAppears(browser, containerSelector);
  });

  // scroll to the top and return the height of the scrollbar area and the
  // scroll content
  const [scrollHeight, totalHeight] = await browser.execute(
    (selector, getScrollContainerString) => {
      // eslint-disable-next-line no-restricted-globals
      const container = document.querySelector(selector);
      const scrollContainer = eval(getScrollContainerString)(container);
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
    // Due to interprocess, we can not pass a function here.
    // So, we stringify it here and then eval to execute it
    config.getScrollContainer.toString()
  );

  console.log('scrollToVirtualItem', { scrollHeight, totalHeight });

  if (scrollHeight === null || totalHeight === null) {
    console.log(
      'scrollToVirtualItem',
      'scrollHeight === null || totalHeight === null',
      {
        scrollHeight,
        totalHeight,
      }
    );
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
      console.log('scrollToVirtualItem', 'found the item');
      return true;
    }

    // Browsers don't mind if we scroll past the last possible position. They
    // will only scroll up to the last possible point. Which is handy, because
    // then we don't have to try and calculate that pixel value.
    scrollTop += scrollHeight;

    if (scrollTop <= totalHeight) {
      // scroll for another screen
      await browser.execute(
        (selector, nextScrollTop, getScrollContainerString) => {
          // eslint-disable-next-line no-restricted-globals
          const container = document.querySelector(selector);
          const scrollContainer = eval(getScrollContainerString)(container);
          if (!scrollContainer) {
            console.log('scrollToVirtualItem', 'no scroll container');
            return;
          }

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
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
      console.log(
        'scrollToVirtualItem',
        'Scrolled to',
        scrollTop,
        'of',
        totalHeight
      );
      return false;
    } else {
      // stop because we got to the end and never found it
      console.log(
        'scrollToVirtualItem',
        'Reached the end of the list without finding the item'
      );
      return true;
    }
  });

  return found;
}
