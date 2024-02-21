import { expect } from 'chai';
import Sinon from 'sinon';

import configureReduxStore from '../../../test/configure-store';
import {
  AIPipelineActionTypes,
  cancelAIPipelineGeneration,
  runAIPipelineGeneration,
  generateAggregationFromQuery,
} from './pipeline-ai';
import { toggleAutoPreview } from '../auto-preview';
import { MockAtlasAiService } from '../../../test/configure-store';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';

describe('AIPipelineReducer', function () {
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    sandbox.reset();
  });

  async function configureStore(aiService: Partial<AtlasAiService> = {}) {
    const preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableGenAIFeatures: true,
      cloudFeatureRolloutAccess: {
        GEN_AI_COMPASS: true,
      },
    });
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
      }
    );
  }

  describe('runAIPipelineGeneration', function () {
    describe('with a successful server response', function () {
      it('should succeed', async function () {
        const fetchJsonStub = sandbox.stub().resolves({
          content: { aggregation: { pipeline: '[{ $match: { _id: 1 } }]' } },
        });
        const store = await configureStore({
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
          store.getState().pipelineBuilder.aiPipeline.aiPipelineFetchId
        ).to.equal(-1);
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
        const store = await configureStore({
          getAggregationFromUserInput: sandbox
            .stub()
            .rejects(new Error('500 Internal Server Error')),
        });
        expect(
          store.getState().pipelineBuilder.aiPipeline.errorMessage
        ).to.equal(undefined);
        await store.dispatch(runAIPipelineGeneration('testing prompt') as any);
        expect(
          store.getState().pipelineBuilder.aiPipeline.aiPipelineFetchId
        ).to.equal(-1);
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
        const store = await configureStore({
          getAggregationFromUserInput: sandbox.stub().rejects(authError),
        });
        await store.dispatch(runAIPipelineGeneration('testing prompt') as any);
        expect(store.getState().pipelineBuilder.aiPipeline).to.deep.eq({
          status: 'ready',
          aiPromptText: '',
          errorMessage: undefined,
          errorCode: undefined,
          isInputVisible: false,
          aiPipelineFetchId: -1,
          isAggregationGeneratedFromQuery: false,
        });
      });
    });
  });

  describe('cancelAIPipelineGeneration', function () {
    it('should unset the fetching id and set the status on the store', async function () {
      const store = await configureStore();
      expect(
        store.getState().pipelineBuilder.aiPipeline.aiPipelineFetchId
      ).to.equal(-1);

      store.dispatch({
        type: AIPipelineActionTypes.AIPipelineStarted,
        fetchId: 1,
      });

      expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
        'fetching'
      );
      expect(
        store.getState().pipelineBuilder.aiPipeline.aiPipelineFetchId
      ).to.equal(1);

      store.dispatch(cancelAIPipelineGeneration());

      expect(
        store.getState().pipelineBuilder.aiPipeline.aiPipelineFetchId
      ).to.equal(-1);
      expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
        'ready'
      );
    });
  });

  describe('generateAggregationFromQuery', function () {
    it('should create an aggregation pipeline', async function () {
      const store = await configureStore({
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
        })
      );

      expect(
        store.getState().pipelineBuilder.aiPipeline.aiPipelineFetchId
      ).to.equal(-1);
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
        store.getState().pipelineBuilder.aiPipeline
          .isAggregationGeneratedFromQuery
      ).to.equal(true);
    });
  });
});
