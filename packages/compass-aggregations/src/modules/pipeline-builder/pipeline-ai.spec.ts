import { expect } from 'chai';
import Sinon from 'sinon';

import configureStore from '../../../test/configure-store';
import {
  AIPipelineActionTypes,
  cancelAIPipelineGeneration,
  runAIPipelineGeneration,
  createPipelineFromQuery,
} from './pipeline-ai';
import type { ConfigureStoreOptions } from '../../stores/store';
import { toggleAutoPreview } from '../auto-preview';

describe('AIPipelineReducer', function () {
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    sandbox.reset();
  });

  function createStore(opts: Partial<ConfigureStoreOptions> = {}) {
    return configureStore({
      ...opts,
    });
  }

  describe('runAIPipelineGeneration', function () {
    describe('with a successful server response', function () {
      it('should succeed', async function () {
        const mockAtlasService = {
          getAggregationFromUserInput: sandbox.stub().resolves({
            content: { aggregation: { pipeline: [{ $match: { _id: 1 } }] } },
          }),
        };

        const mockDataService = {
          sample: sandbox.stub().resolves([{ _id: 42 }]),
          getConnectionString: sandbox.stub().returns({ hosts: [] }),
        };

        const store = createStore({
          namespace: 'database.collection',
          dataProvider: {
            dataProvider: mockDataService as any,
          },
          atlasService: mockAtlasService as any,
        });

        // Set autoPreview false so that it doesn't start the
        // follow up async preview doc requests.
        store.dispatch(toggleAutoPreview(false));
        expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
          'ready'
        );

        await store.dispatch(runAIPipelineGeneration('testing prompt'));

        expect(mockAtlasService.getAggregationFromUserInput).to.have.been
          .calledOnce;
        expect(
          mockAtlasService.getAggregationFromUserInput.getCall(0)
        ).to.have.nested.property('args[0].userInput', 'testing prompt');
        expect(
          mockAtlasService.getAggregationFromUserInput.getCall(0)
        ).to.have.nested.property('args[0].collectionName', 'collection');
        expect(
          mockAtlasService.getAggregationFromUserInput.getCall(0)
        ).to.have.nested.property('args[0].databaseName', 'database');
        // Sample documents are currently disabled.
        expect(
          mockAtlasService.getAggregationFromUserInput.getCall(0)
        ).to.not.have.nested.property('args[0].sampleDocuments');

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
        const mockAtlasService = {
          getAggregationFromUserInput: sandbox
            .stub()
            .rejects(new Error('500 Internal Server Error')),
        };

        const store = createStore({ atlasService: mockAtlasService as any });
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
        const mockAtlasService = {
          getAggregationFromUserInput: sandbox.stub().rejects(authError),
        };
        const store = createStore({ atlasService: mockAtlasService as any });
        await store.dispatch(runAIPipelineGeneration('testing prompt') as any);
        expect(store.getState().pipelineBuilder.aiPipeline).to.deep.eq({
          status: 'ready',
          aiPromptText: '',
          errorMessage: undefined,
          isInputVisible: false,
          aiPipelineFetchId: -1,
          isGuideCueVisible: false,
          guideCueTitle: undefined,
          guideCueDescription: undefined,
        });
      });
    });
  });

  describe('cancelAIPipelineGeneration', function () {
    it('should unset the fetching id and set the status on the store', function () {
      const store = createStore();
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

  describe('createPipelineFromQuery', function () {
    it('should create an aggregation pipeline', function () {
      const mockAtlasService = {};

      const mockDataService = {
        sample: sandbox.stub().resolves([{ _id: 42 }]),
        getConnectionString: sandbox.stub().returns({ hosts: [] }),
      };

      const store = createStore({
        namespace: 'database.collection',
        dataProvider: {
          dataProvider: mockDataService as any,
        },
        atlasService: mockAtlasService as any,
      });

      // Set autoPreview false so that it doesn't start the
      // follow up async preview doc requests.
      store.dispatch(toggleAutoPreview(false));
      expect(store.getState().pipelineBuilder.aiPipeline.status).to.equal(
        'ready'
      );

      store.dispatch(
        createPipelineFromQuery({
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
        store.getState().pipelineBuilder.aiPipeline.isGuideCueVisible
      ).to.equal(true);
      expect(
        store.getState().pipelineBuilder.aiPipeline.guideCueTitle
      ).to.equal('Aggregation generated');
    });
  });
});
