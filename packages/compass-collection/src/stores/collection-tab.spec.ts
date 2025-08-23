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
import {
  SCHEMA_ANALYSIS_STATE_COMPLETE,
  SCHEMA_ANALYSIS_STATE_INITIAL,
} from '../schema-analysis-types';
import {
  MOCK_DATA_GENERATOR_STATE_GENERATING,
  MOCK_DATA_GENERATOR_STATE_IDLE,
} from '../mock-data-generator-types';
import { CollectionActions } from '../modules/collection-tab';
import { type MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';

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
        atlasAiService,
        localAppRegistry,
        collection: mockCollection as any,
        workspaces: workspaces as any,
        experimentationServices: experimentationServices as any,
        connectionInfoRef: connectionInfoRef as any,
        logger,
        preferences,
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

  describe('generateFakerMappings thunk', function () {
    it('can complete successfully', async function () {
      const dispatch = sandbox.spy();
      const getState = sandbox.stub().returns({
        schemaAnalysis: {
          status: SCHEMA_ANALYSIS_STATE_COMPLETE,
          processedSchema: {
            collectionName: 'foo',
            databaseName: 'test',
            schema: {
              name: {
                type: 'String',
                sampleValues: ['John', 'Jane', 'Bob'],
                probability: 1.0,
              },
              age: {
                type: 'Number',
                sampleValues: [25, 30, 35],
                probability: 0.9,
              },
              isActive: {
                type: 'Boolean',
                sampleValues: [true, false],
                probability: 0.8,
              },
            },
          },
        },
        fakerSchemaGeneration: { status: MOCK_DATA_GENERATOR_STATE_IDLE },
      });
      const logger = {
        log: { error: sandbox.spy() },
        debug: sandbox.spy(),
      };

      const mockDataSchemaResponse: MockDataSchemaResponse = {
        content: {
          fields: [
            {
              fieldPath: 'name',
              probability: 1.0,
              mongoType: 'string',
              fakerMethod: 'person.firstName',
              fakerArgs: [],
              isArray: false,
            },
            {
              fieldPath: 'age',
              probability: 1.0,
              mongoType: 'number',
              fakerMethod: 'number.int',
              fakerArgs: [],
              isArray: false,
            },
            {
              fieldPath: 'isActive',
              probability: 1.0,
              mongoType: 'boolean',
              fakerMethod: 'datatype.boolean',
              fakerArgs: [],
              isArray: false,
            },
          ],
        },
      };
      const atlasAiService = {
        getMockDataSchema: sandbox
          .stub()
          .returns(Promise.resolve(mockDataSchemaResponse)),
      };

      // Act
      const thunk = collectionTabModule.generateFakerMappings(
        mockAtlasConnectionInfo.current
      );
      await thunk(dispatch, getState, { logger, atlasAiService } as any);

      // Assert
      expect(dispatch).to.have.been.calledTwice;

      const calls = dispatch.getCalls();
      const startedCall = calls[0];
      const completedCall = calls[1];

      expect(startedCall).to.be.calledWith({
        type: CollectionActions.FakerMappingGenerationStarted,
        requestId: Sinon.match.string,
      });

      expect(completedCall).to.be.calledWith({
        type: CollectionActions.FakerMappingGenerationCompleted,
        fakerSchema: mockDataSchemaResponse,
        requestId: Sinon.match.string,
      });
    });

    it('can dispatch a failure', async function () {
      const dispatch = sandbox.spy();
      const getState = sandbox.stub().returns({
        schemaAnalysis: {
          status: SCHEMA_ANALYSIS_STATE_COMPLETE,
          processedSchema: undefined,
        },
        fakerSchemaGeneration: { status: MOCK_DATA_GENERATOR_STATE_IDLE },
      });
      const logger = {
        log: { error: sandbox.spy() },
        debug: sandbox.spy(),
      };

      const atlasAiService = {
        getMockDataSchema: sandbox.stub().returns(Promise.resolve({})),
      };

      // Act
      const thunk = collectionTabModule.generateFakerMappings(
        mockAtlasConnectionInfo.current
      );
      await thunk(dispatch, getState, { logger, atlasAiService } as any);

      // Assert
      expect(dispatch).to.have.been.calledTwice;

      const calls = dispatch.getCalls();
      const startedCall = calls[0];
      const completedCall = calls[1];

      expect(startedCall).to.be.calledWith({
        type: CollectionActions.FakerMappingGenerationStarted,
        requestId: Sinon.match.string,
      });

      expect(completedCall).to.be.calledWith({
        type: CollectionActions.FakerMappingGenerationFailed,
        error: Sinon.match.string,
        requestId: Sinon.match.string,
      });
    });

    it('should not initiate if schemaAnalysis is incomplete', async function () {
      // Arrange
      const dispatch = sandbox.spy();
      const getState = sandbox.stub().returns({
        schemaAnalysis: { status: SCHEMA_ANALYSIS_STATE_INITIAL },
        fakerSchemaGeneration: { status: MOCK_DATA_GENERATOR_STATE_IDLE },
      });
      const logger = {
        log: { error: sandbox.spy() },
        debug: sandbox.spy(),
      };
      const atlasAiService = {};

      // Act
      const thunk = collectionTabModule.generateFakerMappings(
        mockAtlasConnectionInfo.current
      );
      await thunk(dispatch, getState, { logger, atlasAiService } as any);

      // Assert
      expect(dispatch).to.not.have.been.called;
      expect(logger.log.error).to.have.been.calledOnce;
    });

    it('should not initiate if fakerSchemaGeneration is in progress', async function () {
      // Arrange
      const dispatch = sandbox.spy();
      const getState = sandbox.stub().returns({
        schemaAnalysis: { status: SCHEMA_ANALYSIS_STATE_COMPLETE },
        fakerSchemaGeneration: { status: MOCK_DATA_GENERATOR_STATE_GENERATING },
      });
      const logger = {
        log: { error: sandbox.spy() },
        debug: sandbox.spy(),
      };
      const atlasAiService = {
        getMockDataSchema: sandbox.stub().returns(Promise.resolve({})),
      };

      // Act
      const thunk = collectionTabModule.generateFakerMappings(
        mockAtlasConnectionInfo.current
      );
      await thunk(dispatch, getState, { logger, atlasAiService } as any);

      // Assert
      expect(dispatch).to.not.have.been.called;
      expect(logger.debug).to.have.been.calledOnce;
    });
  });
});
