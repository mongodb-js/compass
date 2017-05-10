/* eslint no-unused-expressions: 0 */
const expect = require('chai').expect;
const mock = require('mock-require');
let FieldStore = require('../../src/internal-packages/schema-light/lib/store/field-store');
let schemaFixture = require('../fixtures/array_of_docs.fixture.json');

describe('FieldStore', function() {
  let unsubscribe;

  beforeEach(() => {
    unsubscribe = () => {};
    FieldStore = mock.reRequire('../../src/internal-packages/schema-light/lib/store/field-store');
  });

  afterEach(() => {
    unsubscribe();
  });

  it('has an initial state', () => {
    const state = FieldStore.getInitialState();
    expect(state).to.have.all.keys(['fields', 'rootFields']);
    expect(state.fields).to.be.empty;
    expect(state.rootFields).to.be.empty;
  });

  it('samples a single document', (done) => {
    const doc = {harry: 1, potter: true};
    unsubscribe = FieldStore.listen((state) => {
      expect(Object.keys(state.fields)).to.have.all.members(['harry', 'potter']);
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
      expect(state.rootFields).to.have.all.members(['a', 'd', 'e']);
      unsubscribe();
      done();
    });
    FieldStore.processSingleDocument({a: {b: {c: 1}}, d: 5, e: {f: 3}});
  });
});
