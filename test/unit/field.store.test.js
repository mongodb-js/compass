/* eslint no-unused-expressions: 0 */
const expect = require('chai').expect;
const mock = require('mock-require');
let FieldStore = require('../../src/internal-packages/schema/lib/store/field-store');

const arrayOfDocsSchema = require('../fixtures/array_of_docs.fixture.json');

describe('FieldStore', function() {
  let unsubscribe;

  beforeEach(() => {
    unsubscribe = () => {};
    FieldStore = mock.reRequire('../../src/internal-packages/schema/lib/store/field-store');
  });

  afterEach(() => {
    unsubscribe();
  });

  it('has an initial state', () => {
    const keys = FieldStore.getInitialState();
    expect(keys).to.have.all.keys(['fields', 'fieldParents']);
  });

  it('does not run when sampling is complete', () => {
    FieldStore.onSchemaStoreChanged({schema: arrayOfDocsSchema, samplingState: 'progress'});
    expect(FieldStore.state.fields).to.be.empty;
    expect(FieldStore.state.fieldParents).to.be.empty;
  });

  it('includes the parent field names in the keys of fields', (done) => {
    unsubscribe = FieldStore.listen((state) => {
      expect(Object.keys(state.fields)).to.include.members(state.fieldParents);
      done();
    });
    FieldStore.onSchemaStoreChanged({schema: arrayOfDocsSchema, samplingState: 'complete'});
  });

  it('flattens the schema', function(done) {
    unsubscribe = FieldStore.listen((state) => {
      expect(state.fields).to.have.all.keys(['_id', 'reviews', 'reviews._id',
        'reviews.rating', 'reviews.text', 'review', 'review._id',
        'review.rating', 'review.text']);
      unsubscribe();
      done();
    });
    FieldStore.onSchemaStoreChanged({schema: arrayOfDocsSchema, samplingState: 'complete'});
  });
});
