import type {
  AggregationsPluginServices,
  ConfigureStoreOptions,
} from '../src/stores/store';
import { mockDataService } from './mocks/data-service';
import type { RenderPluginWithConnectionsResult } from '@mongodb-js/testing-library-compass';
import { createPluginTestHelpers } from '@mongodb-js/testing-library-compass';
import { CompassAggregationsPlugin } from '../src/index';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import React from 'react';
import { PipelineStorageProvider } from '@mongodb-js/my-queries-storage/provider';
import {
  CompassExperimentationProvider,
  type ExperimentTestGroup,
  type ExperimentTestName,
} from '@mongodb-js/compass-telemetry';

const noopAsyncResult = {
  asyncStatus: null,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
} as const;

/**
 * Wraps a React element with a mock experimentation provider.
 *
 * @param ui - The React element to wrap.
 * @param variant - The experiment variant group to assign to every experiment
 *   queried, `null` to simulate a user not assigned to any variant
 *   (control/default), or a map of experiment test name to variant to assign
 *   different variants per experiment (e.g. to simulate a user enrolled in
 *   multiple experiments at once).
 */
export function wrapWithExperimentProvider(
  ui: React.ReactElement,
  variant:
    | ExperimentTestGroup
    | null
    | Partial<Record<ExperimentTestName, ExperimentTestGroup>>
): React.ReactElement {
  const getVariant = (
    testName: ExperimentTestName
  ): ExperimentTestGroup | null =>
    variant && typeof variant === 'object'
      ? variant[testName] ?? null
      : variant;

  return React.createElement(
    CompassExperimentationProvider,
    {
      useAssignment: (testName: ExperimentTestName) => {
        const resolvedVariant = getVariant(testName);
        return {
          assignment: resolvedVariant
            ? { assignmentData: { variant: resolvedVariant } }
            : null,
          ...noopAsyncResult,
          asyncStatus: 'SUCCESS',
        };
      },
      useTrackInSample: () => noopAsyncResult,
      assignExperiment: () => Promise.resolve(null),
      getAssignment: (testName: ExperimentTestName) => {
        const resolvedVariant = getVariant(testName);
        return Promise.resolve(
          resolvedVariant
            ? { assignmentData: { variant: resolvedVariant } }
            : null
        );
      },
    } as any,
    ui
  );
}

export class MockAtlasAiService {
  async getAggregationFromUserInput() {
    return Promise.resolve({});
  }
  async getQueryFromUserInput() {
    return Promise.resolve({});
  }
  async ensureAiFeatureAccess() {
    return Promise.resolve();
  }
}

function getMockedPluginArgs(
  initialProps: Partial<ConfigureStoreOptions> = {},
  dataService: Partial<DataService> = mockDataService(),
  services: Partial<AggregationsPluginServices> = {}
) {
  const atlasAiService = new MockAtlasAiService();
  return [
    CompassAggregationsPlugin.provider.withMockServices({
      atlasAiService,
      collection: {
        fetchMetadata: () => ({}),
        toJSON: () => ({}),
        on: () => {},
        removeListener: () => {},
      } as any,
      ...services,
    } as any),
    {
      namespace: 'test.test',
      isReadonly: false,
      isTimeSeries: false,
      isClustered: false,
      isFLE: false,
      isSearchIndexesSupported: false,
      isDataLake: false,
      isAtlas: false,
      serverVersion: '4.0.0',
      ...initialProps,
    },
    {
      id: 'TEST',
      connectionOptions: {
        connectionString: 'mongodb://localhost:27020',
      },
    },
    {
      connectFn() {
        return dataService;
      },
      preferences: services.preferences
        ? services.preferences.getPreferences()
        : undefined,
    },
  ] as const;
}

/**
 * @deprecated use renderWithStore and test store through UI instead
 */
export default function configureStore(
  ...args: Parameters<typeof getMockedPluginArgs>
) {
  const [Plugin, initialProps, connectionInfo, renderOptions] =
    getMockedPluginArgs(...args);
  const { activatePluginWithActiveConnection } =
    createPluginTestHelpers(Plugin);
  return activatePluginWithActiveConnection(
    connectionInfo,
    initialProps,
    renderOptions
  );
}

export function renderWithStore(
  ui: React.ReactElement,
  ...args: Parameters<typeof configureStore>
): Promise<
  RenderPluginWithConnectionsResult<typeof CompassAggregationsPlugin.provider>
> {
  ui = args[2]?.pipelineStorage
    ? React.createElement(PipelineStorageProvider, {
        value: args[2].pipelineStorage,
        children: ui,
      })
    : ui;

  const [Plugin, initialProps, connectionInfo, renderOptions] =
    getMockedPluginArgs(...args);
  const { renderWithActiveConnection } = createPluginTestHelpers(
    Plugin,
    initialProps
  );
  return renderWithActiveConnection(ui, connectionInfo, renderOptions);
}
