import schemaFixture from '../../test/fixtures/array_of_docs.fixture.json';
import type { activatePlugin } from './store';
import { expect } from 'chai';
import { schemaFieldsToAutocompleteItems } from '../modules/fields';
import type { Schema } from 'mongodb-schema';
import {
  activatePluginWithConnections,
  cleanup,
} from '@mongodb-js/compass-connections/test';
import FieldStorePlugin from '..';
import { documentsUpdated, schemaUpdated } from '../modules';

describe('FieldStore', function () {
  let store: ReturnType<typeof activatePlugin>['store'];
  let connectionsStore: any;
  const connectionInfo = { id: '1234' };
  const updateFieldsFromDocuments = (
    ns: string,
    docs: any[],
    connectionId = connectionInfo.id
  ) => {
    return store.dispatch(documentsUpdated(connectionId, ns, docs));
  };
  const updateFieldsFromSchema = (
    ns: string,
    schema: any,
    connectionId = connectionInfo.id
  ) => {
    return store.dispatch(schemaUpdated(connectionId, ns, schema));
  };

  beforeEach(async function () {
    const result = await activatePluginWithConnections(FieldStorePlugin, {});
    store = result.plugin.store;
    connectionsStore = result.connectionsStore;
  });

  afterEach(function () {
    cleanup();
  });

  it('has an initial state', function () {
    expect(store.getState()).to.deep.equal({});
  });

  context('when connection is disconnected', function () {
    beforeEach(async function () {
      await updateFieldsFromDocuments('mflix.movies', [{ name: 'Compass' }]);
      await updateFieldsFromDocuments(
        'mflix.movies',
        [{ name: 'Compass' }],
        'QWERTY'
      );
      expect(store.getState()).to.have.keys(['1234', 'QWERTY']);
    });
    it('removes the namespaces information for the disconnected connection', function () {
      connectionsStore.actions.disconnect('QWERTY');
      expect(store.getState()).to.have.keys(['1234']);
      connectionsStore.actions.disconnect('1234');
      expect(Object.keys(store.getState())).to.be.of.length(0);
    });
  });

  describe('#onActivated', function () {
    const doc = { harry: 1, potter: true };
    const expected = [
      {
        name: 'harry',
        value: 'harry',
        score: 1,
        meta: 'field',
        version: '0.0.0',
        description: 'Number',
      },
      {
        name: 'potter',
        value: 'potter',
        score: 1,
        meta: 'field',
        version: '0.0.0',
        description: 'Boolean',
      },
    ];

    it('on schema store trigger', function () {
      updateFieldsFromSchema('test.test', schemaFixture as Schema);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(Object.keys(state.fields)).to.have.all.members([
        '_id',
        'review',
        'review._id',
        'review.rating',
        'review.text',
        'reviews',
        'reviews._id',
        'reviews.rating',
        'reviews.text',
      ]);
    });

    it('on documents-refreshed', async function () {
      await updateFieldsFromDocuments('test.test', [doc]);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(Object.keys(state.fields)).to.have.all.members([
        'harry',
        'potter',
      ]);
      expect(schemaFieldsToAutocompleteItems(state.fields)).to.deep.equal(
        expected
      );
    });

    it('on document-inserted', async function () {
      await updateFieldsFromDocuments('test.test', [doc]);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(Object.keys(state.fields)).to.have.all.members([
        'harry',
        'potter',
      ]);
      expect(schemaFieldsToAutocompleteItems(state.fields)).to.deep.equal(
        expected
      );
    });

    it('on documents-paginated', async function () {
      await updateFieldsFromDocuments('test.test', [doc]);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(Object.keys(state.fields)).to.have.all.members([
        'harry',
        'potter',
      ]);
      expect(schemaFieldsToAutocompleteItems(state.fields)).to.deep.equal(
        expected
      );
    });
  });

  describe('store process methods', function () {
    it('samples a single document', async function () {
      const doc = { harry: 1, potter: true };
      await updateFieldsFromDocuments('test.test', [doc]);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(Object.keys(state.fields)).to.have.all.members([
        'harry',
        'potter',
      ]);
      expect(schemaFieldsToAutocompleteItems(state.fields)).to.deep.equal([
        {
          name: 'harry',
          value: 'harry',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Number',
        },
        {
          name: 'potter',
          value: 'potter',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Boolean',
        },
      ]);
    });

    it('samples many documents', async function () {
      const docs = [
        { harry: 1, potter: true },
        { ron: 'test', weasley: null },
      ];
      await updateFieldsFromDocuments('test.test', docs);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(Object.keys(state.fields)).to.have.all.members([
        'harry',
        'potter',
        'ron',
        'weasley',
      ]);
      expect(schemaFieldsToAutocompleteItems(state.fields)).to.deep.equal([
        {
          name: 'harry',
          value: 'harry',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Number | Undefined',
        },
        {
          name: 'potter',
          value: 'potter',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Boolean | Undefined',
        },
        {
          name: 'ron',
          value: 'ron',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'String | Undefined',
        },
        {
          name: 'weasley',
          value: 'weasley',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Null | Undefined',
        },
      ]);
    });

    it('merges new docs with the existing state', async function () {
      const doc = { harry: 1, potter: true };
      await updateFieldsFromDocuments('test.test', [doc]);
      const doc2 = { hermione: 0, granger: false };
      await updateFieldsFromDocuments('test.test', [doc2]);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(Object.keys(state.fields)).to.have.all.members([
        'harry',
        'potter',
        'hermione',
        'granger',
      ]);
      expect(schemaFieldsToAutocompleteItems(state.fields)).to.deep.equal([
        {
          name: 'harry',
          value: 'harry',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Number',
        },
        {
          name: 'potter',
          value: 'potter',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Boolean',
        },
        {
          name: 'granger',
          value: 'granger',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Boolean',
        },
        {
          name: 'hermione',
          value: 'hermione',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Number',
        },
      ]);
    });

    it('merges a schema with the existing state', async function () {
      const doc = { harry: 1, potter: true };
      await updateFieldsFromDocuments('test.test', [doc]);
      updateFieldsFromSchema('test.test', schemaFixture as Schema);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(Object.keys(state.fields)).to.have.all.members([
        'harry',
        'potter',
        '_id',
        'review',
        'review._id',
        'review.rating',
        'review.text',
        'reviews',
        'reviews._id',
        'reviews.rating',
        'reviews.text',
      ]);
      expect(schemaFieldsToAutocompleteItems(state.fields)).to.deep.equal([
        {
          name: 'harry',
          value: 'harry',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Number',
        },
        {
          name: 'potter',
          value: 'potter',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Boolean',
        },
        {
          name: '_id',
          value: '_id',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'ObjectId',
        },
        {
          name: 'review',
          value: 'review',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Undefined | Document',
        },
        {
          name: 'review._id',
          value: 'review._id',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Number',
        },
        {
          name: 'review.rating',
          value: 'review.rating',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Number',
        },
        {
          name: 'review.text',
          value: 'review.text',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'String',
        },
        {
          name: 'reviews',
          value: 'reviews',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Array | Undefined',
        },
        {
          name: 'reviews._id',
          value: 'reviews._id',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Number | Undefined',
        },
        {
          name: 'reviews.rating',
          value: 'reviews.rating',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'Number | Undefined',
        },
        {
          name: 'reviews.text',
          value: 'reviews.text',
          score: 1,
          meta: 'field',
          version: '0.0.0',
          description: 'String | Undefined',
        },
      ]);
    });

    it('flattens the schema', async function () {
      const doc = { a: { b: { c: 1 } } };
      await updateFieldsFromDocuments('test.test', [doc]);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(state.fields).to.have.all.keys(['a', 'a.b', 'a.b.c']);
    });

    it('maintains list of root fields', async function () {
      const doc = { a: { b: { c: 1 } }, d: 5, e: { f: 3 } };
      await updateFieldsFromDocuments('test.test', [doc]);
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(state.topLevelFields).to.have.all.members(['a', 'd', 'e']);
    });

    describe('multidimensional arrays', function () {
      it('identifies empty 1d arrays', async function () {
        const doc = { a: [] };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        const expected = {
          a: {
            count: 1,
            name: 'a',
            path: ['a'],
            type: 'Array',
          },
        };
        expect(state.fields).to.be.deep.equal(expected);
      });

      it('identifies populated 1d arrays', async function () {
        const doc = { a: [1, 2, 3] };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        const expected = {
          a: {
            count: 1,
            name: 'a',
            path: ['a'],
            type: 'Array',
          },
        };
        expect(state.fields).to.be.deep.equal(expected);
      });

      it('identifies 2d arrays', async function () {
        const doc = {
          a: [
            ['1_1', '1_2', '1_3'],
            ['2_1', '2_2', '2_3'],
          ],
        };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        const expected = {
          a: {
            count: 1,
            name: 'a',
            path: ['a'],
            type: 'Array',
          },
        };
        expect(state.fields).to.be.deep.equal(expected);
      });

      it('identifies 3d arrays', async function () {
        const doc = {
          a: [
            // Think cube
            [
              ['1_1_1', '1_1_2'],
              ['1_2_1', '1_2_2'],
            ],
            [
              ['2_1_1', '2_1_2'],
              ['2_2_1', '2_2_2'],
            ],
          ],
        };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        const expected = {
          a: {
            count: 1,
            name: 'a',
            path: ['a'],
            type: 'Array',
          },
        };
        expect(state.fields).to.be.deep.equal(expected);
      });

      it('multiple calls chooses latest array definition', async function () {
        // Ideally in this polymorphic case we'd store all the types,
        // but that's much harder to reason about and not needed at this time
        const expected = {
          a: {
            count: 2,
            name: 'a',
            path: ['a'],
            type: 'Array',
          },
        };
        // Should effectively be a no-op call
        const doc1 = {
          a: [
            ['1_1', '1_2', '1_3'],
            ['2_1', '2_2', '2_3'],
          ],
        };
        await updateFieldsFromDocuments('test.test', [doc1]);

        // Call that matters, the one that should be kept around
        const doc2 = { a: [1, 2, 3] };
        await updateFieldsFromDocuments('test.test', [doc2]);

        expect(
          store.getState()[connectionInfo.id]['test.test'].fields
        ).to.be.deep.equal(expected);
      });
    });

    describe('mixed nested arrays and subdocuments', function () {
      it('identifies 1d arrays of subdocuments', async function () {
        const doc = { a: [{ b: 'foo' }, { b: 'bar' }] };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        const expected = {
          a: {
            count: 1,
            name: 'a',
            path: ['a'],
            type: 'Array',
          },
          'a.b': {
            count: 2,
            name: 'b',
            path: ['a', 'b'],
            type: 'String',
          },
        };
        expect(state.fields).to.be.deep.equal(expected);
      });

      it('identifies 2d arrays of subdocuments', async function () {
        const doc = {
          a: [
            [{ b: 'foo' }, { b: 'bar' }],
            [{ b: 'foo' }, { b: 'bar' }],
          ],
        };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        const expected = {
          a: {
            count: 1,
            name: 'a',
            path: ['a'],
            type: 'Array',
          },
          'a.b': {
            count: 4,
            name: 'b',
            path: ['a', 'b'],
            type: 'String',
          },
        };
        expect(state.fields).to.be.deep.equal(expected);
      });

      it('identifies 1d arrays of sub-subdocuments', async function () {
        const doc = {
          a: [{ b: { c: 'foo' } }, { b: { c: 'bar' } }],
        };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        const expected = {
          a: {
            count: 1,
            name: 'a',
            path: ['a'],
            type: 'Array',
          },
          'a.b': {
            count: 2,
            name: 'b',
            path: ['a', 'b'],
            type: 'Document',
          },
          'a.b.c': {
            count: 2,
            name: 'c',
            path: ['a', 'b', 'c'],
            type: 'String',
          },
        };
        expect(state.fields).to.be.deep.equal(expected);
      });

      it('identifies subdocuments of 1d arrays of sub-subdocuments of 2d arrays', async function () {
        // At this point just spot-checking the recursion because I can
        const expected = {
          a: {
            count: 1,
            name: 'a',
            path: ['a'],
            type: 'Document',
          },
          'a.b': {
            count: 1,
            name: 'b',
            path: ['a', 'b'],
            type: 'Array',
          },
          'a.b.c': {
            count: 2,
            name: 'c',
            path: ['a', 'b', 'c'],
            type: 'Document',
          },
          'a.b.c.d': {
            count: 2,
            name: 'd',
            path: ['a', 'b', 'c', 'd'],
            type: 'Array',
          },
        };
        const doc = {
          a: {
            b: [
              {
                c: {
                  d: [
                    [1, 2],
                    [3, 4],
                  ],
                },
              },
              {
                c: {
                  d: [
                    [5, 6],
                    [7, 8],
                  ],
                },
              },
            ],
          },
        };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        expect(state.fields).to.be.deep.equal(expected);
      });
    });

    describe('collisions of name/path/count/type within a single document', function () {
      it('handles name', async function () {
        const expected = {
          foo1: {
            count: 1,
            name: 'foo1',
            path: ['foo1'],
            type: 'Array',
          },
          'foo1.age': {
            count: 1,
            name: 'age',
            path: ['foo1', 'age'],
            type: 'Number',
          },
          // The following was a string, not a field
          'foo1.name': {
            count: 1,
            name: 'name',
            path: ['foo1', 'name'],
            type: 'String',
          },
        };
        const doc = {
          foo1: [{ age: 10, name: 'bazillion' }],
        };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        expect(state.fields).to.be.deep.equal(expected);
      });
      it('handles path', async function () {
        const expected = {
          foo1: {
            count: 1,
            name: 'foo1',
            path: ['foo1'],
            type: 'Array',
          },
          'foo1.age': {
            count: 1,
            name: 'age',
            path: ['foo1', 'age'],
            type: 'Number',
          },
          // The following was a string, not a field
          'foo1.path': {
            count: 1,
            name: 'path',
            path: ['foo1', 'path'],
            type: 'String',
          },
        };
        const doc = {
          foo1: [{ age: 10, path: 'bazillion' }],
        };
        await updateFieldsFromDocuments('test.test', [doc]);
        const state = store.getState()[connectionInfo.id]['test.test'];
        expect(state.fields).to.be.deep.equal(expected);
      });
    });
  });
});
