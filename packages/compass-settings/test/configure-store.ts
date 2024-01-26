import { configureStore as _configureStore } from '../src/stores';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { spy, stub } from 'sinon';

type ConfigureStoreOptions = typeof _configureStore extends (
  ...args: infer T
) => any
  ? T
  : never;

export async function configureStore(
  options: Partial<ConfigureStoreOptions[0]> = {}
) {
  const atlasService = {
    on: spy(),
    ...(options.atlasService ?? {}),
  } as any;
  const preferences = await createSandboxFromDefaultPreferences();
  return _configureStore({
    logger: stub() as any,
    preferences,
    ...options,
    atlasService,
  });
}
