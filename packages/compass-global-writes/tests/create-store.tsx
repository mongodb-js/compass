import React from 'react';
import type {
  GlobalWritesPluginOptions,
  GlobalWritesPluginServices,
} from '../src/store';
import { activateGlobalWritesPlugin } from '../src/store';
import { createActivateHelpers } from 'hadron-app-registry';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type {
  ConnectionInfo,
  ConnectionInfoRef,
} from '@mongodb-js/compass-connections/provider';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { Provider } from 'react-redux';
import { renderWithActiveConnection } from '@mongodb-js/testing-library-compass';

import clusterApiResponse from './cluster-api-response.json';

const atlasService = {
  cloudEndpoint: (p: string) => {
    return `https://example.com/${p}`;
  },
  authenticatedFetch: (url: RequestInfo | URL) => {
    if (url.toString().endsWith('nds/clusters/Project0/Cluster0')) {
      return Promise.resolve({
        status: 200,
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => clusterApiResponse,
      } as Response);
    }
    return Promise.resolve({
      status: 200,
      // eslint-disable-next-line @typescript-eslint/require-await
      json: async () => ({}),
    } as Response);
  },
} as unknown as AtlasService;

export const setupStore = (
  options: Partial<GlobalWritesPluginOptions> = {},
  services: Partial<GlobalWritesPluginServices> = {}
) => {
  const connectionInfoRef = {
    current: {
      id: 'TEST',
      atlasMetadata: {
        clusterName: 'Cluster0',
        clusterType: 'GEOSHARDED',
        projectId: 'Project0',
      },
    },
  } as ConnectionInfoRef;

  return activateGlobalWritesPlugin(
    {
      namespace: 'airbnb.listings',
      ...options,
    },
    {
      logger: createNoopLogger('TEST'),
      track: createNoopTrack(),
      connectionInfoRef,
      ...services,
      atlasService: {
        ...atlasService,
        ...services.atlasService,
      } as AtlasService,
    },
    createActivateHelpers()
  ).store;
};

export const renderWithStore = (
  component: JSX.Element,
  {
    services = {},
    options = {},
    connectionInfo = {
      id: 'testConnection',
      connectionOptions: {
        connectionString: 'mongodb://localhost',
      },
    },
  }: {
    services?: Partial<GlobalWritesPluginServices>;
    options?: Partial<GlobalWritesPluginOptions>;
    connectionInfo?: ConnectionInfo;
  } = {}
) => {
  const store = setupStore(options, services);
  return renderWithActiveConnection(
    <Provider store={store}>{component}</Provider>,
    connectionInfo
  );
};
