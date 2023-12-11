import { UserData, z } from '@mongodb-js/compass-user-data';

const AtlasUserConfigSchema = z.object({
  enabledAIFeature: z.boolean().default(false),
});

export type AtlasUserConfig = z.infer<typeof AtlasUserConfigSchema>;

const userConfig = new Map<string, AtlasUserConfig>();

export class AtlasUserConfigStore {
  private readonly userData: UserData<typeof AtlasUserConfigSchema>;
  constructor(basePath?: string) {
    this.userData = new UserData(AtlasUserConfigSchema, {
      subdir: 'AtlasUserConfig',
      basePath,
    });
  }

  async getUserConfig(id: string): Promise<AtlasUserConfig> {
    const cachedConfig = userConfig.get(id);
    if (cachedConfig) {
      return cachedConfig;
    }
    try {
      const config = await this.userData.readOne(id, {
        ignoreErrors: false,
      });

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
    const currentConfig = await this.getUserConfig(id);
    const newConfig = { ...currentConfig, ...config };
    await this.userData.write(id, newConfig);
    userConfig.set(id, newConfig);
    return newConfig;
  }
  clearCache() {
    userConfig.clear();
  }
}
