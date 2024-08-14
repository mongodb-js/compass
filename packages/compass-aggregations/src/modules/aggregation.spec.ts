import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { expect } from 'chai';
import { spy } from 'sinon';

import reducer, {
  runAggregation,
  fetchNextPage,
  fetchPrevPage,
  cancelAggregation,
  changeViewType,
} from './aggregation';
import type { State as AggregateState } from './aggregation';
import type { RootState } from '.';
import rootReducer from '../modules';
import configureStore from '../../test/configure-store';
import type { DataService } from './data-service';
import { createCancelError } from '@mongodb-js/compass-utils';
import HadronDocument from 'hadron-document';
import { omit } from 'lodash';
import { EJSON } from 'bson';
import { defaultPreferencesInstance } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { AggregationsStore } from '../stores/store';

const getMockedStore = (
  aggregation: AggregateState,
  dataService: DataService
): Store<RootState> => {
  const mockedState = {
    aggregationWorkspaceId: '0',
    aggregation,
    dataService: { dataService },
  };
  return createStore(
    rootReducer,
    mockedState,
    applyMiddleware(
      thunk.withExtraArgument({
        preferences: defaultPreferencesInstance,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        connectionInfoAccess: { getCurrentConnectionInfo: () => {} },
      })
    )
  );
};

const hadronDocsToJsonDocs = (docs: HadronDocument[]) => {
  return docs.map((doc) => {
    return EJSON.serialize(doc.generateOriginalObject());
  });
};

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
    const store: AggregationsStore = (
      await configureStore(
        { pipeline: [] },
        {
          aggregate() {
            return Promise.resolve(mockDocuments);
          },
        }
      )
    ).plugin.store;

    await store.dispatch(runAggregation() as any);
    const aggregation = store.getState().aggregation;

    expect(omit(aggregation, 'documents')).to.deep.equal({
      pipeline: [],
      isLast: true,
      page: 1,
      limit: 20,
      loading: false,
      error: undefined,
      abortController: undefined,
      previousPageData: undefined,
      resultsViewType: 'document',
    });

    expect(hadronDocsToJsonDocs(aggregation.documents)).to.deep.equal(
      mockDocuments
    );
  });

  it('cancels an aggregation', async function () {
    const documents = [{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }].map(
      (doc) => new HadronDocument(doc)
    );
    const store = getMockedStore(
      {
        pipeline: [],
        isLast: false,
        loading: false,
        documents,
        limit: 4,
        page: 2,
        resultsViewType: 'document',
      },
      {
        aggregate() {
          throw createCancelError();
        },
        isCancelError() {
          return true;
        },
      } as any
    );

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
      const mockDocuments = [{ id: 9 }, { id: 10 }, { id: 11 }, { id: 12 }];
      const store = getMockedStore(
        {
          pipeline: [],
          isLast: false,
          loading: false,
          documents: [{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }].map(
            (doc) => new HadronDocument(doc)
          ),
          limit: 4,
          page: 2,
          resultsViewType: 'document',
        },
        {
          aggregate() {
            return Promise.resolve(mockDocuments);
          },
        } as any
      );

      await store.dispatch(fetchNextPage() as any);
      const aggregation = store.getState().aggregation;

      expect(omit(aggregation, 'documents')).to.deep.equal({
        pipeline: [],
        isLast: false,
        page: 3,
        limit: 4,
        loading: false,
        error: undefined,
        abortController: undefined,
        previousPageData: undefined,
        resultsViewType: 'document',
      });

      expect(hadronDocsToJsonDocs(aggregation.documents)).to.deep.equal(
        mockDocuments
      );
    });
    it('does not run aggregation when fetching nextPage on last page', async function () {
      const aggregateSpy = spy();
      const store = getMockedStore(
        {
          pipeline: [],
          isLast: true,
          loading: false,
          documents: [{ id: 1 }, { id: 2 }, { id: 3 }].map(
            (doc) => new HadronDocument(doc)
          ),
          limit: 4,
          page: 1,
          resultsViewType: 'document',
        },
        {
          aggregate: aggregateSpy,
        } as any
      );
      await store.dispatch(fetchNextPage() as any);
      expect(aggregateSpy.callCount).to.equal(0);
    });
    it('runs aggregation when fetching prevPage', async function () {
      const mockDocuments = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      const store = getMockedStore(
        {
          pipeline: [],
          isLast: false,
          loading: false,
          documents: [{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }].map(
            (doc) => new HadronDocument(doc)
          ),
          limit: 4,
          page: 2,
          resultsViewType: 'document',
        },
        {
          aggregate() {
            return Promise.resolve(mockDocuments);
          },
        } as any
      );

      await store.dispatch(fetchPrevPage() as any);
      const aggregation = store.getState().aggregation;

      expect(omit(store.getState().aggregation, 'documents')).to.deep.equal({
        pipeline: [],
        isLast: false,
        page: 1,
        limit: 4,
        loading: false,
        error: undefined,
        abortController: undefined,
        previousPageData: undefined,
        resultsViewType: 'document',
      });

      expect(hadronDocsToJsonDocs(aggregation.documents)).to.deep.equal(
        mockDocuments
      );
    });
    it('does not run aggregation when fetching prevPage on first page', async function () {
      const aggregateSpy = spy();
      const store = getMockedStore(
        {
          pipeline: [],
          isLast: false,
          loading: false,
          documents: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }].map(
            (doc) => new HadronDocument(doc)
          ),
          limit: 4,
          page: 1,
          resultsViewType: 'document',
        },
        {
          aggregate: aggregateSpy,
        } as any
      );
      await store.dispatch(fetchPrevPage() as any);
      expect(aggregateSpy.callCount).to.equal(0);
    });
  });
  it('should switch results view type', function () {
    const store = getMockedStore(
      {
        pipeline: [],
        isLast: false,
        loading: false,
        documents: [{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }].map(
          (doc) => new HadronDocument(doc)
        ),
        limit: 4,
        page: 2,
        resultsViewType: 'document',
      },
      {} as any
    );

    expect(store.getState().aggregation.resultsViewType).to.equal('document');
    store.dispatch(changeViewType('json'));
    expect(store.getState().aggregation.resultsViewType).to.equal('json');
  });
});
