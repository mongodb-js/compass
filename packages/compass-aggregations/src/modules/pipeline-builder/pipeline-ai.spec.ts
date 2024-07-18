import { expect } from 'chai';
import Sinon from 'sinon';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';
import type { DataService } from 'mongodb-data-service';

import configureReduxStore from '../../../test/configure-store';
import {
  AIPipelineActionTypes,
  cancelAIPipelineGeneration,
  runAIPipelineGeneration,
  generateAggregationFromQuery,
} from './pipeline-ai';
import { toggleAutoPreview } from '../auto-preview';
import { MockAtlasAiService } from '../../../test/configure-store';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';

describe('AIPipelineReducer', function () {
  const sandbox = Sinon.createSandbox();
  let preferences: PreferencesAccess;

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableGenAIFeatures: true,
      cloudFeatureRolloutAccess: {
        GEN_AI_COMPASS: true,
      },
    });
  });

  afterEach(function () {
    sandbox.reset();
  });

  function configureStore(
    aiService: Partial<AtlasAiService> = {},
    mockDataService?: Partial<DataService>
  ) {
    const atlasAiService = Object.assign(new MockAtlasAiService(), aiService);
    return configureReduxStore(
      {
        namespace: 'database.collection',
      },
      {
        sample: sandbox.stub().resolves([{ _id: 42 }]),
        getConnectionString: sandbox.stub().returns({ hosts: [] }),
      } as any,
      {
        atlasAiService: atlasAiService as any,
        dataService: mockDataService as any,
        preferences,
        track: createNoopTrack(),
      }
    );
  }

  describe('runAIPipelineGeneration', function () {
    describe('with a successful server response', function () {
      it('should succeed', async function () {
        const fetchJsonStub = sandbox.stub().resolves({
          content: { aggregation: { pipeline: '[{ $match: { _id: 1 } }]' } },
        });
        const store = configureStore({
          getAggregationFromUserInput: fetchJsonStub,
        });

        // Set autoPreview false so that it doesn't start the
        // follow up async preview doc requests.
        store.dispatch(toggleAutoPreview(false));
        expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
          'ready'
        );

        await store.dispatch(runAIPipelineGeneration('testing prompt'));

        expect(fetchJsonStub).to.have.been.calledOnce;

        const args = fetchJsonStub.getCall(0).firstArg;
        expect(args).to.have.property('userInput', 'testing prompt');
        expect(args).to.have.property('collectionName', 'collection');
        expect(args).to.have.property('databaseName', 'database');
        // Sample documents are currently disabled.
        expect(args).to.not.have.property('sampleDocuments');

        expect(
          store.getState().pipelineBuilder.aiPipeline.aiPipelineRequestId
        ).to.equal(null);
        expect(
          store.getState().pipelineBuilder.aiPipeline.errorMessage
        ).to.equal(undefined);
        expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
          'success'
        );
      });
    });

    describe('when there is an error', function () {
      it('sets the error on the store', async function () {
        const store = configureStore({
          getAggregationFromUserInput: sandbox
            .stub()
            .rejects(new Error('500 Internal Server Error')),
        });
        expect(
          store.getState().pipelineBuilder.aiPipeline.errorMessage
        ).to.equal(undefined);
        await store.dispatch(runAIPipelineGeneration('testing prompt') as any);
        expect(
          store.getState().pipelineBuilder.aiPipeline.aiPipelineRequestId
        ).to.equal(null);
        expect(
          store.getState().pipelineBuilder.aiPipeline.errorMessage
        ).to.equal('500 Internal Server Error');
        expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
          'ready'
        );
      });

      it('resets the store if errs was caused by user being unauthorized', async function () {
        const authError = new Error('Unauthorized');
        (authError as any).statusCode = 401;
        const store = configureStore({
          getAggregationFromUserInput: sandbox.stub().rejects(authError),
        });
        await store.dispatch(runAIPipelineGeneration('testing prompt') as any);
        expect(store.getState().pipelineBuilder.aiPipeline).to.deep.eq({
          status: 'ready',
          aiPromptText: '',
          errorMessage: undefined,
          errorCode: undefined,
          isInputVisible: false,
          aiPipelineRequestId: null,
          lastAIPipelineRequestId: null,
          isAggregationGeneratedFromQuery: false,
        });
      });
    });

    describe('when the sample documents setting is enabled', function () {
      beforeEach(async function () {
        await preferences.savePreferences({
          enableGenAISampleDocumentPassing: true,
        });
      });

      it('includes sample documents in the request', async function () {
        const fetchJsonStub = sandbox.stub().resolves({
          content: { aggregation: { pipeline: '[{ $match: { _id: 1 } }]' } },
        });
        const mockDataService = {
          sample: sandbox.stub().resolves([{ pineapple: 'turtle' }]),
        };
        const store = configureStore(
          {
            getAggregationFromUserInput: fetchJsonStub,
          },
          mockDataService
        );

        // Set autoPreview false so that it doesn't start the
        // follow up async preview doc requests.
        store.dispatch(toggleAutoPreview(false));
        expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
          'ready'
        );

        await preferences.savePreferences({
          enableGenAISampleDocumentPassing: true,
        });

        await store.dispatch(runAIPipelineGeneration('testing prompt'));

        expect(fetchJsonStub).to.have.been.calledOnce;
        const args = fetchJsonStub.getCall(0).firstArg;
        expect(args).to.have.deep.property('sampleDocuments', [
          { pineapple: 'turtle' },
        ]);
      });
    });

    describe('when the sample documents setting is disabled', function () {
      it('does not include sample documents in the request', async function () {
        const fetchJsonStub = sandbox.stub().resolves({
          content: { aggregation: { pipeline: '[{ $match: { _id: 1 } }]' } },
        });
        const store = configureStore({
          getAggregationFromUserInput: fetchJsonStub,
        });

        // Set autoPreview false so that it doesn't start the
        // follow up async preview doc requests.
        store.dispatch(toggleAutoPreview(false));
        expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
          'ready'
        );

        await store.dispatch(runAIPipelineGeneration('testing prompt'));
        expect(fetchJsonStub).to.have.been.calledOnce;

        const args = fetchJsonStub.getCall(0).firstArg;
        expect(args).to.not.have.property('sampleDocuments');
      });
    });
  });

  describe('cancelAIPipelineGeneration', function () {
    it('should unset the fetching id and set the status on the store', function () {
      const store = configureStore();
      expect(
        store.getState().pipelineBuilder.aiPipeline.aiPipelineRequestId
      ).to.equal(null);

      store.dispatch({
        type: AIPipelineActionTypes.AIPipelineStarted,
        requestId: 'pineapples',
      });

      expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
        'fetching'
      );
      expect(
        store.getState().pipelineBuilder.aiPipeline.aiPipelineRequestId
      ).to.equal('pineapples');

      store.dispatch(cancelAIPipelineGeneration());

      expect(
        store.getState().pipelineBuilder.aiPipeline.aiPipelineRequestId
      ).to.equal(null);
      expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
        'ready'
      );
    });
  });

  describe('generateAggregationFromQuery', function () {
    it('should create an aggregation pipeline', function () {
      const store = configureStore({
        getAggregationFromUserInput: sandbox.stub().resolves({
          content: {
            aggregation: { pipeline: '[{ $group: { _id: "$price" } }]' },
          },
        }),
      });

      // Set autoPreview false so that it doesn't start the
      // follow up async preview doc requests.
      store.dispatch(toggleAutoPreview(false));
      expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
        'ready'
      );

      store.dispatch(
        generateAggregationFromQuery({
          userInput: 'group by price',
          aggregation: {
            pipeline: '[{ $group: { _id: "$price" } }]',
          },
          requestId: 'abc',
        })
      );

      expect(
        store.getState().pipelineBuilder.aiPipeline.aiPipelineRequestId
      ).to.equal(null);
      expect(store.getState().pipelineBuilder.aiPipeline.errorMessage).to.equal(
        undefined
      );
      expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
        'success'
      );
      expect(store.getState().pipelineBuilder.aiPipeline.aiPromptText).to.equal(
        'group by price'
      );
      expect(
        store.getState().pipelineBuilder.aiPipeline.isInputVisible
      ).to.equal(true);
      expect(
        store.getState().pipelineBuilder.aiPipeline.lastAIPipelineRequestId
      ).to.equal('abc');
      expect(
        store.getState().pipelineBuilder.aiPipeline
          .isAggregationGeneratedFromQuery
      ).to.equal(true);
    });
  });
});
