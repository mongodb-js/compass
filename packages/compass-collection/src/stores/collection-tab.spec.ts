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
    testName: ExperimentTestName.mockDataGenerator,
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
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
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
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
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

    it('should not assign experiment for readonly collections', async function () {
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
      expect(assignExperiment).to.not.have.been.called;
    });

    it('should not assign experiment for time series collections', async function () {
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
      expect(assignExperiment).to.not.have.been.called;
    });
  });

  describe('schema analysis on collection load', function () {
    it('should start schema analysis if collection is not read-only and not time-series', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroup.mockDataGeneratorVariant)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(undefined, undefined, {
        getAssignment,
        assignExperiment,
      });

      await waitFor(() => {
        expect(analyzeCollectionSchemaStub).to.have.been.calledOnce;
      });
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

    it('should not start schema analysis in non-Atlas environments', async function () {
      const getAssignment = sandbox.spy(() => Promise.resolve(null));
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));
      const mockConnectionInfoRef = {
        current: {
          id: 'test-connection',
          title: 'Test Connection',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
          // No atlasMetadata (non-Atlas environment)
        },
      };

      await configureStore(
        undefined,
        undefined,
        { getAssignment, assignExperiment },
        mockConnectionInfoRef
      );

      await waitFor(() => {
        expect(getAssignment).to.have.been.calledOnceWith(
          ExperimentTestName.mockDataGenerator,
          false
        );
      });

      // Wait a bit to ensure schema analysis would not have been called
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });

    it('should start schema analysis in Atlas when user is in treatment variant', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroup.mockDataGeneratorVariant)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        undefined,
        { getAssignment, assignExperiment },
        mockAtlasConnectionInfo
      );

      await waitFor(() => {
        expect(getAssignment).to.have.been.calledOnceWith(
          ExperimentTestName.mockDataGenerator,
          false // Don't track "Experiment Viewed" event
        );
        expect(analyzeCollectionSchemaStub).to.have.been.calledOnce;
      });
    });

    it('should not start schema analysis in Atlas when user is in control variant', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroup.mockDataGeneratorControl)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        undefined,
        { getAssignment, assignExperiment },
        mockAtlasConnectionInfo
      );

      await waitFor(() => {
        expect(getAssignment).to.have.been.calledOnceWith(
          ExperimentTestName.mockDataGenerator,
          false
        );
      });

      // Wait a bit to ensure schema analysis would not have been called
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });

    it('should not start schema analysis when getAssignment fails', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.reject(new Error('Assignment failed'))
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        undefined,
        { getAssignment, assignExperiment },
        mockAtlasConnectionInfo
      );

      await waitFor(() => {
        expect(getAssignment).to.have.been.calledOnce;
      });

      // Wait a bit to ensure schema analysis would not have been called
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });
  });

  describe('schema analysis cancellation', function () {
    it('should cancel schema analysis when cancelSchemaAnalysis is dispatched', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroup.mockDataGeneratorVariant)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      const store = await configureStore(undefined, undefined, {
        getAssignment,
        assignExperiment,
      });

      // Dispatch cancel action
      store.dispatch(collectionTabModule.cancelSchemaAnalysis() as any);

      // Verify the state is reset to initial
      expect(
        (store.getState() as { schemaAnalysis: { status: string } })
          .schemaAnalysis.status
      ).to.equal('initial');
    });
  });

  describe('document-inserted event listener', function () {
    it('should re-trigger schema analysis when document is inserted into current collection', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroup.mockDataGeneratorVariant)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      const store = await configureStore(
        undefined,
        undefined,
        { getAssignment, assignExperiment },
        mockAtlasConnectionInfo,
        undefined,
        undefined,
        { ...defaultMetadata, isReadonly: false, isTimeSeries: false }
      );

      // Wait for initial schema analysis to complete
      await waitFor(() => {
        expect(analyzeCollectionSchemaStub).to.have.been.calledOnce;
      });

      // Reset the stub to track new calls
      analyzeCollectionSchemaStub.resetHistory();

      // Simulate the empty collection
      store.dispatch({
        type: 'compass-collection/SchemaAnalysisFailed',
        error: new Error('No documents found'),
      } as any);

      // Trigger the document-inserted event
      globalAppRegistry.emit(
        'document-inserted',
        {
          ns: defaultMetadata.namespace,
          view: 'default',
          mode: 'default',
          multiple: false,
          docs: [{ _id: 'test-doc-id', name: 'test' }],
        },
        { connectionId: mockAtlasConnectionInfo.current.id }
      );

      // Wait for schema analysis to be re-triggered
      await waitFor(() => {
        expect(analyzeCollectionSchemaStub).to.have.been.calledOnce;
      });
    });

    it('should not re-trigger schema analysis for different collection', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroup.mockDataGeneratorVariant)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        undefined,
        { getAssignment, assignExperiment },
        mockAtlasConnectionInfo
      );

      // Wait for initial schema analysis to complete
      await waitFor(() => {
        expect(analyzeCollectionSchemaStub).to.have.been.calledOnce;
      });

      // Reset the stub to track new calls
      analyzeCollectionSchemaStub.resetHistory();

      // Trigger the document-inserted event with different collection
      globalAppRegistry.emit(
        'document-inserted',
        {
          ns: 'different.collection',
          view: 'default',
          mode: 'default',
          multiple: false,
          docs: [{ _id: 'test-doc-id', name: 'test' }],
        },
        { connectionId: mockAtlasConnectionInfo.current.id }
      );

      // Wait a bit to ensure schema analysis is not called
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });

    it('should not re-trigger schema analysis for different connection', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroup.mockDataGeneratorVariant)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        undefined,
        { getAssignment, assignExperiment },
        mockAtlasConnectionInfo
      );

      // Wait for initial schema analysis to complete
      await waitFor(() => {
        expect(analyzeCollectionSchemaStub).to.have.been.calledOnce;
      });

      // Reset the stub to track new calls
      analyzeCollectionSchemaStub.resetHistory();

      // Trigger the document-inserted event with different connection
      globalAppRegistry.emit(
        'document-inserted',
        {
          ns: defaultMetadata.namespace,
          view: 'default',
          mode: 'default',
          multiple: false,
          docs: [{ _id: 'test-doc-id', name: 'test' }],
        },
        { connectionId: 'different-connection-id' }
      );

      // Wait a bit to ensure schema analysis is not called
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });

    it('should not re-trigger schema analysis when user is not in experiment variant', async function () {
      const getAssignment = sandbox.spy(() =>
        Promise.resolve(
          createMockAssignment(ExperimentTestGroup.mockDataGeneratorControl)
        )
      );
      const assignExperiment = sandbox.spy(() => Promise.resolve(null));

      await configureStore(
        undefined,
        undefined,
        { getAssignment, assignExperiment },
        mockAtlasConnectionInfo
      );

      // Wait for initial assignment check
      await waitFor(() => {
        expect(getAssignment).to.have.been.calledOnce;
      });

      // Schema analysis should not have been called initially
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;

      // Verify the schema analysis state is INITIAL (as expected for control variant)
      const initialState = store.getState() as {
        schemaAnalysis: { status: string };
      };
      expect(initialState.schemaAnalysis.status).to.equal('initial');

      // Trigger the document-inserted event
      globalAppRegistry.emit(
        'document-inserted',
        {
          ns: defaultMetadata.namespace,
          view: 'default',
          mode: 'default',
          multiple: false,
          docs: [{ _id: 'test-doc-id', name: 'test' }],
        },
        { connectionId: mockAtlasConnectionInfo.current.id }
      );

      // Wait a bit to ensure schema analysis is not called
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
      expect(analyzeCollectionSchemaStub).to.not.have.been.called;
    });
  });
});
