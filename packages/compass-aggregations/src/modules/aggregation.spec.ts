import type { AnyAction, Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { Document } from 'mongodb';


import reducer, { runAggregation, fetchNextPage, fetchPrevPage } from './aggregation';
import type { State as AggregateState } from './aggregation';
import type { RootState } from '.';
import rootReducer, { INITIAL_STATE } from '../modules';
import configureStore from '../stores/store';
import { DATA_SERVICE_CONNECTED } from './data-service';

class AggregationCursorMock {
  constructor(public options: {
    hasNext: boolean;
    documents: Document[];
    skip?: number;
    limit?: number;
  }) {
  }
  skip(count: number) {
    this.options.skip = count;
    return this;
  }
  limit(count: number) {
    this.options.limit = count;
    return this;
  }
  hasNext() {
    return Promise.resolve(this.options.hasNext);
  }
  toArray() {
    return Promise.resolve(this.options.documents);
  }
}

const getMockedStore = (aggregation: AggregateState): Store<RootState> => {
  const mockedState: RootState = {
    ...INITIAL_STATE,
    aggregation,
  };
  return createStore(rootReducer, mockedState, applyMiddleware(thunk));
}

describe('aggregation module', function () {
  it('should return the initial state', function () {
    expect(reducer(undefined, {} as AnyAction)).to.deep.equal({
      documents: [],
      page: 0,
      limit: 20,
      isLast: false,
    });
  });

  it('runs an aggregation', async function () {
    const mockDocuments = [{ id: 1 }, { id: 2 }];
    const aggregateMock = new AggregationCursorMock({
      hasNext: true,
      documents: mockDocuments,
    });
    const skipSpy = spy(aggregateMock, 'skip');
    const limitSpy = spy(aggregateMock, 'limit');
    const hasNextSpy = spy(aggregateMock, 'hasNext');
    const toArraySpy = spy(aggregateMock, 'toArray');

    const store: Store<RootState> = configureStore({});
    store.dispatch({
      type: DATA_SERVICE_CONNECTED,
      dataService: new class {
        aggregate() {
          return aggregateMock;
        }
      }
    });

    await store.dispatch(runAggregation() as any);

    expect(skipSpy.getCalls().map(x => x.args), 'calls skip with correct args').to.deep.equal([[0]]);
    expect(limitSpy.getCalls().map(x => x.args), 'calls skip with correct args').to.deep.equal([[20]]);
    expect(hasNextSpy.getCalls().map(x => x.args), 'calls skip with correct args').to.deep.equal([[]]);
    expect(toArraySpy.getCalls().map(x => x.args), 'calls skip with correct args').to.deep.equal([[]]);

    const {
      aggregation: { documents, isLast, limit, page }
    } = store.getState();

    expect(documents).to.deep.equal(mockDocuments);
    expect(isLast).to.equal(true);
    expect(page).to.equal(1);
    expect(limit).to.equal(20);
  });

  describe('paginates data', function () {
    it('nextPage -> not on last page', async function () {
      const store = getMockedStore({
        isLast: false,
        documents: [
          { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 },
        ],
        limit: 4,
        page: 2,
      });

      const mockDocuments = [{ id: 9 }, { id: 10 }, { id: 11 }, { id: 12 }];
      const aggregateMock = new AggregationCursorMock({
        hasNext: true,
        documents: mockDocuments,
      });
      const skipSpy = spy(aggregateMock, 'skip');
      const limitSpy = spy(aggregateMock, 'limit');
      const hasNextSpy = spy(aggregateMock, 'hasNext');
      const toArraySpy = spy(aggregateMock, 'toArray');

      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: new class {
          aggregate() {
            return aggregateMock;
          }
        }
      });

      await store.dispatch(fetchNextPage() as any);

      expect(skipSpy.firstCall.args, 'calls skip with correct args').to.deep.equal([8]);
      expect(limitSpy.firstCall.args, 'calls skip with correct args').to.deep.equal([4]);
      expect(hasNextSpy.firstCall.args, 'calls skip with correct args').to.deep.equal([]);
      expect(toArraySpy.firstCall.args, 'calls skip with correct args').to.deep.equal([]);

      await Promise.resolve();

      const {
        aggregation: { documents, isLast, limit, page }
      } = store.getState();

      expect(documents).to.deep.equal(mockDocuments);
      expect(isLast).to.equal(false);
      expect(page).to.equal(3);
      expect(limit).to.equal(4);
    });
    it('nextPage -> on last page', async function () {
      const store = getMockedStore({
        isLast: true,
        documents: [
          { id: 1 }, { id: 2 }, { id: 3 },
        ],
        limit: 4,
        page: 1,
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
    it('prevPage -> not on first page', async function () {
      const store = getMockedStore({
        isLast: false,
        documents: [
          { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 },
        ],
        limit: 4,
        page: 2,
      });

      const mockDocuments = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      const aggregateMock = new AggregationCursorMock({
        hasNext: true,
        documents: mockDocuments,
      });
      const skipSpy = spy(aggregateMock, 'skip');
      const limitSpy = spy(aggregateMock, 'limit');
      const hasNextSpy = spy(aggregateMock, 'hasNext');
      const toArraySpy = spy(aggregateMock, 'toArray');

      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: new class {
          aggregate() {
            return aggregateMock;
          }
        }
      });

      await store.dispatch(fetchPrevPage() as any);

      expect(skipSpy.firstCall.args, 'calls skip with correct args').to.deep.equal([0]);
      expect(limitSpy.firstCall.args, 'calls skip with correct args').to.deep.equal([4]);
      expect(hasNextSpy.firstCall.args, 'calls skip with correct args').to.deep.equal([]);
      expect(toArraySpy.firstCall.args, 'calls skip with correct args').to.deep.equal([]);

      await Promise.resolve();

      const {
        aggregation: { documents, isLast, limit, page }
      } = store.getState();

      expect(documents).to.deep.equal(mockDocuments);
      expect(isLast).to.equal(false);
      expect(page).to.equal(1);
      expect(limit).to.equal(4);
    });
    it('prevPage -> on first page', async function () {
      const store = getMockedStore({
        isLast: false,
        documents: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 },
        ],
        limit: 4,
        page: 1,
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
  })
});
