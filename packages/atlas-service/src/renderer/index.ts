import type { AtlasHttpApiClient } from './atlas-http-client';
import {
  ErrorAwareAtlasHttpApiClient,
  CompassAtlasHttpApiClient,
} from './atlas-http-client';
import type { AtlasAuthClient } from './atlas-auth-client';
import { CompassAtlasAuthApiClient } from './atlas-auth-client';
import { AtlasAiClient } from './atlas-ai-client';
import {
  isAIFeatureEnabled,
  type PreferencesAccess,
} from 'compass-preferences-model';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

export async function createAiClient(
  httpClient: AtlasHttpApiClient,
  preferencesAccess: Pick<PreferencesAccess, 'getUserId' | 'savePreferences'>,
  logger: LoggerAndTelemetry
) {
  const client = new AtlasAiClient(
    new ErrorAwareAtlasHttpApiClient(httpClient),
    preferencesAccess,
    logger
  );
  await client.setupAIAccess();
  return client;
}

export async function throwIfAINotEnabled(
  preferences: PreferencesAccess,
  atlasAuthClient: AtlasAuthClient
) {
  if (!isAIFeatureEnabled(preferences.getPreferences())) {
    throw new Error(
      "Compass' AI functionality is not currently enabled. Please try again later."
    );
  }
  // Only throw if we actually have userInfo / logged in. Otherwise allow
  // request to fall through so that we can get a proper network error
  if ((await atlasAuthClient.getCurrentUser()).enabledAIFeature === false) {
    throw new Error("Can't use AI before accepting terms and conditions");
  }
}

export { AtlasSignIn } from '../components/atlas-signin';
export { AtlasServiceError } from '../util';
export type { AtlasUserConfig } from '../user-config-store';
export type { AtlasUserInfo, IntrospectInfo, Token } from '../util';
export type { AtlasHttpApiClient };
export { AtlasAiClient, CompassAtlasAuthApiClient, CompassAtlasHttpApiClient };
export type { AtlasAuthClient };
