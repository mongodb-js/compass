import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
const schemaFixture = require('../../test/fixtures/array_of_docs.fixture.json');
import configureStore from './';
import { reset } from '../modules/reset';
import { INITIAL_STATE } from '../modules';
import { expect } from 'chai';
import sinon from 'sinon';

const SchemaStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { samplingState: 'complete', schema: {} };
  },
  setSchema() {
    this.setState({ schema: schemaFixture });
  },
});

describe('FieldStore', function () {
  let unsubscribe = () => {};
  let store;
  let appRegistry;

  function subscribe(fn, done) {
    return store.subscribe(() => {
      try {
        const isDone = fn();
        if (isDone === false) {
          return;
        }
        done();
      } catch (err) {
        done(err);
      }
    });
  }

  beforeEach(function () {
    appRegistry = new AppRegistry();
    appRegistry.registerStore('Schema.Store', SchemaStore);
    store = configureStore({ localAppRegistry: appRegistry });
    store.dispatch(reset());
    expect(store.getState()).to.deep.equal(INITIAL_STATE);
  });

  afterEach(function () {
    unsubscribe();
  });

  it('has an initial state', function () {
    expect(store.getState()).to.deep.equal(INITIAL_STATE);
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

    it('on schema store trigger', function (done) {
      unsubscribe = subscribe(() => {
        const state = store.getState();
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
      }, done);
      SchemaStore.setSchema();
    });

    it('on documents-refreshed', function (done) {
      unsubscribe = subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members([
          'harry',
          'potter',
        ]);
        expect(state.autocompleteFields).to.deep.equal(expected);
      }, done);
      appRegistry.emit('documents-refreshed', doc);
    });

    it('on documents-inserted', function (done) {
      unsubscribe = subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members([
          'harry',
          'potter',
        ]);
        expect(state.autocompleteFields).to.deep.equal(expected);
      }, done);
      appRegistry.emit('document-inserted', { docs: [doc] });
    });

    it('on documents-paginated', function (done) {
      unsubscribe = subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members([
          'harry',
          'potter',
        ]);
        expect(state.autocompleteFields).to.deep.equal(expected);
      }, done);
      appRegistry.emit('documents-paginated', doc);
    });
  });
  /**
   * TODO (lucas): Test needs to be rewritten as spying on
   * `appRegistry.emit` this way is no longer valid.
   */
  describe.skip('emits appReg event on change', function () {
    let spy;

    before(function () {
      spy = sinon.spy();
      appRegistry.emit = spy;
    });

    after(function () {
      spy = null;
    });

    it('triggers for store methods', function () {
      const doc = { harry: 1, potter: true };
      store.processSingleDocument(doc);
      unsubscribe = subscribe(() => {
        expect(spy.calledTwice).to.equal(true);
        expect(spy.args[0][0]).to.equal('fields-changed');
        expect(spy.args[0][1]).to.deep.equal({
          fields: {},
          topLevelFields: [],
          autocompleteFields: [],
        });
        expect(spy.args[1][0]).to.equal('fields-changed');
        expect(Object.keys(spy.args[1][1].fields)).to.have.all.members([
          'harry',
          'potter',
        ]);
        expect(spy.args[1][1].autocompleteFields).to.deep.equal([
          {
            name: 'harry',
            value: 'harry',
            score: 1,
            meta: 'field',
            version: '0.0.0',
          },
          {
            name: 'potter',
            value: 'potter',
            score: 1,
            meta: 'field',
            version: '0.0.0',
          },
        ]);
      });
    });
  });

  describe('store process methods', function () {
    it('samples a single document', function (done) {
      unsubscribe = subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members([
          'harry',
          'potter',
        ]);
        expect(state.autocompleteFields).to.deep.equal([
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
      }, done);
      const doc = { harry: 1, potter: true };
      store.processSingleDocument(doc);
    });

    it('samples many documents', function (done) {
      unsubscribe = subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members([
          'harry',
          'potter',
          'ron',
          'weasley',
        ]);
        expect(state.autocompleteFields).to.deep.equal([
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
      }, done);
      const docs = [
        { harry: 1, potter: true },
        { ron: 'test', weasley: null },
      ];
      store.processDocuments(docs);
    });

    it('merges new docs with the existing state', function (done) {
      const doc = { harry: 1, potter: true };
      store.processSingleDocument(doc);

      setTimeout(() => {
        unsubscribe = subscribe(() => {
          const state = store.getState();
          expect(Object.keys(state.fields)).to.have.all.members([
            'harry',
            'potter',
            'hermione',
            'granger',
          ]);
          expect(state.autocompleteFields).to.deep.equal([
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
        }, done);
        const secondDoc = { hermione: 0, granger: false };
        store.processSingleDocument(secondDoc);
      });
    });

    it('merges a schema with the existing state', function (done) {
      const doc = { harry: 1, potter: true };
      store.processSingleDocument(doc);

      setTimeout(() => {
        unsubscribe = subscribe(() => {
          const state = store.getState();
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
          expect(state.autocompleteFields).to.deep.equal([
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
              value: '"review._id"',
              score: 1,
              meta: 'field',
              version: '0.0.0',
              description: 'Number',
            },
            {
              name: 'review.rating',
              value: '"review.rating"',
              score: 1,
              meta: 'field',
              version: '0.0.0',
              description: 'Number',
            },
            {
              name: 'review.text',
              value: '"review.text"',
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
              value: '"reviews._id"',
              score: 1,
              meta: 'field',
              version: '0.0.0',
              description: 'Number | Undefined',
            },
            {
              name: 'reviews.rating',
              value: '"reviews.rating"',
              score: 1,
              meta: 'field',
              version: '0.0.0',
              description: 'Number | Undefined',
            },
            {
              name: 'reviews.text',
              value: '"reviews.text"',
              score: 1,
              meta: 'field',
              version: '0.0.0',
              description: 'String | Undefined',
            },
          ]);
        }, done);
        store.processSchema(schemaFixture);
      });
    });

    it('flattens the schema', function (done) {
      unsubscribe = subscribe(() => {
        const state = store.getState();
        expect(state.fields).to.have.all.keys(['a', 'a.b', 'a.b.c']);
      }, done);
      store.processSingleDocument({ a: { b: { c: 1 } } });
    });

    it('maintains list of root fields', function (done) {
      unsubscribe = subscribe(() => {
        const state = store.getState();
        expect(state.topLevelFields).to.have.all.members(['a', 'd', 'e']);
      }, done);
      store.processSingleDocument({ a: { b: { c: 1 } }, d: 5, e: { f: 3 } });
    });

    describe('multidimensional arrays', function () {
      it('identifies empty 1d arrays', function (done) {
        unsubscribe = subscribe(() => {
          const state = store.getState();
          const expected = {
            a: {
              count: 1,
              name: 'a',
              path: ['a'],
              type: 'Array',
            },
          };
          expect(state.fields).to.be.deep.equal(expected);
        }, done);
        store.processSingleDocument({ a: [] });
      });

      it('identifies populated 1d arrays', function (done) {
        unsubscribe = subscribe(() => {
          const state = store.getState();
          const expected = {
            a: {
              count: 1,
              name: 'a',
              path: ['a'],
              type: 'Array',
            },
          };
          expect(state.fields).to.be.deep.equal(expected);
        }, done);
        store.processSingleDocument({ a: [1, 2, 3] });
      });

      it('identifies 2d arrays', function (done) {
        unsubscribe = subscribe(() => {
          const state = store.getState();
          const expected = {
            a: {
              count: 1,
              name: 'a',
              path: ['a'],
              type: 'Array',
            },
          };
          expect(state.fields).to.be.deep.equal(expected);
        }, done);
        store.processSingleDocument({
          a: [
            ['1_1', '1_2', '1_3'],
            ['2_1', '2_2', '2_3'],
          ],
        });
      });

      it('identifies 3d arrays', function (done) {
        unsubscribe = subscribe(() => {
          const state = store.getState();
          const expected = {
            a: {
              count: 1,
              name: 'a',
              path: ['a'],
              type: 'Array',
            },
          };
          expect(state.fields).to.be.deep.equal(expected);
        }, done);
        store.processSingleDocument({
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
      });

      it('multiple calls chooses latest array definition', function (done) {
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
        store.processSingleDocument({
          a: [
            ['1_1', '1_2', '1_3'],
            ['2_1', '2_2', '2_3'],
          ],
        });

        // Call that matters, the one that should be kept around
        store.processSingleDocument({ a: [1, 2, 3] });

        let i = 0;

        unsubscribe = subscribe(() => {
          // Skip first action
          if (i++ === 0) {
            return false;
          }
          expect(store.getState().fields).to.be.deep.equal(expected);
        }, done);
      });
    });

    describe('mixed nested arrays and subdocuments', function () {
      it('identifies 1d arrays of subdocuments', function (done) {
        unsubscribe = subscribe(() => {
          const state = store.getState();
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
        }, done);
        store.processSingleDocument({ a: [{ b: 'foo' }, { b: 'bar' }] });
      });

      it('identifies 2d arrays of subdocuments', function (done) {
        unsubscribe = subscribe(() => {
          const state = store.getState();
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
        }, done);
        store.processSingleDocument({
          a: [
            [{ b: 'foo' }, { b: 'bar' }],
            [{ b: 'foo' }, { b: 'bar' }],
          ],
        });
      });

      it('identifies 1d arrays of sub-subdocuments', function (done) {
        unsubscribe = subscribe(() => {
          const state = store.getState();
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
        }, done);
        store.processSingleDocument({
          a: [{ b: { c: 'foo' } }, { b: { c: 'bar' } }],
        });
      });

      it('identifies subdocuments of 1d arrays of sub-subdocuments of 2d arrays', function (done) {
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
        unsubscribe = subscribe(() => {
          const state = store.getState();
          expect(state.fields).to.be.deep.equal(expected);
        }, done);
        store.processSingleDocument({
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
      });
    });

    describe('collisions of name/path/count/type within a single document', function () {
      it('handles name', function (done) {
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
        unsubscribe = subscribe(() => {
          const state = store.getState();
          expect(state.fields).to.be.deep.equal(expected);
        }, done);
        store.processSingleDocument(doc);
      });
      it('handles path', function (done) {
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
        unsubscribe = subscribe(() => {
          const state = store.getState();
          expect(state.fields).to.be.deep.equal(expected);
        }, done);
        store.processSingleDocument(doc);
      });
    });
  });
});
