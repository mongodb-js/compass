import type { CollectionTabOptions } from './collection-tab';
import { activatePlugin } from './collection-tab';
import { selectTab } from '../modules/collection-tab';
import * as collectionTabModule from '../modules/collection-tab';
import { waitFor } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import AppRegistry, {
  createActivateHelpers,
} from '@mongodb-js/compass-app-registry';
import { expect } from 'chai';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { ExperimentationServices } from '@mongodb-js/compass-telemetry/provider';
import type { connectionInfoRefLocator } from '@mongodb-js/compass-connections/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { ReadOnlyPreferenceAccess } from 'compass-preferences-model/provider';
import {
  ExperimentTestNames,
  ExperimentTestGroups,
} from '@mongodb-js/compass-telemetry/provider';
import type {
  ExperimentTestName,
  ExperimentTestGroup,
} from '@mongodb-js/compass-telemetry/provider';
import { type CollectionMetadata } from 'mongodb-collection-model';
import type { types } from '@mongodb-js/mdb-experiment-js';

// Wait time in ms for async operations to complete
const WAIT_TIME = 50;

// Helper function to create proper mock assignment objects for testing
const createMockAssignment = (
  variant: ExperimentTestGroup
): types.SDKAssignment<ExperimentTestName, string> => ({
  assignmentData: {
    variant,
    isInSample: true,
  },
  experimentData: {
    assignmentDate: '2024-01-01T00:00:00Z',
    entityType: 'USER' as types.EntityType,
    id: 'test-assignment-id',
    tag: 'test-tag',
    testGroupId: 'test-group-id',
    entityId: 'test-user-id',
    testId: 'test-id',
    testName: ExperimentTestNames.mockDataGenerator,
    testGroupDatabaseId: 'test-group-db-id',
    meta: { isLaunchedExperiment: true },
  },
});

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
      userConnectionString: 'mongodb+srv://localhost:27017',
    },
  },
};

describe('Collection Tab Content store', function () {
  const sandbox = Sinon.createSandbox();

  const localAppRegistry = sandbox.spy(new AppRegistry());
  const globalAppRegistry = sandbox.spy(new AppRegistry());
  const analyzeCollectionSchemaStub = sandbox
    .stub(collectionTabModule, 'analyzeCollectionSchema')
    .returns(async () => {});

  let mockActivateHelpers: ActivateHelpers;

  const dataService = {} as any;
  const atlasAiService = {} as any;
  let store: ReturnType<typeof activatePlugin>['store'];
  let deactivate: ReturnType<typeof activatePlugin>['deactivate'];

  const configureStore = async (
    options: Partial<CollectionTabOptions> = {},
    workspaces: Partial<ReturnType<typeof workspacesServiceLocator>> = {},
    experimentationServices: Partial<ExperimentationServices> = {},
    connectionInfoRef: Partial<
      ReturnType<typeof connectionInfoRefLocator>
    > = mockAtlasConnectionInfo,
    logger = createNoopLogger('COMPASS-COLLECTION-TEST'),
    preferences = new ReadOnlyPreferenceAccess({
      enableGenAIFeatures: true,
      enableGenAIFeaturesAtlasOrg: true,
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
        atlasAiService,
        localAppRegistry,
        globalAppRegistry,
        collection: mockCollection as any,
        workspaces: workspaces as any,
        experimentationServices: experimentationServices as any,
        connectionInfoRef: connectionInfoRef as any,
        logger,
        preferences,
      },
      mockActivateHelpers
    ));
    await waitFor(() => {
      expect(store.getState())
        .to.have.property('metadata')
        .deep.eq(collectionMetadata);
    });
    return store;
  };

  beforeEach(function () {
    mockActivateHelpers = createActivateHelpers();
  });

  afterEach(function () {
    mockActivateHelpers.cleanup();
    sandbox.resetHistory();
    deactivate();
  });

  describe('selectTab', function () {
    it('should set active tab', async function () {
      const openCollectionWorkspaceSubtab = sandbox.spy();
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      const store = await configureStore(
        undefined,
        { openCollectionWorkspaceSubtab },
        { assignExperiment }
      );
      store.dispatch(selectTab('Documents') as any);
      expect(openCollectionWorkspaceSubtab).to.have.been.calledWith(
        'workspace-tab-id',
        'Documents'
      );
    });
  });

  describe('experimentation integration', function () {
    it('should assign mock data generator, search activation program p1, and search activation program p2 experiments when Atlas metadata is available', async function () {
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        {},
        { assignExperiment },
        mockAtlasConnectionInfo
      );

      await waitFor(() => {
        expect(assignExperiment).to.have.been.calledWith(
          ExperimentTestNames.mockDataGenerator,
          {
            team: 'Atlas Growth',
          }
        );
        expect(assignExperiment).to.have.been.calledWith(
          ExperimentTestNames.searchActivationProgramP1,
          {
            team: 'Search Web Platform',
          }
        );
        expect(assignExperiment).to.have.been.calledWith(
          ExperimentTestNames.searchActivationProgramP2,
          {
            team: 'Search Web Platform',
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
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(assignExperiment).to.not.have.been.called;
    });

    it('should not assign mock data generator experiment when AI features are disabled at the org level', async function () {
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      const mockPreferences = new ReadOnlyPreferenceAccess({
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: false, // Disabled at org level
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
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(assignExperiment).to.not.have.been.calledWith(
        ExperimentTestNames.mockDataGenerator,
        Sinon.match.any
      );

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
        expect(assignExperiment).to.have.been.calledThrice;
      });

      // Store should still be functional despite assignment error
      await waitFor(() => {
        expect(store.getState())
          .to.have.property('metadata')
          .deep.eq(defaultMetadata);
      });
    });

    it('should not assign mock data generator experiment for readonly collections', async function () {
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        {},
        { assignExperiment },
        mockAtlasConnectionInfo,
        undefined,
        undefined,
        { ...defaultMetadata, isReadonly: true }
      );

      // Wait a bit to ensure assignment would have happened if it was going to
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(assignExperiment).to.not.have.been.calledWith(
        ExperimentTestNames.mockDataGenerator,
        Sinon.match.any
      );
    });

    it('should not assign mock data generator experiment for time series collections', async function () {
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        {},
        { assignExperiment },
        mockAtlasConnectionInfo,
        undefined,
        undefined,
        { ...defaultMetadata, isTimeSeries: true }
      );

      // Wait a bit to ensure assignment would have happened if it was going to
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(assignExperiment).to.not.have.been.calledWith(
        ExperimentTestNames.mockDataGenerator,
        Sinon.match.any
      );
    });
  });

  describe('schema analysis on demand', function () {
    it('does not start schema analysis when the collection loads', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroups.mockDataGeneratorVariant)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(undefined, undefined, {
        getAssignment,
        assignExperiment,
      });

      await waitFor(() => {
        expect(assignExperiment).to.have.been.called;
      });

      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
      expect(getAssignment).to.not.have.been.called;
    });

    it('does not re-trigger analysis on document-inserted events', async function () {
      await configureStore(undefined, undefined, {
        getAssignment: sandbox.stub().resolves(null),
        assignExperiment: sandbox.stub().resolves(null),
      });

      globalAppRegistry.emit(
        'document-inserted',
        { ns: defaultMetadata.namespace },
        { connectionId: mockAtlasConnectionInfo.current.id }
      );

      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });

    it('does not re-trigger analysis on import-finished events', async function () {
      await configureStore(undefined, undefined, {
        getAssignment: sandbox.stub().resolves(null),
        assignExperiment: sandbox.stub().resolves(null),
      });

      globalAppRegistry.emit(
        'import-finished',
        { ns: defaultMetadata.namespace },
        { connectionId: mockAtlasConnectionInfo.current.id }
      );

      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });
  });

  describe('open-mock-data-generator-modal event listener', function () {
    it('should open mock data generator modal when event is emitted and AI access succeeds', async function () {
      const ensureAiFeatureAccess = sandbox.stub().resolves();
      const mockAtlasAiService = { ensureAiFeatureAccess };

      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroups.mockDataGeneratorVariant)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      const mockCollection = {
        _id: defaultMetadata.namespace,
        fetchMetadata() {
          return Promise.resolve(defaultMetadata);
        },
        toJSON() {
          return this;
        },
      };

      ({ store, deactivate } = activatePlugin(
        defaultTabOptions,
        {
          dataService,
          atlasAiService: mockAtlasAiService as typeof atlasAiService,
          localAppRegistry,
          globalAppRegistry,
          collection: mockCollection as any,
          workspaces: {} as any,
          experimentationServices: {
            getAssignment,
            assignExperiment,
          },
          connectionInfoRef: mockAtlasConnectionInfo,
          logger: createNoopLogger('COMPASS-COLLECTION-TEST'),
          preferences: new ReadOnlyPreferenceAccess({
            enableGenAIFeatures: true,
            enableGenAIFeaturesAtlasOrg: true,
          }),
        },
        mockActivateHelpers
      ));

      await waitFor(() => {
        expect(store.getState())
          .to.have.property('metadata')
          .deep.eq(defaultMetadata);
      });

      const state = store.getState() as {
        mockDataGenerator: { isModalOpen: boolean };
      };

      // Verify modal is initially closed
      expect(state.mockDataGenerator.isModalOpen).to.be.false;

      // Emit the event
      localAppRegistry.emit('open-mock-data-generator-modal');

      await waitFor(() => {
        expect(ensureAiFeatureAccess).to.have.been.calledOnce;
        const updatedState = store.getState() as {
          mockDataGenerator: { isModalOpen: boolean };
        };
        expect(updatedState.mockDataGenerator.isModalOpen).to.be.true;
      });

      await waitFor(() => {
        expect(analyzeCollectionSchemaStub).to.have.been.calledOnce;
      });
    });

    it('should not open modal when ensureAiFeatureAccess fails', async function () {
      const ensureAiFeatureAccess = sandbox
        .stub()
        .rejects(new Error('AI feature access denied'));
      const mockAtlasAiService = { ensureAiFeatureAccess };

      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroups.mockDataGeneratorVariant)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      const mockCollection = {
        _id: defaultMetadata.namespace,
        fetchMetadata() {
          return Promise.resolve(defaultMetadata);
        },
        toJSON() {
          return this;
        },
      };

      ({ store, deactivate } = activatePlugin(
        defaultTabOptions,
        {
          dataService,
          atlasAiService: mockAtlasAiService as typeof atlasAiService,
          localAppRegistry,
          globalAppRegistry,
          collection: mockCollection as any,
          workspaces: {} as any,
          experimentationServices: {
            getAssignment,
            assignExperiment,
          },
          connectionInfoRef: mockAtlasConnectionInfo,
          logger: createNoopLogger('COMPASS-COLLECTION-TEST'),
          preferences: new ReadOnlyPreferenceAccess({
            enableGenAIFeatures: true,
            enableGenAIFeaturesAtlasOrg: true,
          }),
        },
        mockActivateHelpers
      ));

      await waitFor(() => {
        expect(store.getState())
          .to.have.property('metadata')
          .deep.eq(defaultMetadata);
      });

      const state = store.getState() as {
        mockDataGenerator: { isModalOpen: boolean };
      };

      // Verify modal is initially closed
      expect(state.mockDataGenerator.isModalOpen).to.be.false;

      // Emit the event
      localAppRegistry.emit('open-mock-data-generator-modal');

      await waitFor(() => {
        expect(ensureAiFeatureAccess).to.have.been.calledOnce;
      });

      // Wait a bit to ensure modal stays closed
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      const finalState = store.getState() as {
        mockDataGenerator: { isModalOpen: boolean };
      };
      expect(finalState.mockDataGenerator.isModalOpen).to.be.false;
    });
  });
});
