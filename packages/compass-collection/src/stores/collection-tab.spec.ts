import type { CollectionTabOptions } from './collection-tab';
import { activatePlugin } from './collection-tab';
import { selectTab } from '../modules/collection-tab';
import * as collectionTabModule from '../modules/collection-tab';
import { waitFor } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import AppRegistry from '@mongodb-js/compass-app-registry';
import { expect } from 'chai';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { experimentationServiceLocator } from '@mongodb-js/compass-telemetry/provider';
import type { connectionInfoRefLocator } from '@mongodb-js/compass-connections/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { ReadOnlyPreferenceAccess } from 'compass-preferences-model/provider';
import { ExperimentTestName } from '@mongodb-js/compass-telemetry/provider';
import { type CollectionMetadata } from 'mongodb-collection-model';

const defaultMetadata = {
  namespace: 'test.foo',
  isReadonly: false,
  isTimeSeries: false,
  isClustered: false,
  isFLE: false,
  isSearchIndexesSupported: false,
  sourceName: 'test.bar',
};

const defaultTabOptions = {
  tabId: 'workspace-tab-id',
  namespace: defaultMetadata.namespace,
};

const mockAtlasConnectionInfo = {
  current: {
    id: 'test-connection',
    title: 'Test Connection',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
    atlasMetadata: {
      clusterName: 'test-cluster',
      projectId: 'test-project',
      orgId: 'test-org',
      clusterUniqueId: 'test-cluster-unique-id',
      clusterType: 'REPLICASET' as const,
      clusterState: 'IDLE' as const,
      metricsId: 'test-metrics-id',
      metricsType: 'replicaSet' as const,
      regionalBaseUrl: null,
      instanceSize: 'M10',
      supports: {
        globalWrites: false,
        rollingIndexes: true,
      },
    },
  },
};

describe('Collection Tab Content store', function () {
  const sandbox = Sinon.createSandbox();

  const localAppRegistry = sandbox.spy(new AppRegistry());
  const analyzeCollectionSchemaStub = sandbox
    .stub(collectionTabModule, 'analyzeCollectionSchema')
    .returns(async () => {});
  const dataService = {} as any;
  const atlasAiService = {} as any;
  let store: ReturnType<typeof activatePlugin>['store'];
  let deactivate: ReturnType<typeof activatePlugin>['deactivate'];

  const configureStore = async (
    options: Partial<CollectionTabOptions> = {},
    workspaces: Partial<ReturnType<typeof workspacesServiceLocator>> = {},
    experimentationServices: Partial<
      ReturnType<typeof experimentationServiceLocator>
    > = {},
    connectionInfoRef: Partial<
      ReturnType<typeof connectionInfoRefLocator>
    > = {},
    logger = createNoopLogger('COMPASS-COLLECTION-TEST'),
    preferences = new ReadOnlyPreferenceAccess({
      enableGenAIFeatures: true,
      enableGenAIFeaturesAtlasOrg: true,
      cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
    }),
    collectionMetadata: Partial<CollectionMetadata> = defaultMetadata
  ) => {
    const mockCollection = {
      _id: collectionMetadata.namespace,
      fetchMetadata() {
        return Promise.resolve(collectionMetadata);
      },
      toJSON() {
        return this;
      },
    };
    ({ store, deactivate } = activatePlugin(
      {
        ...defaultTabOptions,
        ...options,
      },
      {
        dataService,
        localAppRegistry,
        collection: mockCollection as any,
        workspaces: workspaces as any,
        experimentationServices: experimentationServices as any,
        connectionInfoRef: connectionInfoRef as any,
        logger,
        preferences,
        atlasAiService,
      },
      { on() {}, cleanup() {} } as any
    ));
    await waitFor(() => {
      expect(store.getState())
        .to.have.property('metadata')
        .deep.eq(collectionMetadata);
    });
    return store;
  };

  afterEach(function () {
    sandbox.resetHistory();
    deactivate();
  });

  describe('selectTab', function () {
    it('should set active tab', async function () {
      const openCollectionWorkspaceSubtab = sandbox.spy();
      const store = await configureStore(undefined, {
        openCollectionWorkspaceSubtab,
      });
      store.dispatch(selectTab('Documents') as any);
      expect(openCollectionWorkspaceSubtab).to.have.been.calledWith(
        'workspace-tab-id',
        'Documents'
      );
    });
  });

  describe('experimentation integration', function () {
    it('should assign experiment when Atlas metadata is available', async function () {
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        {},
        { assignExperiment },
        mockAtlasConnectionInfo
      );

      await waitFor(() => {
        expect(assignExperiment).to.have.been.calledOnceWith(
          ExperimentTestName.mockDataGenerator,
          {
            team: 'Atlas Growth',
          }
        );
      });
    });

    it('should not assign experiment when Atlas metadata is missing', async function () {
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));
      const mockConnectionInfoRef = {
        current: {
          id: 'test-connection',
          title: 'Test Connection',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
          // No atlasMetadata
        },
      };

      await configureStore(
        undefined,
        {},
        { assignExperiment },
        mockConnectionInfoRef
      );

      // Wait a bit to ensure assignment would have happened if it was going to
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(assignExperiment).to.not.have.been.called;
    });

    it('should not assign experiment when AI features are disabled at the org level', async function () {
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      const mockPreferences = new ReadOnlyPreferenceAccess({
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: false, // Disabled at org level
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      });

      const store = await configureStore(
        undefined,
        {},
        { assignExperiment },
        mockAtlasConnectionInfo,
        undefined,
        mockPreferences
      );

      // Wait a bit to ensure assignment would have happened if it was going to
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(assignExperiment).to.not.have.been.called;

      // Store should still be functional
      await waitFor(() => {
        expect(store.getState())
          .to.have.property('metadata')
          .deep.eq(defaultMetadata);
      });
    });

    it('should handle assignment errors gracefully', async function () {
      const assignExperiment = sandbox.spy(() =>
        Promise.reject(new Error('Assignment failed'))
      );

      await configureStore(
        undefined,
        {},
        { assignExperiment },
        mockAtlasConnectionInfo
      );

      await waitFor(() => {
        expect(assignExperiment).to.have.been.calledOnce;
      });

      // Store should still be functional despite assignment error
      await waitFor(() => {
        expect(store.getState())
          .to.have.property('metadata')
          .deep.eq(defaultMetadata);
      });
    });
  });

  describe('schema analysis on collection load', function () {
    it('should start schema analysis if collection is not read-only and not time-series', async function () {
      await configureStore();

      expect(analyzeCollectionSchemaStub).to.have.been.calledOnce;
    });

    it('should not start schema analysis if collection is read-only', async function () {
      await configureStore(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { ...defaultMetadata, isReadonly: true }
      );

      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });

    it('should not start schema analysis if collection is time-series', async function () {
      await configureStore(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { ...defaultMetadata, isTimeSeries: true }
      );

      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });
  });
});
