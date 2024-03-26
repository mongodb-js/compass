import { UUID } from 'bson';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function saveConnectionStringAsFavorite(
  browser: CompassBrowser,
  connectionString: string,
  favoriteName?: string,
  color: `color${number}` = 'color1'
): Promise<string> {
  favoriteName ??= new UUID().toHexString();
  await browser.setValueVisible(
    Selectors.ConnectionStringInput,
    connectionString
  );
  await browser.saveFavorite(favoriteName, color);

  // give it time to actually save before we disconnect or use it
  await browser.pause(1000);

  return favoriteName;
}
