import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function resetConnectForm(browser: CompassBrowser): Promise<void> {
  await browser.clickVisible(Selectors.SidebarNewConnectionButton);

  const connectionTitle = await browser.$(Selectors.ConnectionTitle);
  await connectionTitle.waitUntil(async () => {
    return (await connectionTitle.getText()) === 'New Connection';
  });

  await browser.waitUntil(async () => {
    return (
      (await browser.getConnectFormConnectionString(true)) ===
      'mongodb://localhost:27017'
    );
  });
}
