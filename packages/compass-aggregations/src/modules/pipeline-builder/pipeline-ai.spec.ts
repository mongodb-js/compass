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
import { AtlasService } from '@mongodb-js/atlas-service/renderer';
import { MockAtlasUserData } from '../../../test/configure-store';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

describe('AIPipelineReducer', function () {
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    sandbox.reset();
  });

  async function configureStore(atlasService: Partial<AtlasService> = {}) {
    const preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableGenAIFeatures: true,
      cloudFeatureRolloutAccess: {
        GEN_AI_COMPASS: true,
      },
    });
    const atlasServiceInstance = new AtlasService(
      new MockAtlasUserData(),
      preferences,
      createNoopLoggerAndTelemetry()
    );
    return configureReduxStore(
      {
        namespace: 'database.collection',
      },
      {
        sample: sandbox.stub().resolves([{ _id: 42 }]),
        getConnectionString: sandbox.stub().returns({ hosts: [] }),
      } as any,
      {
        atlasService: Object.assign(atlasServiceInstance, atlasService),
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
          fetchJson: fetchJsonStub,
        });

        // Set autoPreview false so that it doesn't start the
        // follow up async preview doc requests.
        store.dispatch(toggleAutoPreview(false));
        expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
          'ready'
        );

        await store.dispatch(runAIPipelineGeneration('testing prompt'));

        expect(fetchJsonStub).to.have.been.calledOnce;

        const args = fetchJsonStub.getCall(0).args;
        expect(args[0]).to.contain('ai/api/v1/mql-aggregation');
        expect(args[1].method).to.equal('POST');

        const body = JSON.parse(args[1].body);
        expect(body).to.have.property('userInput', 'testing prompt');
        expect(body).to.have.property('collectionName', 'collection');
        expect(body).to.have.property('databaseName', 'database');
        // Sample documents are currently disabled.
        expect(body).to.not.have.property('sampleDocuments');

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
          fetchJson: sandbox
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
          fetchJson: sandbox.stub().rejects(authError),
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
        fetchJson: sandbox.stub().resolves({
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
