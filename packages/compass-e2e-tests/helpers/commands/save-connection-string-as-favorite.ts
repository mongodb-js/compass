import { UUID } from 'bson';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

// TODO(COMPASS-8023): Provide a counterpart `browser.saveConnection` method to
// be able to edit existing connection
export async function saveConnectionStringAsFavorite(
  browser: CompassBrowser,
  connectionString: string,
  favoriteName?: string,
  color = 'Green'
): Promise<string> {
  // open the connection modal so we can fill in the connection string
  await browser.clickVisible(Selectors.Multiple.SidebarNewConnectionButton);
  favoriteName ??= new UUID().toHexString();
  await browser.setValueVisible(
    Selectors.ConnectionFormStringInput,
    connectionString
  );
  await browser.saveFavorite(favoriteName, color);

  return favoriteName;
}
