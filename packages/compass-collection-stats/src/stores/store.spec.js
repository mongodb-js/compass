import { expect } from 'chai';
import InstanceModel from 'mongodb-instance-model';
import configureStore from './';

const instance = new InstanceModel({
  databases: [
    {
      _id: 'foo',
      collections: [{ _id: 'foo.bar', type: 'collection' }],
    },
    {
      _id: 'baz',
      collections: [{ _id: 'baz.meow', type: 'collection' }],
    },
    {
      _id: 'bar',
      collections: [
        {
          _id: 'bar.woof',
          type: 'collection',
          status: 'ready',
          document_count: 100,
          avg_document_size: 1000,
          storage_size: 100000,
          free_storage_size: 0,
          index_count: 5,
          index_size: 50000,
        },
      ],
    },
  ],
});

const globalAppRegistry = {
  getStore() {
    return {
      getState() {
        return { instance };
      },
    };
  },
  on() {},
};

describe('CollectionStats [store]', function () {
  describe('#configureStore', function () {
    it('configures and returns singleton store instance even for different namespaces', function () {
      const a = configureStore({ globalAppRegistry, namespace: 'foo.bar' });
      const b = configureStore({ globalAppRegistry, namespace: 'baz.meow' });

      expect(a).to.eq(b);
    });

    it('sets default values for the collection stats when stats are missing', function () {
      const store = configureStore({ globalAppRegistry, namespace: 'foo.bar' });
      expect(store.state).to.deep.eq({
        namespace: 'foo.bar',
        isEditing: false,
        isReadonly: false,
        isTimeSeries: false,
        documentCount: 'N/A',
        storageSize: 'N/A',
        avgDocumentSize: 'N/A',
        indexCount: 'N/A',
        totalIndexSize: 'N/A',
        avgIndexSize: 'N/A',
      });
    });

    it('sets formatted values for the collection where stats are fetched', function () {
      const store = configureStore({
        globalAppRegistry,
        namespace: 'bar.woof',
      });
      expect(store.state).to.deep.eq({
        namespace: 'bar.woof',
        isEditing: false,
        isReadonly: false,
        isTimeSeries: false,
        documentCount: '100',
        storageSize: '100.0KB',
        avgDocumentSize: '1KB',
        indexCount: '5',
        totalIndexSize: '50.0KB',
        avgIndexSize: '10.0KB',
      });
    });

    it('updates state when collection updates', function () {
      const store = configureStore({
        globalAppRegistry,
        namespace: 'baz.meow',
      });

      expect(store.state).to.deep.eq({
        namespace: 'baz.meow',
        isEditing: false,
        isReadonly: false,
        isTimeSeries: false,
        documentCount: 'N/A',
        storageSize: 'N/A',
        avgDocumentSize: 'N/A',
        indexCount: 'N/A',
        totalIndexSize: 'N/A',
        avgIndexSize: 'N/A',
      });

      instance.databases.get('baz').collections.get('meow', 'name').set({
        status: 'ready',
        document_count: 5,
        storage_size: 10,
        free_storage_size: 0,
        avg_document_size: 2,
        index_count: 10,
        index_size: 20,
      });

      expect(store.state).to.deep.eq({
        namespace: 'baz.meow',
        isEditing: false,
        isReadonly: false,
        isTimeSeries: false,
        documentCount: '5',
        storageSize: '10B',
        avgDocumentSize: '2B',
        indexCount: '10',
        totalIndexSize: '20B',
        avgIndexSize: '2B',
      });
    });

    it('resets collection stats to initial values on error', function () {
      const store = configureStore({
        globalAppRegistry,
        namespace: 'bar.woof',
      });

      expect(store.state).to.deep.eq({
        namespace: 'bar.woof',
        isEditing: false,
        isReadonly: false,
        isTimeSeries: false,
        documentCount: '100',
        storageSize: '100.0KB',
        avgDocumentSize: '1KB',
        indexCount: '5',
        totalIndexSize: '50.0KB',
        avgIndexSize: '10.0KB',
      });

      instance.databases.get('bar').collections.get('woof', 'name').set({
        status: 'error',
      });

      expect(store.state).to.deep.eq({
        namespace: 'bar.woof',
        isEditing: false,
        isReadonly: false,
        isTimeSeries: false,
        documentCount: 'N/A',
        storageSize: 'N/A',
        avgDocumentSize: 'N/A',
        indexCount: 'N/A',
        totalIndexSize: 'N/A',
        avgIndexSize: 'N/A',
      });
    });
  });
});
