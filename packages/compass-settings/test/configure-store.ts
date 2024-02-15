import type {
  SettingsPluginServices,
  SettingsThunkExtraArgs,
} from '../src/stores';
import { configureStore as _configureStore } from '../src/stores';
import { ReadOnlyPreferenceAccess } from 'compass-preferences-model/provider';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { AtlasService } from '@mongodb-js/atlas-service/renderer';
export default function configureStore(
  options: Partial<SettingsPluginServices & SettingsThunkExtraArgs> = {}
) {
  const preferences = new ReadOnlyPreferenceAccess();
  const logger = createNoopLoggerAndTelemetry();
  const atlasService =
    options.atlasService ||
    new AtlasService(
      {
        getUser() {
          return Promise.resolve({} as any);
        },
        updateConfig() {
          return Promise.resolve();
        },
      },
      preferences,
      logger
    );
  return _configureStore({
    preferences,
    logger,
    ...options,
    atlasService,
  });
}
