const expect = require('chai').expect;

const Reflux = require('reflux');

const root = '../src/internal-packages/';
const storeKeyMap = {
  'Schema.Store': root + 'schema/lib/store',
  'Query.ChangedStore': root + 'query/lib/store/query-changed-store'
};

Reflux.StoreMethods.listenToExternalStore = function(storeKey, callback) {
  const store = require(storeKeyMap[storeKey]);
  this.listenTo(store, callback);
};

const CreateIndexStore = require('../src/internal-packages/indexes/lib/store/create-index-store');

describe('CreateIndexesStore', function() {
  let unsubscribe;

  beforeEach(function() {
    unsubscribe = function() {};
    CreateIndexStore.clearForm();
  });

  afterEach(function() {
    unsubscribe();
    unsubscribe = function() {};
  });

  it('Initially has 1 field', function(done) {
    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields).to.have.lengthOf(1);
      unsubscribe();
      done();
    });
    CreateIndexStore.sendValues();
  });

  it('can add an extra field', function(done) {
    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields).to.have.lengthOf(2);
      expect(fields[0].name).to.be.equal('');
      expect(fields[0].type).to.be.equal('');
      expect(fields[1].name).to.be.equal('');
      expect(fields[1].type).to.be.equal('');
      unsubscribe();
      done();
    });
    CreateIndexStore.addIndexField();
  });

  it('can remove a field with a valid index', function(done) {
    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields).to.have.lengthOf(0);
      unsubscribe();
      done();
    });
    CreateIndexStore.removeIndexField(0);
  });

  it('can\'t remove a field with an invalid index', function(done) {
    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields).to.have.lengthOf(1);
      unsubscribe();
      done();
    });
    CreateIndexStore.removeIndexField(2);
  });

  it('can change a field name with a valid index', function(done) {
    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields[0].name).to.equal('location');
      unsubscribe();
      done();
    });
    CreateIndexStore.updateFieldName(0, 'location');
  });

  it('can\'t change a field name with a invalid index', function(done) {
    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields[0].name).to.equal('');
      unsubscribe();
      done();
    });
    CreateIndexStore.updateFieldName(3, 'location');
  });

  it('can change a field type with a valid index', function(done) {
    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields[0].type).to.equal('1 (asc)');
      unsubscribe();
      done();
    });
    CreateIndexStore.updateFieldType(0, '1 (asc)');
  });

  it('can\'t change a field type with a invalid index', function(done) {
    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields[0].type).to.equal('');
      unsubscribe();
      done();
    });
    CreateIndexStore.updateFieldType(-1, '1 (asc)');
  });

  it('won\'t change a field name if it already exists', function(done) {
    CreateIndexStore.updateFieldName(0, 'location');
    CreateIndexStore.addIndexField();

    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields[0].name).to.equal('location');
      expect(fields[1].name).to.equal('');
      unsubscribe();
      done();
    });

    CreateIndexStore.updateFieldName(1, 'location');
  });

  it('maintains order of fields after removal', function(done) {
    CreateIndexStore.updateFieldName(0, 'location');
    CreateIndexStore.addIndexField();
    CreateIndexStore.updateFieldName(1, 'address');
    CreateIndexStore.addIndexField();
    CreateIndexStore.updateFieldName(2, 'gender');

    unsubscribe = CreateIndexStore.listen((fields) => {
      expect(fields[0].name).to.equal('location');
      expect(fields[1].name).to.equal('gender');
      unsubscribe();
      done();
    });

    CreateIndexStore.removeIndexField(1);
  });
});
