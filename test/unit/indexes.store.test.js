/* eslint no-unused-expressions: 0 */
const expect = require('chai').expect;

const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');
const NamespaceStore = require('../../src/internal-plugins/app/lib/stores/namespace-store');
const sinon = require('sinon');

const root = '../../src/internal-plugins/';
const storeKeyMap = {
  'CollectionStore': root + 'app/lib/stores/collection-store',
  'LoadIndexesStore': root + 'indexes/lib/store/load-indexes-store',
  'Schema.Store': root + 'schema/lib/store',
  'Query.ChangedStore': root + 'query/lib/store/query-changed-store'
};
require('../../src/app/reflux-listen-to-external-store.js');

const CreateIndexStore = require('../../src/internal-plugins/indexes/lib/store/create-index-store');

const arrayOfDocsFields = require('../fixtures/fields.fixture.json');

const mockDataService = require('./support/mock-data-service');

app.appRegistry = new AppRegistry();

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

  it('extracts top-level and nested field names from the schema', function(done) {
    unsubscribe = CreateIndexStore.listen((fields, options, schemaFields) => {
      expect(schemaFields).to.have.members(['review', 'review.rating',
        'review._id', 'review.text']);
      unsubscribe();
      done();
    });

    CreateIndexStore.onFieldChanged(arrayOfDocsFields);
  });

  it('adds extra field to schemaFields on updateFieldName', function(done) {
    CreateIndexStore.onFieldChanged(arrayOfDocsFields);

    unsubscribe = CreateIndexStore.listen((fields, options, schemaFields) => {
      expect(schemaFields).to.include('foo');
      unsubscribe();
      done();
    });
    CreateIndexStore.updateFieldName(0, 'foo');
  });
});

describe('LoadIndexesStore', () => {
  const appInstance = app.instance;
  const appRegistry = app.appRegistry;

  before(mockDataService.before(null, {
    database: { collections: [] }
  }));

  beforeEach(() => {
    // Mock the app.instance.build.version
    app.instance = {
      build: {version: '3.4.0'},
      databases: {models: []}
    };

    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();
    app.appRegistry.registerStore('App.NamespaceStore', NamespaceStore);

    // Stub out the LoadIndexesStore.CollectionStore
    const CollectionStore = require(storeKeyMap.CollectionStore);
    this.isReadOnlyStub = sinon.stub(CollectionStore, 'isReadonly', () => {
      return true;
    });

    // Hacks because circular imports!
    this.LoadIndexesStore = require(storeKeyMap.LoadIndexesStore);
    this.LoadIndexesStore.CollectionStore = CollectionStore;
  });
  afterEach(() => {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.instance = appInstance;
    app.appRegistry = appRegistry;
    this.isReadOnlyStub.restore();
  });

  it('does not load indexes for a database-level namespace', () => {
    const ns = 'hello';
    this.LoadIndexesStore.loadIndexes(ns);
    expect(this.isReadOnlyStub.called).to.be.false;
  });
  it('loads indexes for a collection-level namespace', () => {
    const ns = 'hello.world';
    this.LoadIndexesStore.loadIndexes(ns);
    expect(this.isReadOnlyStub.called).to.be.true;
  });
  it('loads indexes during a query change', () => {
    this.LoadIndexesStore.onQueryChanged({ns: 'hello.world'});
    expect(this.isReadOnlyStub.called).to.be.true;
  });
});
