import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import schemaFixture from '../../test/fixtures/array_of_docs.fixture.json';
import { activatePlugin } from './store';
import { expect } from 'chai';
import sinon from 'sinon';
import { schemaFieldsToAutocompleteItems } from '../modules/fields';
import { once } from 'events';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

describe('FieldStore', function () {
  let deactivate = () => {};
  let store: ReturnType<typeof activatePlugin>['store'];
  let appRegistry: AppRegistry;
  const connectionInfo: ConnectionInfo = {
    id: '1234',
    connectionOptions: {
      connectionString: 'mongodb://webscales.com:27017',
    },
  };

  async function documentsChanged(
    docs: any | any[],
    eventName = 'documents-refreshed'
  ) {
    appRegistry.emit(eventName, {
      connectionInfo,
      ns: 'test.test',
      docs: Array.isArray(docs) ? docs : [docs],
    });
    await once(appRegistry, 'fields-changed');
  }

  function schemaChanged(schema: any = schemaFixture) {
    appRegistry.emit('schema-analyzed', {
      connectionInfo,
      ns: 'test.test',
      schema,
    });
  }

  beforeEach(function () {
    appRegistry = new AppRegistry();
    sinon.spy(appRegistry, 'emit');
    ({ store, deactivate } = activatePlugin(
      {},
      { globalAppRegistry: appRegistry },
      createActivateHelpers()
    ));
  });

  afterEach(function () {
    deactivate();
  });

  it('has an initial state', function () {
    expect(store.getState()).to.deep.equal({});
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
      schemaChanged();
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
      await documentsChanged(doc, 'documents-refreshed');
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
      await documentsChanged(doc, 'document-inserted');
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
      await documentsChanged(doc, 'documents-paginated');
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

  describe('emits appReg event on change', function () {
    it('triggers for store methods', async function () {
      const doc = { harry: 1, potter: true };
      await documentsChanged(doc);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(appRegistry.emit).to.have.been.calledWithMatch('fields-changed', {
        connectionInfo,
        ns: 'test.test',
        fields: {
          harry: { name: 'harry', path: ['harry'], count: 1, type: 'Number' },
          potter: {
            name: 'potter',
            path: ['potter'],
            count: 1,
            type: 'Boolean',
          },
        },
        topLevelFields: ['harry', 'potter'],
        autocompleteFields: [
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
        ],
      });
    });
  });

  describe('store process methods', function () {
    it('samples a single document', async function () {
      const doc = { harry: 1, potter: true };
      await documentsChanged(doc);
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
      await documentsChanged(docs);
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
      await documentsChanged(doc);
      const doc2 = { hermione: 0, granger: false };
      await documentsChanged(doc2);
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
      await documentsChanged(doc);
      schemaChanged();
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
      await documentsChanged({ a: { b: { c: 1 } } });
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(state.fields).to.have.all.keys(['a', 'a.b', 'a.b.c']);
    });

    it('maintains list of root fields', async function () {
      await documentsChanged({ a: { b: { c: 1 } }, d: 5, e: { f: 3 } });
      const state = store.getState()[connectionInfo.id]['test.test'];
      expect(state.topLevelFields).to.have.all.members(['a', 'd', 'e']);
    });

    describe('multidimensional arrays', function () {
      it('identifies empty 1d arrays', async function () {
        await documentsChanged({ a: [] });
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
        await documentsChanged({ a: [1, 2, 3] });
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
        await documentsChanged({
          a: [
            ['1_1', '1_2', '1_3'],
            ['2_1', '2_2', '2_3'],
          ],
        });
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
        await documentsChanged({
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
        });
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
        await documentsChanged({
          a: [
            ['1_1', '1_2', '1_3'],
            ['2_1', '2_2', '2_3'],
          ],
        });

        // Call that matters, the one that should be kept around
        await documentsChanged({ a: [1, 2, 3] });

        expect(
          store.getState()[connectionInfo.id]['test.test'].fields
        ).to.be.deep.equal(expected);
      });
    });

    describe('mixed nested arrays and subdocuments', function () {
      it('identifies 1d arrays of subdocuments', async function () {
        await documentsChanged({ a: [{ b: 'foo' }, { b: 'bar' }] });
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
        await documentsChanged({
          a: [
            [{ b: 'foo' }, { b: 'bar' }],
            [{ b: 'foo' }, { b: 'bar' }],
          ],
        });
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
        await documentsChanged({
          a: [{ b: { c: 'foo' } }, { b: { c: 'bar' } }],
        });
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
        await documentsChanged({
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
        });
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
        await documentsChanged(doc);
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
        await documentsChanged(doc);
        const state = store.getState()[connectionInfo.id]['test.test'];
        expect(state.fields).to.be.deep.equal(expected);
      });
    });
  });
});
