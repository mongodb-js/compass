import type { AtlasUserInfo } from './util';
import type { AtlasUserConfig } from './user-config-store';
import { AtlasAuthService as AtlasAuthServiceRenderer } from './renderer';

export interface AtlasUserData {
  getUser(): Promise<AtlasUserInfo>;
  updateConfig(config: AtlasUserConfig): Promise<void>;
}

export class CompassAtlasUserData implements AtlasUserData {
  private atlasRenderer = new AtlasAuthServiceRenderer();
  getUser() {
    return this.atlasRenderer.getUserInfo({});
  }
  updateConfig(config: AtlasUserConfig) {
    return this.atlasRenderer.updateAtlasUserConfig({ config });
  }
}
