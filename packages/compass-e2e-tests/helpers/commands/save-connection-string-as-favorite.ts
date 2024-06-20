import { UUID } from 'bson';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import { TEST_MULTIPLE_CONNECTIONS } from '../compass';

export async function saveConnectionStringAsFavorite(
  browser: CompassBrowser,
  connectionString: string,
  favoriteName?: string,
  color: `color${number}` | string = 'color1'
): Promise<string> {
  if (TEST_MULTIPLE_CONNECTIONS && color === 'color1') {
    color = 'Red';
  }

  favoriteName ??= new UUID().toHexString();
  await browser.setValueVisible(
    Selectors.ConnectionFormStringInput,
    connectionString
  );
  await browser.saveFavorite(favoriteName, color);

  return favoriteName;
}
