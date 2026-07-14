import type { CompassBrowser } from '../helpers/compass-browser.ts';

export type CompassMode = 'electron' | 'web';

export abstract class BasePage {
  protected readonly browser: CompassBrowser;
  protected readonly mode: CompassMode;

  constructor(browser: CompassBrowser, mode: CompassMode) {
    this.browser = browser;
    this.mode = mode;
  }
}
