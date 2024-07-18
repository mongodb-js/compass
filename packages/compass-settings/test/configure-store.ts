import type {
  SettingsPluginServices,
  SettingsThunkExtraArgs,
} from '../src/stores';
import { configureStore as _configureStore } from '../src/stores';
import { ReadOnlyPreferenceAccess } from 'compass-preferences-model/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { AtlasAuthService } from '@mongodb-js/atlas-service/provider';

class MockAtlasAuthService extends AtlasAuthService {
  isAuthenticated() {
    return Promise.resolve(true);
  }
  async getUserInfo() {
    return Promise.resolve({} as any);
  }
  async signIn() {
    return Promise.resolve({} as any);
  }
  async signOut() {
    return Promise.resolve();
  }
  async getAuthHeaders() {
    return Promise.resolve({});
  }
}

export default function configureStore(
  options: Partial<SettingsPluginServices & SettingsThunkExtraArgs> = {}
) {
  const preferences = new ReadOnlyPreferenceAccess();
  const logger = createNoopLogger();
  const atlasAuthService = new MockAtlasAuthService();
  return _configureStore({
    preferences,
    logger,
    atlasAuthService: options.atlasAuthService ?? atlasAuthService,
    ...options,
  } as any);
}
