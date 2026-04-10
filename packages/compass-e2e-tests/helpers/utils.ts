import { type ChainablePromiseElement } from 'webdriverio';
import { type CompassBrowser } from './compass-browser.ts';

export function resolveElement(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement
) {
  return typeof selector === 'string' ? browser.$(selector) : selector;
}
