import path from 'path';
import { promises as fs } from 'fs';
import type { CompassBrowser } from '../compass-browser';

import type { StoredPreferences } from 'compass-preferences-model/src/preferences-schema';

export async function loadPreferences(
  browser: CompassBrowser
): Promise<StoredPreferences> {
  const userDataPath: string = await browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron');
    return ipcRenderer.invoke('compass:userDataPath');
  });

  const preferencesPath = path.join(
    userDataPath,
    'AppPreferences',
    'General.json'
  );
  const text = await fs.readFile(preferencesPath, 'utf8');
  return JSON.parse(text) as StoredPreferences;
}
