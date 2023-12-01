import { UserData, z } from '@mongodb-js/compass-user-data';
import { safeStorage } from 'electron';

const AtlasPluginStateSchema = z.string().optional();

export class SecretStore {
  private readonly userData: UserData<typeof AtlasPluginStateSchema>;
  private readonly fileName = 'AtlasPluginState';
  constructor(basePath?: string) {
    this.userData = new UserData(AtlasPluginStateSchema, {
      subdir: 'AtlasState',
      basePath,
    });
  }

  async getState(): Promise<string | undefined> {
    try {
      if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
        throw new Error('Unsupported environment');
      }
      const data = await this.userData.readOne(this.fileName);
      if (!data) {
        return undefined;
      }
      return safeStorage.decryptString(Buffer.from(data, 'base64'));
    } catch {
      return undefined;
    }
  }

  async setState(value: string): Promise<void> {
    try {
      if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
        throw new Error('Unsupported environment');
      }
      const data = safeStorage.encryptString(value).toString('base64');
      await this.userData.write(this.fileName, data);
    } catch {
      return;
    }
  }
}
