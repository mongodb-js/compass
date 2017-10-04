const { expect } = require('chai');
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const AppRegistry = require('hadron-app-registry');
const LoadMoreDocumentsStore = require('../../../lib/stores/load-more-documents-store');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud',
  mongodb_database_name: 'admin'
});

describe('LoadMoreDocumentsStore', () => {
  const dataService = new DataService(CONNECTION);

  before((done) => {
    global.hadronApp.dataService = dataService;
    global.hadronApp.appRegistry = new AppRegistry();
    global.hadronApp.appRegistry.registerStore('CRUD.Store', LoadMoreDocumentsStore);
    global.hadronApp.appRegistry.onActivated();
    dataService.connect(() => {
      done();
    });
  });

  after(() => {
    dataService.disconnect();
    global.hadronApp.dataService = undefined;
    global.hadronApp.appRegistry = undefined;
  });

  describe('#init', () => {
    it('sets the default filter', () => {
      expect(LoadMoreDocumentsStore.filter).to.deep.equal({});
    });

    it('sets the default sort', () => {
      expect(LoadMoreDocumentsStore.sort).to.deep.equal([[ '_id', 1 ]]);
    });

    it('sets the default limit', () => {
      expect(LoadMoreDocumentsStore.limit).to.equal(0);
    });

    it('sets the default skip', () => {
      expect(LoadMoreDocumentsStore.skip).to.equal(0);
    });

    it('sets the default project', () => {
      expect(LoadMoreDocumentsStore.project).to.equal(null);
    });

    it('sets the default counter', () => {
      expect(LoadMoreDocumentsStore.counter).to.equal(0);
    });
  });

  describe('#onCollectionChanged', () => {
    before(() => {
      LoadMoreDocumentsStore.onCollectionChanged('compass-crud.test');
    });

    after(() => {
      LoadMoreDocumentsStore.onCollectionChanged(undefined);
    });

    it('sets the namespace', () => {
      expect(LoadMoreDocumentsStore.ns).to.equal('compass-crud.test');
    });
  });

  describe('#emit collection-changed', () => {
    before(() => {
      global.hadronApp.appRegistry.emit('collection-changed', 'compass-crud.test');
    });

    after(() => {
      LoadMoreDocumentsStore.onCollectionChanged(undefined);
    });

    it('sets the namespace', () => {
      expect(LoadMoreDocumentsStore.ns).to.equal('compass-crud.test');
    });
  });

  describe('#onQueryChanged', () => {
    const query = {
      ns: 'compass-crud.test',
      filter: { name: 'test' },
      sort: { name: 1 },
      limit: 10,
      skip: 5,
      project: { name: 1 }
    };

    before(() => {
      LoadMoreDocumentsStore.onQueryChanged(query);
    });

    after(() => {
      LoadMoreDocumentsStore.reset();
    });

    it('changes the filter', () => {
      expect(LoadMoreDocumentsStore.filter).to.deep.equal(query.filter);
    });

    it('changes the sort', () => {
      expect(LoadMoreDocumentsStore.sort).to.deep.equal([['name', 1]]);
    });

    it('changes the limit', () => {
      expect(LoadMoreDocumentsStore.limit).to.equal(query.limit);
    });

    it('changes the skip', () => {
      expect(LoadMoreDocumentsStore.skip).to.equal(query.skip);
    });

    it('changes the project', () => {
      expect(LoadMoreDocumentsStore.project).to.equal(query.project);
    });
  });

  describe('#emit query-changed', () => {
    const query = {
      ns: 'compass-crud.test',
      filter: { name: 'test' },
      sort: { name: 1 },
      limit: 10,
      skip: 5,
      project: { name: 1 }
    };

    before(() => {
      global.hadronApp.appRegistry.emit('query-changed', query);
    });

    after(() => {
      LoadMoreDocumentsStore.reset();
    });

    it('changes the filter', () => {
      expect(LoadMoreDocumentsStore.filter).to.deep.equal(query.filter);
    });

    it('changes the sort', () => {
      expect(LoadMoreDocumentsStore.sort).to.deep.equal([['name', 1]]);
    });

    it('changes the limit', () => {
      expect(LoadMoreDocumentsStore.limit).to.equal(query.limit);
    });

    it('changes the skip', () => {
      expect(LoadMoreDocumentsStore.skip).to.equal(query.skip);
    });

    it('changes the project', () => {
      expect(LoadMoreDocumentsStore.project).to.equal(query.project);
    });
  });

  describe('#fetchNextDocuments', () => {
    before(() => {
      LoadMoreDocumentsStore.onCollectionChanged('compass-crud.test');
    });

    after(() => {
      LoadMoreDocumentsStore.reset();
    });

    it('triggers with the loaded documents', (done) => {
      const unsubscribe = LoadMoreDocumentsStore.listen((error, docs) => {
        expect(error).to.equal(null);
        expect(docs).to.deep.equal([]);
        unsubscribe();
        done();
      });

      LoadMoreDocumentsStore.fetchNextDocuments(1);
    });
  });
});
