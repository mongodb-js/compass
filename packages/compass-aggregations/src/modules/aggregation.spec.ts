import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { expect } from 'chai';
import { spy, stub } from 'sinon';
import type { Document } from 'mongodb';

import reducer, { runAggregation, fetchNextPage, fetchPrevPage, cancelAggregation } from './aggregation';
import type { State as AggregateState } from './aggregation';
import type { RootState } from '.';
import rootReducer, { INITIAL_STATE } from '../modules';
import configureStore from '../stores/store';
import { DATA_SERVICE_CONNECTED } from './data-service';

const wait = (): Promise<void> => {
  return new Promise(resolve => setImmediate(resolve));
};

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
  toArray() {
    return Promise.resolve(this.options.documents);
  }
  close() { }
}

const getMockedStore = (aggregation: AggregateState): Store<RootState> => {
  const mockedState: RootState = {
    ...INITIAL_STATE,
    aggregationWorkspaceId: '0',
    aggregation,
  };
  return createStore(rootReducer, mockedState, applyMiddleware(thunk));
}

describe('aggregation module', function () {
  it('should return the initial state', function () {
    expect(reducer(undefined, {} as any)).to.deep.equal({
      documents: [],
      page: 1,
      limit: 20,
      isLast: false,
      loading: false,
    });
  });

  it('runs an aggregation', async function () {
    const mockDocuments = [{ id: 1 }, { id: 2 }];
    const aggregateMock = new AggregationCursorMock({
      hasNext: true,
      documents: mockDocuments,
    });
    const toArraySpy = spy(aggregateMock, 'toArray');

    const startSessionSpy = spy();

    const store: Store<RootState> = configureStore({});
    store.dispatch({
      type: DATA_SERVICE_CONNECTED,
      dataService: new class {
        startSession(client: string) {
          return startSessionSpy(client);
        }
        aggregate() {
          return aggregateMock;
        }
      }
    });

    await store.dispatch(runAggregation() as any);

    expect(startSessionSpy.getCalls().map(x => x.args), 'calls startSession with correct args').to.deep.equal([['CRUD']]);
    expect(toArraySpy.getCalls().map(x => x.args), 'calls toArray with correct args').to.deep.equal([[]]);

    expect(store.getState().aggregation).to.deep.equal({
      documents: mockDocuments,
      isLast: true,
      page: 1,
      limit: 20,
      loading: false,
      error: undefined,
      abortController: undefined,
      previousPageData: undefined,
    });
  });

  it('cancels an aggregation', async function () {
    const documents = [{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }];
    const store = getMockedStore({
      isLast: false,
      loading: false,
      documents,
      limit: 4,
      page: 2,
    });

    const aggregateMock = new AggregationCursorMock({
      hasNext: true,
      documents: [{ id: 9 }, { id: 10 }, { id: 11 }, { id: 12 }],
    });

    stub(aggregateMock, 'toArray').callsFake(async () => new Promise(() => { }));
    const cursorCloseSpy = spy(aggregateMock, 'close');

    const killSessionsSpy = spy();
    store.dispatch({
      type: DATA_SERVICE_CONNECTED,
      dataService: new class {
        startSession() {
          return {};
        }
        killSessions() {
          killSessionsSpy();
          return Promise.resolve();
        }
        aggregate() {
          return aggregateMock;
        }
      }
    });

    store.dispatch(fetchNextPage() as any);
    // now cancel while its fetching data
    await store.dispatch(cancelAggregation() as any);

    await wait();

    expect(killSessionsSpy.getCalls().map(x => x.args), 'calls killSessions with correct args').to.deep.equal([[]]);
    expect(cursorCloseSpy.getCalls().map(x => x.args), 'calls cursorClose with correct args').to.deep.equal([[]]);
    expect(store.getState().aggregation).to.deep.equal({
      documents,
      isLast: false,
      page: 2,
      limit: 4,
      loading: false,
      error: undefined,
      abortController: undefined,
      previousPageData: undefined,
    });
  });

  describe('paginates data', function () {
    it('nextPage -> not on last page', async function () {
      const store = getMockedStore({
        isLast: false,
        loading: false,
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
      const toArraySpy = spy(aggregateMock, 'toArray');
      const startSessionSpy = spy();
      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: new class {
          startSession(client: string) {
            return startSessionSpy(client);
          }
          aggregate() {
            return aggregateMock;
          }
        }
      });

      await store.dispatch(fetchNextPage() as any);

      await wait();

      expect(startSessionSpy.firstCall.args, 'calls startSession with correct args').to.deep.equal(['CRUD']);
      expect(toArraySpy.firstCall.args, 'calls toArray with correct args').to.deep.equal([]);

      expect(store.getState().aggregation).to.deep.equal({
        documents: mockDocuments,
        isLast: false,
        page: 3,
        limit: 4,
        loading: false,
        error: undefined,
        abortController: undefined,
        previousPageData: undefined,
      });
    });
    it('nextPage -> on last page', async function () {
      const store = getMockedStore({
        isLast: true,
        loading: false,
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
        loading: false,
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
      const toArraySpy = spy(aggregateMock, 'toArray');
      const startSessionSpy = spy();

      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: new class {
          startSession(client: string) {
            return startSessionSpy(client);
          }
          aggregate() {
            return aggregateMock;
          }
        }
      });

      await store.dispatch(fetchPrevPage() as any);

      await wait();

      expect(startSessionSpy.firstCall.args, 'calls startSession with correct args').to.deep.equal(['CRUD']);
      expect(toArraySpy.firstCall.args, 'calls toArray with correct args').to.deep.equal([]);

      expect(store.getState().aggregation).to.deep.equal({
        documents: mockDocuments,
        isLast: false,
        page: 1,
        limit: 4,
        loading: false,
        error: undefined,
        abortController: undefined,
        previousPageData: undefined,
      });
    });
    it('prevPage -> on first page', async function () {
      const store = getMockedStore({
        isLast: false,
        loading: false,
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
  });
});
