import type { AnyAction, Store } from 'redux';
import type { RootState } from '.';
import type { Document } from 'mongodb';
import { expect } from 'chai';
import reducer, {
  ActionTypes,
  setCollections,
  setCollectionFields,
  fetchCollectionFields,
} from './collections-fields';
import configureStore from '../../test/configure-store';
import { DATA_SERVICE_CONNECTED } from './data-service';
import sinon from 'sinon';

describe('collections-fields module', function () {
  describe('#reducer', function () {
    it('returns state when collections are fetched', function () {
      expect(
        reducer(undefined, {
          type: ActionTypes.CollectionsFetch,
          data: {
            'test.coll': {
              isLoading: false,
              fields: ['a', 'b'],
              type: 'collection',
            },
          },
        })
      ).to.deep.equal({
        'test.coll': {
          isLoading: false,
          fields: ['a', 'b'],
          type: 'collection',
        },
      });
    });
    it('returns state when collection data is updated', function () {
      expect(
        reducer(undefined, {
          type: ActionTypes.CollectionDataUpdated,
          collection: 'test.coll',
          data: {
            isLoading: true,
            fields: [],
            type: 'view',
          },
        })
      ).to.deep.equal({
        'test.coll': {
          isLoading: true,
          fields: [],
          type: 'view',
        },
      });
    });
    it('returns state when collection fields are fetched', function () {
      expect(
        reducer(undefined, {
          type: ActionTypes.CollectionFieldsFetched,
          collection: 'test.coll',
          fields: ['a', 'b', 'c'],
          collectionType: 'collection',
        })
      ).to.deep.equal({
        'test.coll': {
          isLoading: false,
          fields: ['a', 'b', 'c'],
          type: 'collection',
        },
      });
    });
  });
  describe('#actions', function () {
    let store: Store<RootState, AnyAction>;
    beforeEach(function () {
      store = configureStore({ pipeline: [] });
    });

    context('setCollections', function () {
      it('sets empty collections', async function () {
        await store.dispatch(setCollections([]) as any);
        expect(store.getState().collectionsFields).to.deep.equal({});
      });

      it('adds new collections with default values', async function () {
        await store.dispatch(
          setCollections([
            {
              name: 'test.coll',
              type: 'collection',
            },
          ]) as any
        );
        expect(store.getState().collectionsFields).to.deep.equal({
          'test.coll': {
            isLoading: false,
            fields: [],
            type: 'collection',
          },
        });
      });

      it('removes the collection when new data does not contain the collection', async function () {
        await store.dispatch(
          setCollections([
            {
              name: 'test.coll1',
              type: 'collection',
            },
            {
              name: 'test.coll2',
              type: 'collection',
            },
          ]) as any
        );
        await store.dispatch(
          setCollections([
            {
              name: 'test.coll2',
              type: 'collection',
            },
          ]) as any
        );
        expect(store.getState().collectionsFields).to.deep.equal({
          'test.coll2': {
            isLoading: false,
            fields: [],
            type: 'collection',
          },
        });
      });

      it('does not remove existing collection data when setting updated list', async function () {
        // set the collection
        await store.dispatch(
          setCollections([
            {
              name: 'test.coll',
              type: 'collection',
            },
          ]) as any
        );
        // set the collection fields
        await store.dispatch(
          setCollectionFields('test.coll', 'collection', ['a', 'b', 'c']) as any
        );

        await store.dispatch(
          setCollections([
            {
              name: 'test.coll',
              type: 'collection',
            },
            {
              name: 'test.coll2',
              type: 'collection',
            },
          ]) as any
        );
        expect(store.getState().collectionsFields).to.deep.equal({
          'test.coll': {
            isLoading: false,
            fields: ['a', 'b', 'c'],
            type: 'collection',
          },
          'test.coll2': {
            isLoading: false,
            fields: [],
            type: 'collection',
          },
        });
      });
    });

    context('setCollectionFields', function () {
      it('sets collection fields', async function () {
        await store.dispatch(
          setCollectionFields('test.coll', 'collection', ['a', 'b', 'c']) as any
        );
        expect(store.getState().collectionsFields).to.deep.equal({
          'test.coll': {
            isLoading: false,
            fields: ['a', 'b', 'c'],
            type: 'collection',
          },
        });
      });
    });

    context('fetchCollectionFields', function () {
      it('does nothing if fields are already fetched', async function () {
        await store.dispatch(
          setCollectionFields('test.coll', 'collection', ['a', 'b', 'c']) as any
        );
        await store.dispatch(fetchCollectionFields('test.coll') as any);
        expect(store.getState().collectionsFields).to.deep.equal({
          'test.coll': {
            isLoading: false,
            fields: ['a', 'b', 'c'],
            type: 'collection',
          },
        });
      });

      it('uses sample to fetch schema of a view', async function () {
        await store.dispatch(
          setCollections([
            {
              name: 'listings',
              type: 'view',
            },
          ]) as any
        );

        const spy = sinon.spy((ns: string, stage: Document) => {
          expect(ns).to.equal('test.listings');
          expect(stage).to.deep.equal({ size: 1 });
          return Promise.resolve([{ _id: 12, name: 'test' }]);
        });

        store.dispatch({
          type: DATA_SERVICE_CONNECTED,
          dataService: {
            sample: spy,
          },
        });

        await store.dispatch(fetchCollectionFields('listings') as any);

        expect(store.getState().collectionsFields['listings']).to.deep.equal({
          isLoading: false,
          fields: ['_id', 'name'],
          type: 'view',
        });

        expect(spy.calledOnce).to.equal(true);
      });

      it('uses find to fetch schema of a collection', async function () {
        await store.dispatch(
          setCollections([
            {
              name: 'listings',
              type: 'collection',
            },
          ]) as any
        );

        const spy = sinon.spy(
          (ns: string, filter: Document, options: Document) => {
            expect(ns).to.equal('test.listings');
            expect(filter).to.deep.equal({});
            expect(options).to.deep.equal({
              limit: 1,
              sort: { $natural: -1 },
            });
            return Promise.resolve([{ _id: 12, data: 'test' }]);
          }
        );

        store.dispatch({
          type: DATA_SERVICE_CONNECTED,
          dataService: {
            find: spy,
          },
        });

        await store.dispatch(fetchCollectionFields('listings') as any);

        expect(store.getState().collectionsFields['listings']).to.deep.equal({
          isLoading: false,
          fields: ['_id', 'data'],
          type: 'collection',
        });

        expect(spy.calledOnce).to.equal(true);
      });
    });
  });
});
