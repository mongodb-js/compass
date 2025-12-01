import React from 'react';
import { AppRegistryProvider } from '@mongodb-js/compass-app-registry';
import { defaultPreferencesInstance } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { CompassAtlasAuthService } from '@mongodb-js/atlas-service/renderer';
import {
  AtlasAuthServiceProvider,
  AtlasServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import { AtlasAiServiceProvider } from '@mongodb-js/compass-generative-ai/provider';
import {
  createElectronRecentQueryStorage,
  createElectronFavoriteQueryStorage,
  createElectronPipelineStorage,
} from '@mongodb-js/my-queries-storage/electron';
import {
  PipelineStorageProvider,
  FavoriteQueryStorageProvider,
  RecentQueryStorageProvider,
  type FavoriteQueryStorageAccess,
  type RecentQueryStorageAccess,
  type PipelineStorageAccess,
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
import { DataModelStorageServiceProviderElectron } from '@mongodb-js/compass-data-modeling/renderer';
import { WorkspacesStorageServiceProviderDesktop } from '@mongodb-js/compass-workspaces';
import { useInitialValue } from '@mongodb-js/compass-components';

const WithPreferencesAndLoggerProviders: React.FC = ({ children }) => {
  const loggerProviderValue = useInitialValue({
    createLogger,
  });
  const preferencesProviderValue = useInitialValue(defaultPreferencesInstance);
  const telemetryOptions = useInitialValue<TelemetryServiceOptions>({
    sendTrack: createIpcSendTrack(),
    preferences: defaultPreferencesInstance,
  });
  return (
    <PreferencesProvider value={preferencesProviderValue}>
      <LoggerProvider value={loggerProviderValue}>
        <TelemetryProvider options={telemetryOptions}>
          {children}
        </TelemetryProvider>
      </LoggerProvider>
    </PreferencesProvider>
  );
};

export const WithAtlasProviders: React.FC = ({ children }) => {
  const authService = useInitialValue(() => new CompassAtlasAuthService());
  return (
    <AtlasAuthServiceProvider value={authService}>
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
  const pipelineStorage = useInitialValue<PipelineStorageAccess>({
    getStorage(options) {
      return createElectronPipelineStorage({ basepath: options?.basePath });
    },
  });
  const favoriteQueryStorage = useInitialValue<FavoriteQueryStorageAccess>({
    getStorage(options) {
      return createElectronFavoriteQueryStorage({
        basepath: options?.basepath,
      });
    },
  });
  const recentQueryStorage = useInitialValue<RecentQueryStorageAccess>({
    getStorage(options) {
      return createElectronRecentQueryStorage({ basepath: options?.basepath });
    },
  });

  return (
    <PipelineStorageProvider value={pipelineStorage}>
      <FavoriteQueryStorageProvider value={favoriteQueryStorage}>
        <RecentQueryStorageProvider value={recentQueryStorage}>
          <WorkspacesStorageServiceProviderDesktop>
            <DataModelStorageServiceProviderElectron>
              {children}
            </DataModelStorageServiceProviderElectron>
          </WorkspacesStorageServiceProviderDesktop>
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
