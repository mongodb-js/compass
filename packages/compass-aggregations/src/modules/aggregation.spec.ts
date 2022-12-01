import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { expect } from 'chai';
import { spy } from 'sinon';

import reducer, { runAggregation, fetchNextPage, fetchPrevPage, cancelAggregation, changeViewType } from './aggregation';
import type { State as AggregateState } from './aggregation';
import type { RootState } from '.';
import rootReducer from '../modules';
import configureStore from '../stores/store';
import { DATA_SERVICE_CONNECTED } from './data-service';
import { createCancelError } from '@mongodb-js/compass-utils';

const getMockedStore = (aggregation: AggregateState): Store<RootState> => {
  const mockedState = {
    aggregationWorkspaceId: '0',
    aggregation,
  };
  return createStore(rootReducer, mockedState, applyMiddleware(thunk));
}

describe('aggregation module', function () {
  it('should return the initial state', function () {
    expect(reducer(undefined, {} as any)).to.deep.equal({
      pipeline: [],
      documents: [],
      page: 1,
      limit: 20,
      isLast: false,
      loading: false,
      resultsViewType: 'document',
    });
  });

  it('runs an aggregation', async function () {
    const mockDocuments = [{ id: 1 }, { id: 2 }];
    const store: Store<RootState> = configureStore({ sourcePipeline: `[]` });
    store.dispatch({
      type: DATA_SERVICE_CONNECTED,
      dataService: new class {
        aggregate() {
          return Promise.resolve(mockDocuments);
        }
      }
    });

    await store.dispatch(runAggregation() as any);

    expect(store.getState().aggregation).to.deep.equal({
      pipeline: [],
      documents: mockDocuments,
      isLast: true,
      page: 1,
      limit: 20,
      loading: false,
      error: undefined,
      abortController: undefined,
      previousPageData: undefined,
      resultsViewType: 'document',
    });
  });

  it('cancels an aggregation', async function () {
    const documents = [{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }];
    const store = getMockedStore({
      pipeline: [],
      isLast: false,
      loading: false,
      documents,
      limit: 4,
      page: 2,
      resultsViewType: 'document'
    });

    store.dispatch({
      type: DATA_SERVICE_CONNECTED,
      dataService: new class {
        aggregate() {
          throw createCancelError();
        }
      }
    });

    store.dispatch(fetchNextPage() as any);
    await store.dispatch(cancelAggregation() as any);

    expect(store.getState().aggregation).to.deep.equal({
      pipeline: [],
      documents,
      isLast: false,
      page: 2,
      limit: 4,
      loading: false,
      error: undefined,
      abortController: undefined,
      previousPageData: undefined,
      resultsViewType: 'document',
    });
  });

  describe('paginates data', function () {
    it('runs aggregation when fetching nextPage', async function () {
      const store = getMockedStore({
        pipeline: [],
        isLast: false,
        loading: false,
        documents: [
          { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 },
        ],
        limit: 4,
        page: 2,
        resultsViewType: 'document',
      });

      const mockDocuments = [{ id: 9 }, { id: 10 }, { id: 11 }, { id: 12 }];
      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: new class {
          aggregate() {
            return Promise.resolve(mockDocuments);
          }
        }
      });

      await store.dispatch(fetchNextPage() as any);

      expect(store.getState().aggregation).to.deep.equal({
        pipeline: [],
        documents: mockDocuments,
        isLast: false,
        page: 3,
        limit: 4,
        loading: false,
        error: undefined,
        abortController: undefined,
        previousPageData: undefined,
        resultsViewType: 'document',
      });
    });
    it('does not run aggregation when fetching nextPage on last page', async function () {
      const store = getMockedStore({
        pipeline: [],
        isLast: true,
        loading: false,
        documents: [
          { id: 1 }, { id: 2 }, { id: 3 },
        ],
        limit: 4,
        page: 1,
        resultsViewType: 'document',
      });
      const aggregateSpy = spy();
      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: {
          aggregate: aggregateSpy,
        }
      });
      await store.dispatch(fetchNextPage() as any);
      expect(aggregateSpy.callCount).to.equal(0);
    });
    it('runs aggregation when fetching prevPage', async function () {
      const store = getMockedStore({
        pipeline: [],
        isLast: false,
        loading: false,
        documents: [
          { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 },
        ],
        limit: 4,
        page: 2,
        resultsViewType: 'document',
      });

      const mockDocuments = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: new class {
          aggregate() {
            return Promise.resolve(mockDocuments);
          }
        }
      });

      await store.dispatch(fetchPrevPage() as any);

      expect(store.getState().aggregation).to.deep.equal({
        pipeline: [],
        documents: mockDocuments,
        isLast: false,
        page: 1,
        limit: 4,
        loading: false,
        error: undefined,
        abortController: undefined,
        previousPageData: undefined,
        resultsViewType: 'document',
      });
    });
    it('does not run aggregation when fetching prevPage on first page', async function () {
      const store = getMockedStore({
        pipeline: [],
        isLast: false,
        loading: false,
        documents: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 },
        ],
        limit: 4,
        page: 1,
        resultsViewType: 'document',
      });
      const aggregateSpy = spy();
      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: {
          aggregate: aggregateSpy,
        }
      });
      await store.dispatch(fetchPrevPage() as any);
      expect(aggregateSpy.callCount).to.equal(0);
    });
  });
  it('should switch results view type', function () {
    const store = getMockedStore({
      pipeline: [],
      isLast: false,
      loading: false,
      documents: [
        { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 },
      ],
      limit: 4,
      page: 2,
      resultsViewType: 'document',
    });

    expect(store.getState().aggregation.resultsViewType).to.equal('document')
    store.dispatch(changeViewType('json'));
    expect(store.getState().aggregation.resultsViewType).to.equal('json')
  });
});
