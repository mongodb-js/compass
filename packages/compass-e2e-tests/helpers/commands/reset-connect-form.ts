import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function resetConnectForm(browser: CompassBrowser): Promise<void> {
  await browser.clickVisible(Selectors.SidebarNewConnectionButton);

  await browser.waitUntil(async () => {
    return (
      (await browser.$(Selectors.ConnectionStringInput).getValue()) ===
      'mongodb://localhost:27017'
    );
  });
}
