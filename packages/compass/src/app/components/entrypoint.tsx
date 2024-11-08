import React, { useRef } from 'react';
import { AppRegistryProvider } from 'hadron-app-registry';
import { defaultPreferencesInstance } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { CompassAtlasAuthService } from '@mongodb-js/atlas-service/renderer';
import {
  AtlasAuthServiceProvider,
  AtlasServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import { AtlasAiServiceProvider } from '@mongodb-js/compass-generative-ai/provider';
import {
  CompassFavoriteQueryStorage,
  CompassPipelineStorage,
  CompassRecentQueryStorage,
} from '@mongodb-js/my-queries-storage';
import {
  PipelineStorageProvider,
  FavoriteQueryStorageProvider,
  RecentQueryStorageProvider,
  type FavoriteQueryStorageAccess,
  type RecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage/provider';
import { createLogger } from '@mongodb-js/compass-logging';
import { LoggerProvider } from '@mongodb-js/compass-logging/provider';
import { TelemetryProvider } from '@mongodb-js/compass-telemetry/provider';
import { getAppName, getAppVersion } from '@mongodb-js/compass-utils';
import Home from './home';
import {
  type TelemetryServiceOptions,
  createIpcSendTrack,
} from '@mongodb-js/compass-telemetry';

const WithPreferencesAndLoggerProviders: React.FC = ({ children }) => {
  const loggerProviderValue = useRef({
    createLogger,
  });
  const preferencesProviderValue = useRef(defaultPreferencesInstance);
  const telemetryOptions = useRef<TelemetryServiceOptions>({
    sendTrack: createIpcSendTrack(),
    preferences: defaultPreferencesInstance,
  });
  return (
    <PreferencesProvider value={preferencesProviderValue.current}>
      <LoggerProvider value={loggerProviderValue.current}>
        <TelemetryProvider options={telemetryOptions.current}>
          {children}
        </TelemetryProvider>
      </LoggerProvider>
    </PreferencesProvider>
  );
};

export const WithAtlasProviders: React.FC = ({ children }) => {
  const authService = useRef(new CompassAtlasAuthService());
  return (
    <AtlasAuthServiceProvider value={authService.current}>
      <AtlasServiceProvider
        options={{
          defaultHeaders: {
            'User-Agent': `${getAppName()}/${getAppVersion()}`,
          },
        }}
      >
        <AtlasAiServiceProvider apiURLPreset="admin-api">
          {children}
        </AtlasAiServiceProvider>
      </AtlasServiceProvider>
    </AtlasAuthServiceProvider>
  );
};

export const WithStorageProviders: React.FC = ({ children }) => {
  const pipelineStorage = useRef(new CompassPipelineStorage());
  const favoriteQueryStorage = useRef<FavoriteQueryStorageAccess>({
    getStorage(options) {
      return new CompassFavoriteQueryStorage(options);
    },
  });
  const recentQueryStorage = useRef<RecentQueryStorageAccess>({
    getStorage(options) {
      return new CompassRecentQueryStorage(options);
    },
  });
  return (
    <PipelineStorageProvider value={pipelineStorage.current}>
      <FavoriteQueryStorageProvider value={favoriteQueryStorage.current}>
        <RecentQueryStorageProvider value={recentQueryStorage.current}>
          {children}
        </RecentQueryStorageProvider>
      </FavoriteQueryStorageProvider>
    </PipelineStorageProvider>
  );
};

export const CompassElectron = (props: React.ComponentProps<typeof Home>) => {
  return (
    <WithPreferencesAndLoggerProviders>
      <WithAtlasProviders>
        <WithStorageProviders>
          <AppRegistryProvider scopeName="Application Root">
            <Home {...props} />
          </AppRegistryProvider>
        </WithStorageProviders>
      </WithAtlasProviders>
    </WithPreferencesAndLoggerProviders>
  );
};
