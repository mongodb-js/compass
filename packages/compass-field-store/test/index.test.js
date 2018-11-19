/* eslint no-unused-expressions: 0 */
const expect = require('chai').expect;
const mock = require('mock-require');
const schemaFixture = require('./fixtures/array_of_docs.fixture.json');
let FieldStore = require('../lib/stores');

describe('FieldStore', function() {
  let unsubscribe;

  beforeEach(() => {
    unsubscribe = () => {};
    FieldStore = mock.reRequire('../lib/stores');
  });

  afterEach(() => {
    unsubscribe();
  });

  it('has an initial state', () => {
    const state = FieldStore.getInitialState();
    expect(state).to.have.all.keys(['fields', 'topLevelFields', 'aceFields']);
    expect(state.fields).to.be.empty;
    expect(state.topLevelFields).to.be.empty;
    expect(state.aceFields).to.be.empty;
  });

  it('samples a single document', (done) => {
    const doc = {harry: 1, potter: true};
    unsubscribe = FieldStore.listen((state) => {
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
    FieldStore.processSingleDocument(doc);
  });

  it('samples many documents', (done) => {
    const docs = [{harry: 1, potter: true}, {ron: 'test', weasley: null}];
    unsubscribe = FieldStore.listen((state) => {
      expect(Object.keys(state.fields)).to.have.all.members([
        'harry', 'potter', 'ron', 'weasley']);
      done();
    });
    FieldStore.processDocuments(docs);
  });

  it('merges new docs with the existing state', (done) => {
    const doc = {harry: 1, potter: true};
    FieldStore.processSingleDocument(doc);
    setTimeout(() => {
      const secondDoc = {hermione: 0, granger: false};
      unsubscribe = FieldStore.listen((state) => {
        expect(Object.keys(state.fields)).to.have.all.members([
          'harry', 'potter', 'hermione', 'granger']);
        done();
      });
      FieldStore.processSingleDocument(secondDoc);
    });
  });

  it('merges a schema with the existing state', (done) => {
    const doc = {harry: 1, potter: true};
    FieldStore.processSingleDocument(doc);
    setTimeout(() => {
      unsubscribe = FieldStore.listen((state) => {
        expect(Object.keys(state.fields)).to.have.all.members(['harry', 'potter',
          '_id', 'review', 'review._id', 'review.rating', 'review.text',
          'reviews', 'reviews._id', 'reviews.rating', 'reviews.text']);
        done();
      });
      FieldStore.processSchema(schemaFixture);
    });
  });

  it('flattens the schema', function(done) {
    unsubscribe = FieldStore.listen((state) => {
      expect(state.fields).to.have.all.keys(['a', 'a.b', 'a.b.c']);
      unsubscribe();
      done();
    });
    FieldStore.processSingleDocument({a: {b: {c: 1}}});
  });

  it('maintains list of root fields', function(done) {
    unsubscribe = FieldStore.listen((state) => {
      expect(state.topLevelFields).to.have.all.members(['a', 'd', 'e']);
      unsubscribe();
      done();
    });
    FieldStore.processSingleDocument({a: {b: {c: 1}}, d: 5, e: {f: 3}});
  });

  context('multidimensional arrays', () => {
    it('identifies empty 1d arrays', function(done) {
      const expected = {
        'a': {
          'dimensionality': 1,
          'count': 1,
          'name': 'a',
          'path': 'a',
          'type': 'Array'
        }
      };
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        unsubscribe();
        done();
      });
      FieldStore.processSingleDocument({a: []});
    });
    it('identifies populated 1d arrays', function(done) {
      const expected = {
        'a': {
          'dimensionality': 1,
          'count': 1,
          'name': 'a',
          'path': 'a',
          'type': 'Array'
        }
      };
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        unsubscribe();
        done();
      });
      FieldStore.processSingleDocument({a: [1, 2, 3]});
    });
    it('identifies 2d arrays', function(done) {
      const expected = {
        'a': {
          'dimensionality': 2,
          'count': 1,
          'name': 'a',
          'path': 'a',
          'type': 'Array'
        }
      };
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        unsubscribe();
        done();
      });
      FieldStore.processSingleDocument({a: [
        ['1_1', '1_2', '1_3'],
        ['2_1', '2_2', '2_3']
      ]});
    });
    it('identifies 3d arrays', function(done) {
      const expected = {
        'a': {
          'dimensionality': 3,
          'count': 1,
          'name': 'a',
          'path': 'a',
          'type': 'Array'
        }
      };
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        unsubscribe();
        done();
      });
      FieldStore.processSingleDocument({a: [
        // Think cube
        [
          ['1_1_1', '1_1_2'],
          ['1_2_1', '1_2_2']
        ],
        [
          ['2_1_1', '2_1_2'],
          ['2_2_1', '2_2_2']
        ]
      ]});
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
      FieldStore.processSingleDocument({a: [
        ['1_1', '1_2', '1_3'],
        ['2_1', '2_2', '2_3']
      ]});

      // Call that matters, the one that should be kept around
      FieldStore.processSingleDocument({a: [1, 2, 3]});

      setTimeout(() => {
        expect(FieldStore.state.fields).to.be.deep.equal(expected);
        done();
      });
    });
  });

  context('mixed nested arrays and subdocuments', () => {
    it('identifies 1d arrays of subdocuments', function(done) {
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
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        unsubscribe();
        done();
      });
      FieldStore.processSingleDocument({a: [
        {b: 'foo'},
        {b: 'bar'}
      ]});
    });
    it('identifies 2d arrays of subdocuments', function(done) {
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
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        unsubscribe();
        done();
      });
      FieldStore.processSingleDocument({a: [
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
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        unsubscribe();
        done();
      });
      FieldStore.processSingleDocument({a: [
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
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        unsubscribe();
        done();
      });
      FieldStore.processSingleDocument({a: {b: [
        {c: {d: [[1, 2], [3, 4]]}},
        {c: {d: [[5, 6], [7, 8]]}}
      ]}});
    });
  });

  context('collisions of name/path/count/type within a single document', () => {
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
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        done();
      });
      FieldStore.processSingleDocument(doc);
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
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        done();
      });
      FieldStore.processSingleDocument(doc);
    });
  });
});
