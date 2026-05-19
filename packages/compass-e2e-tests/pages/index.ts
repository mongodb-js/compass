import type { CompassBrowser } from '../helpers/compass-browser.ts';
import type { CompassMode } from './base-page.ts';
import { SidebarPage } from './shared/sidebar/sidebar.page.ts';

export interface Pages {
  sidebar: SidebarPage;
  toJSON(): string;
}

export function buildPages(browser: CompassBrowser, mode: CompassMode): Pages {
  return {
    sidebar: new SidebarPage(browser, mode),
    // We're assigning pages to browser and webdriver will sometimes try to
    // serialize the browser object. To avoid this causing issues with circular
    // references, we're just providing a simple replacement for the pages key
    toJSON() {
      return '[Pages]';
    },
  };
}
