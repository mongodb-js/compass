const { expect } = require('chai');
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const AppRegistry = require('hadron-app-registry');
const ResetDocumentListStore = require('../../../lib/stores/reset-document-list-store');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud',
  mongodb_database_name: 'admin'
});

describe('ResetDocumentListStore', () => {
  const dataService = new DataService(CONNECTION);

  before((done) => {
    global.hadronApp.appRegistry = new AppRegistry();
    global.hadronApp.appRegistry.registerStore('CRUD.Store', ResetDocumentListStore);
    global.hadronApp.appRegistry.onActivated();
    dataService.connect(() => {
      global.hadronApp.appRegistry.emit('data-service-connected', null, dataService);
      done();
    });
  });

  after(() => {
    dataService.disconnect();
    global.hadronApp.appRegistry = undefined;
  });

  describe('#init', () => {
    it('sets the default filter', () => {
      expect(ResetDocumentListStore.filter).to.deep.equal({});
    });

    it('sets the default sort', () => {
      expect(ResetDocumentListStore.sort).to.deep.equal([[ '_id', 1 ]]);
    });

    it('sets the default limit', () => {
      expect(ResetDocumentListStore.limit).to.equal(0);
    });

    it('sets the default skip', () => {
      expect(ResetDocumentListStore.skip).to.equal(0);
    });

    it('sets the default project', () => {
      expect(ResetDocumentListStore.project).to.equal(null);
    });

    it('sets the default namespace', () => {
      expect(ResetDocumentListStore.ns).to.equal('');
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

    it('tiggers with the reset documents', (done) => {
      const unsubscribe = ResetDocumentListStore.listen((error, docs, count) => {
        expect(error).to.equal(null);
        expect(docs).to.deep.equal([]);
        expect(count).to.equal(0);
        unsubscribe();
        done();
      });

      ResetDocumentListStore.onQueryChanged(query);
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

    it('tiggers with the reset documents', (done) => {
      const unsubscribe = ResetDocumentListStore.listen((error, docs, count) => {
        expect(error).to.equal(null);
        expect(docs).to.deep.equal([]);
        expect(count).to.equal(0);
        unsubscribe();
        done();
      });

      global.hadronApp.appRegistry.emit('query-changed', query);
    });
  });
});
