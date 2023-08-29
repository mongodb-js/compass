import keytar from 'keytar';
import { app } from 'electron';

export const SECRET_STORE_KEY = 'AtlasLoginOIDCPluginState';

export class SecretStore {
  async getItem(key: string): Promise<string | undefined> {
    try {
      if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
        throw new Error('Unsupported environment');
      }
      const appName = app.getName();
      return (await keytar.getPassword(appName, key)) ?? undefined;
    } catch {
      return undefined;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
        throw new Error('Unsupported environment');
      }
      const appName = app.getName();
      return await keytar.setPassword(appName, key, value);
    } catch {
      return;
    }
  }
}
