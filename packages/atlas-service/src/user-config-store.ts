import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { assertAtlasUserConfig, type AtlasUserConfig } from './util';

const userConfig = new Map<string, AtlasUserConfig>();

export class AtlasUserConfigStore {
  constructor(
    private _fs: Pick<typeof fs, 'readFile' | 'writeFile' | 'mkdir'> = fs
  ) {}

  private getConfigDir() {
    return path.join(app.getPath('userData'), 'AtlasUserConfig');
  }

  async getUserConfig(id: string): Promise<AtlasUserConfig> {
    const cachedConfig = userConfig.get(id);
    if (cachedConfig) {
      return cachedConfig;
    }
    try {
      const config = JSON.parse(
        await this._fs.readFile(
          path.join(this.getConfigDir(), `${id}.json`),
          'utf8'
        )
      );
      assertAtlasUserConfig(config);
      userConfig.set(id, config);
      return config;
    } catch (err) {
      // No file probably means haven't created config yet, should be safe to
      // return default config instead
      if ((err as { code?: string }).code === 'ENOENT') {
        return { enabledAIFeature: false };
      }
      // Everything else is unexpected
      throw err;
    }
  }
  async updateUserConfig(
    id: string,
    config?: Partial<AtlasUserConfig>
  ): Promise<AtlasUserConfig> {
    await this._fs.mkdir(this.getConfigDir(), { recursive: true });
    const currentConfig = await this.getUserConfig(id);
    const newConfig = { ...currentConfig, ...config };
    await this._fs.writeFile(
      path.join(this.getConfigDir(), `${id}.json`),
      JSON.stringify(newConfig),
      'utf8'
    );
    userConfig.set(id, newConfig);
    return newConfig;
  }
  clearCache() {
    userConfig.clear();
  }
}
