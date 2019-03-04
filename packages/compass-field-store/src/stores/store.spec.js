import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
const schemaFixture = require('../../test/fixtures/array_of_docs.fixture.json');
import store from 'stores';
import { reset } from 'modules/reset';
import { changeFields, INITIAL_STATE } from 'modules';

const SchemaStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { samplingState: 'complete', schema: {} };
  },
  setSchema() {
    this.setState({schema: schemaFixture});
  }
});


describe('FieldStore', function() {
  let unsubscribe = () => {};
  beforeEach(() => {
    store.dispatch(reset());
    expect(store.getState()).to.deep.equal(INITIAL_STATE);
  });
  afterEach(() => {
    unsubscribe();
  });

  it('has an initial state', () => {
    expect(store.getState()).to.deep.equal(INITIAL_STATE);
  });

  describe('#onActivated', () => {
    const doc = {harry: 1, potter: true};
    const expected = [
      {
        name: 'harry',
        value: 'harry',
        score: 1,
        meta: 'field',
        version: '0.0.0'
      },
      {
        name: 'potter',
        value: 'potter',
        score: 1,
        meta: 'field',
        version: '0.0.0'
      }
    ];
    let hold;
    before(() => {
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = new AppRegistry();
      global.hadronApp.appRegistry.registerStore('Schema.Store', SchemaStore);
      store.onActivated(global.hadronApp.appRegistry);
    });
    after(() => {
      global.hadronApp.appRegistry = hold;
    });

    it('on schema store trigger', (done) => {
      unsubscribe = store.subscribe(() => {
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
          'reviews.text'
        ]);
        done();
      });
      SchemaStore.setSchema();
    });

    it('on documents-refreshed', (done) => {
      unsubscribe = store.subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members(['harry', 'potter']);
        expect(state.aceFields).to.deep.equal(expected);
        done();
      });
      global.hadronApp.appRegistry.emit(
        'documents-refreshed', null, [doc]
      );
    });

    it('on documents-inserted', (done) => {
      unsubscribe = store.subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members(['harry', 'potter']);
        expect(state.aceFields).to.deep.equal(expected);
        done();
      });
      global.hadronApp.appRegistry.emit(
        'document-inserted', null, doc
      );
    });

    it('on documents-paginated', (done) => {
      unsubscribe = store.subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members(['harry', 'potter']);
        expect(state.aceFields).to.deep.equal(expected);
        done();
      });
      global.hadronApp.appRegistry.emit(
        'documents-paginated', null, [doc]
      );
    });

    describe('resets', () => {
      const defined = {
        fields: {'a': 1}, topLevelFields: ['a'], aceFields: ['b']
      };

      beforeEach(() => {
        store.dispatch(changeFields({a: 1}, ['a'], ['b']));
        expect(store.getState()).to.deep.equal(defined);
      });

      it('on collection-changed', (done) => {
        unsubscribe = store.subscribe(() => {
          expect(store.getState()).to.deep.equal(INITIAL_STATE);
          done();
        });
        global.hadronApp.appRegistry.emit('collection-changed');
      });

      it('on database-changed', (done) => {
        unsubscribe = store.subscribe(() => {
          expect(store.getState()).to.deep.equal(INITIAL_STATE);
          done();
        });
        global.hadronApp.appRegistry.emit('database-changed');
      });

      it('on data-service-disconnected', (done) => {
        unsubscribe = store.subscribe(() => {
          expect(store.getState()).to.deep.equal(INITIAL_STATE);
          done();
        });
        global.hadronApp.appRegistry.emit('data-service-disconnected');
      });
    });
  });

  describe('emits appReg event on change', () => {
    let hold;
    let spy;
    before(() => {
      hold = global.hadronApp.appRegistry;
      const app = new AppRegistry();
      global.hadronApp.appRegistry = app;
      store.onActivated(app);
      spy = sinon.spy();
      app.emit = spy;
    });
    after(() => {
      store.dispatch(reset());
      global.hadronApp.appRegistry = hold;
      spy = null;
    });
    it('triggers for action calls', () => {
      store.dispatch(changeFields('a', 'b', 'c'));
      expect(spy.calledTwice).to.equal(true);
      expect(spy.args[0][0]).to.equal('fields-changed');
      expect(spy.args[0][1]).to.deep.equal({fields: {}, topLevelFields: [], aceFields: []});
      expect(spy.args[1][0]).to.equal('fields-changed');
      expect(spy.args[1][1]).to.deep.equal({fields: 'a', topLevelFields: 'b', aceFields: 'c'});
      store.dispatch(reset());
      expect(spy.args[2][0]).to.equal('fields-changed');
      expect(spy.args[2][1]).to.deep.equal({fields: {}, topLevelFields: [], aceFields: []});
    });
    it('triggers for store methods', () => {
      const doc = {harry: 1, potter: true};
      store.processSingleDocument(doc);
      unsubscribe = store.subscribe(() => {
        expect(spy.calledTwice).to.equal(true);
        expect(spy.args[0][0]).to.equal('fields-changed');
        expect(spy.args[0][1]).to.deep.equal({fields: {}, topLevelFields: [], aceFields: []});
        expect(spy.args[1][0]).to.equal('fields-changed');
        expect(Object.keys(spy.args[1][1].fields)).to.have.all.members(['harry', 'potter']);
        expect(spy.args[1][1].aceFields).to.deep.equal([
          {
            name: 'harry',
            value: 'harry',
            score: 1,
            meta: 'field',
            version: '0.0.0'
          },
          {
            name: 'potter',
            value: 'potter',
            score: 1,
            meta: 'field',
            version: '0.0.0'
          }
        ]);
      });
    });
  });

  describe('store process methods', () => {
    it('samples a single document', (done) => {
      unsubscribe = store.subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members(['harry', 'potter']);
        expect(state.aceFields).to.deep.equal([
          {
            name: 'harry',
            value: 'harry',
            score: 1,
            meta: 'field',
            version: '0.0.0'
          },
          {
            name: 'potter',
            value: 'potter',
            score: 1,
            meta: 'field',
            version: '0.0.0'
          }
        ]);
        done();
      });
      const doc = {harry: 1, potter: true};
      store.processSingleDocument(doc);
    });

    it('samples many documents', (done) => {
      unsubscribe = store.subscribe(() => {
        const state = store.getState();
        expect(Object.keys(state.fields)).to.have.all.members([
          'harry', 'potter', 'ron', 'weasley']);
        expect(state.aceFields).to.deep.equal([
          {
            name: 'harry',
            value: 'harry',
            score: 1,
            meta: 'field',
            version: '0.0.0'
          },
          {
            name: 'potter',
            value: 'potter',
            score: 1,
            meta: 'field',
            version: '0.0.0'
          },
          {
            name: 'ron',
            value: 'ron',
            score: 1,
            meta: 'field',
            version: '0.0.0'
          },
          {
            name: 'weasley',
            value: 'weasley',
            score: 1,
            meta: 'field',
            version: '0.0.0'
          }
        ]);
        done();
      });
      const docs = [{harry: 1, potter: true}, {ron: 'test', weasley: null}];
      store.processDocuments(docs);
    });

    it('merges new docs with the existing state', (done) => {
      const doc = {harry: 1, potter: true};
      store.processSingleDocument(doc);

      setTimeout(() => {
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          expect(Object.keys(state.fields)).to.have.all.members(
            ['harry', 'potter', 'hermione', 'granger']
          );
          expect(state.aceFields).to.deep.equal([
            {
              name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'granger',
              value: 'granger',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'hermione',
              value: 'hermione',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            }
          ]);
          done();
        });
        const secondDoc = {hermione: 0, granger: false};
        store.processSingleDocument(secondDoc);
      });
    });

    it('merges a schema with the existing state', (done) => {
      const doc = {harry: 1, potter: true};
      store.processSingleDocument(doc);

      setTimeout(() => {
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          expect(Object.keys(state.fields)).to.have.all.members(['harry', 'potter',
            '_id', 'review', 'review._id', 'review.rating', 'review.text',
            'reviews', 'reviews._id', 'reviews.rating', 'reviews.text']);
          expect(state.aceFields).to.deep.equal([
            {
              name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: '_id',
              value: '_id',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'review',
              value: 'review',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'review._id',
              value: '"review._id"',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'review.rating',
              value: '"review.rating"',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'review.text',
              value: '"review.text"',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'reviews',
              value: 'reviews',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'reviews._id',
              value: '"reviews._id"',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'reviews.rating',
              value: '"reviews.rating"',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            },
            {
              name: 'reviews.text',
              value: '"reviews.text"',
              score: 1,
              meta: 'field',
              version: '0.0.0'
            }
          ]);
          done();
        });
        store.processSchema(schemaFixture);
      });
    });

    it('flattens the schema', function(done) {
      unsubscribe = store.subscribe(() => {
        const state = store.getState();
        expect(state.fields).to.have.all.keys(['a', 'a.b', 'a.b.c']);
        done();
      });
      store.processSingleDocument({a: {b: {c: 1}}});
    });

    it('maintains list of root fields', function(done) {
      unsubscribe = store.subscribe(() => {
        const state = store.getState();
        expect(state.topLevelFields).to.have.all.members(['a', 'd', 'e']);
        done();
      });
      store.processSingleDocument({a: {b: {c: 1}}, d: 5, e: {f: 3}});
    });

    describe('multidimensional arrays', () => {
      it('identifies empty 1d arrays', function(done) {
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const expected = {
            'a': {
              'dimensionality': 1,
              'count': 1,
              'name': 'a',
              'path': 'a',
              'type': 'Array'
            }
          };
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument({a: []});
      });

      it('identifies populated 1d arrays', function(done) {
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const expected = {
            'a': {
              'dimensionality': 1,
              'count': 1,
              'name': 'a',
              'path': 'a',
              'type': 'Array'
            }
          };
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument({a: [1, 2, 3]});
      });

      it('identifies 2d arrays', function(done) {
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const expected = {
            'a': {
              'dimensionality': 2,
              'count': 1,
              'name': 'a',
              'path': 'a',
              'type': 'Array'
            }
          };
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument(
          {
            a: [['1_1', '1_2', '1_3'], ['2_1', '2_2', '2_3']]
          }
        );
      });

      it('identifies 3d arrays', function(done) {
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const expected = {
            'a': {
              'dimensionality': 3,
              'count': 1,
              'name': 'a',
              'path': 'a',
              'type': 'Array'
            }
          };
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument({
          a: [
            // Think cube
            [
              ['1_1_1', '1_1_2'],
              ['1_2_1', '1_2_2']
            ],
            [
              ['2_1_1', '2_1_2'],
              ['2_2_1', '2_2_2']
            ]
          ]
        });
      });

      it('multiple calls chooses latest array definition', function(done) {
        // Ideally in this polymorphic case we'd store all the types,
        // but that's much harder to reason about and not needed at this time
        const expected = {
          'a': {
            'dimensionality': 1,
            'count': 2,
            'name': 'a',
            'path': 'a',
            'type': 'Array'
          }
        };
        // Should effectively be a no-op call
        store.processSingleDocument(
          {
            a: [
              ['1_1', '1_2', '1_3'],
              ['2_1', '2_2', '2_3']
            ]
          }
        );

        // Call that matters, the one that should be kept around
        store.processSingleDocument({a: [1, 2, 3]});

        setTimeout(() => {
          expect(store.getState().fields).to.be.deep.equal(expected);
          done();
        });
      });
    });

    describe('mixed nested arrays and subdocuments', () => {
      it('identifies 1d arrays of subdocuments', function(done) {
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const expected = {
            'a': {
              'dimensionality': 1,
              'count': 1,
              'name': 'a',
              'nestedFields': [
                'a.b'
              ],
              'path': 'a',
              'type': 'Array'
            },
            'a.b': {
              'count': 2,
              'name': 'b',
              'path': 'a.b',
              'type': 'String'
            }
          };
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument({a: [
          {b: 'foo'}, {b: 'bar'}
        ]});
      });

      it('identifies 2d arrays of subdocuments', function(done) {
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const expected = {
            'a': {
              'dimensionality': 2,
              'count': 1,
              'name': 'a',
              'nestedFields': [
                'a.b'
              ],
              'path': 'a',
              'type': 'Array'
            },
            'a.b': {
              'count': 4,
              'name': 'b',
              'path': 'a.b',
              'type': 'String'
            }
          };
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument({a: [
          [
            {b: 'foo'},
            {b: 'bar'}
          ],
          [
            {b: 'foo'},
            {b: 'bar'}
          ]
        ]});
      });

      it('identifies 1d arrays of sub-subdocuments', function(done) {
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const expected = {
            'a': {
              'dimensionality': 1,
              'count': 1,
              'name': 'a',
              'nestedFields': [
                'a.b'
              ],
              'path': 'a',
              'type': 'Array'
            },
            'a.b': {
              'count': 2,
              'name': 'b',
              'nestedFields': [
                'a.b.c'
              ],
              'path': 'a.b',
              'type': 'Document'
            },
            'a.b.c': {
              'count': 2,
              'name': 'c',
              'path': 'a.b.c',
              'type': 'String'
            }
          };
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument({a: [
          {b: {c: 'foo'}},
          {b: {c: 'bar'}}
        ]});
      });

      it('identifies subdocuments of 1d arrays of sub-subdocuments of 2d arrays', function(done) {
        // At this point just spot-checking the recursion because I can
        const expected = {
          'a': {
            'count': 1,
            'name': 'a',
            'nestedFields': [
              'a.b'
            ],
            'path': 'a',
            'type': 'Document'
          },
          'a.b': {
            'dimensionality': 1,
            'count': 1,
            'name': 'b',
            'nestedFields': [
              'a.b.c'
            ],
            'path': 'a.b',
            'type': 'Array'
          },
          'a.b.c': {
            'count': 2,
            'name': 'c',
            'nestedFields': [
              'a.b.c.d'
            ],
            'path': 'a.b.c',
            'type': 'Document'
          },
          'a.b.c.d': {
            'dimensionality': 2,
            'count': 2,
            'name': 'd',
            'path': 'a.b.c.d',
            'type': 'Array'
          }
        };
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument(
          {
            a: {
              b: [
                {c: {d: [[1, 2], [3, 4]]}},
                {c: {d: [[5, 6], [7, 8]]}}
              ]
            }
          }
        );
      });
    });

    describe('collisions of name/path/count/type within a single document', () => {
      it('handles name', (done) => {
        const expected = {
          'foo1': {
            'dimensionality': 1,
            'count': 1,
            'name': 'foo1',
            'nestedFields': [
              'foo1.age',
              'foo1.name'
            ],
            'path': 'foo1',
            'type': 'Array'
          },
          'foo1.age': {
            'count': 1,
            'name': 'age',
            'path': 'foo1.age',
            'type': 'Number'
          },
          // The following was a string, not a field
          'foo1.name': {
            'count': 1,
            'name': 'name',
            'path': 'foo1.name',
            'type': 'String'
          }
        };
        const doc = {
          foo1: [{age: 10, name: 'bazillion'}]
        };
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument(doc);
      });
      it('handles path', (done) => {
        const expected = {
          'foo1': {
            'dimensionality': 1,
            'count': 1,
            'name': 'foo1',
            'nestedFields': [
              'foo1.age',
              'foo1.path'
            ],
            'path': 'foo1',
            'type': 'Array'
          },
          'foo1.age': {
            'count': 1,
            'name': 'age',
            'path': 'foo1.age',
            'type': 'Number'
          },
          // The following was a string, not a field
          'foo1.path': {
            'count': 1,
            'name': 'path',
            'path': 'foo1.path',
            'type': 'String'
          }
        };
        const doc = {
          foo1: [{age: 10, path: 'bazillion'}]
        };
        unsubscribe = store.subscribe(() => {
          const state = store.getState();
          expect(state.fields).to.be.deep.equal(expected);
          done();
        });
        store.processSingleDocument(doc);
      });
    });
  });
});
