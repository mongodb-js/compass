import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export const isLeafygreenEnabled = async (
  browser: CompassBrowser,
  el: string | ChainablePromiseElement
) => {
  el = typeof el === 'string' ? browser.$(el) : el;
  return (
    (await el.getAttribute('aria-disabled')) !== 'true' &&
    (await el.isEnabled())
  );
};

export const waitForLeafygreenEnabled = async (
  browser: CompassBrowser,
  el: string | ChainablePromiseElement
) => {
  return await browser.waitUntil(async () => {
    return await isLeafygreenEnabled(browser, el);
  });
};
