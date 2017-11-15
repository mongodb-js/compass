/* eslint guard-for-in: 0 */

const { expect } = require('chai');
const PageChangedStore = require('../../../lib/stores/page-changed-store');
const AppRegistry = require('hadron-app-registry');
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const { expectedDocs, checkPageRange, NUM_DOCS } = require('../../aggrid-helper');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud',
  mongodb_database_name: 'admin'
});

describe('PageChangedStore', () => {
  const dataService = new DataService(CONNECTION);
  before((done) => {
    global.hadronApp.appRegistry = new AppRegistry();
    global.hadronApp.appRegistry.registerStore('CRUD.Store', PageChangedStore);
    global.hadronApp.appRegistry.onActivated();
    dataService.connect(() => {
      global.hadronApp.appRegistry.emit('data-service-connected', null, dataService);
      dataService.insertMany('compass-crud.test', expectedDocs, {}, () => {
        done();
      });
    });
  });

  after((done) => {
    dataService.dropCollection('compass-crud.test', () => {
      dataService.disconnect();
      global.hadronApp.appRegistry = undefined;
      done();
    });
  });

  describe('#init', () => {
    it('sets the default filter', () => {
      expect(PageChangedStore.filter).to.deep.equal({});
    });
    it('sets the default counter', () => {
      expect(PageChangedStore.counter).to.equal(0);
    });
  });

  describe('#onCollectionChanged', () => {
    before(() => {
      PageChangedStore.onCollectionChanged('compass-crud.test');
    });

    after(() => {
      PageChangedStore.onCollectionChanged(undefined);
    });

    it('sets the namespace', () => {
      expect(PageChangedStore.ns).to.equal('compass-crud.test');
    });
  });

  describe('#emit collection-changed', () => {
    before(() => {
      global.hadronApp.appRegistry.emit('collection-changed', 'compass-crud.test');
    });

    after(() => {
      PageChangedStore.onCollectionChanged(undefined);
    });

    it('sets the namespace', () => {
      expect(PageChangedStore.ns).to.equal('compass-crud.test');
    });
  });

  describe('#onQueryChanged', () => {
    const filter = { name: 'test' };
    before(() => {
      PageChangedStore.onQueryChanged({ ns: 'compass-crud.test', filter: filter });
    });

    after(() => {
      PageChangedStore.onQueryChanged({ ns: 'compass-crud.test', filter: {}});
    });

    it('sets the filter', () => {
      expect(PageChangedStore.filter).to.deep.equal(filter);
    });
  });

  describe('#emit query-changed', () => {
    const filter = { name: 'test' };
    before(() => {
      global.hadronApp.appRegistry.emit('query-changed', { ns: 'compass-crud.test', filter: filter });
    });

    after(() => {
      PageChangedStore.onQueryChanged({ ns: 'compass-crud.test', filter: {}});
    });

    it('sets the filter', () => {
      expect(PageChangedStore.filter).to.deep.equal(filter);
    });
  });

  describe('Changing page', () => {
    describe('get pages of correct size', () => {
      before(() => {
        PageChangedStore.reset();
      });
      describe('no skip or limit', () => {
        before((done) => {
          PageChangedStore.reset();
          PageChangedStore.onCollectionChanged('compass-crud.test');
          done();
        });
        after((done) => {
          PageChangedStore.reset();
          done();
        });
        /* Don't test getNextPage(0) because not possible */
        for (let i = 1; i < 3; i++) {
          it('gets the next page for ' + i, (done) => {
            const unsubscribe = PageChangedStore.listen(
              (error, documents, start, end, page) => {
                unsubscribe();
                checkPageRange(error, documents, start, end, page, i, 0, 0);
                done();
              });
            PageChangedStore.getNextPage(i);
          });
          it('updates counter correctly', () => {
            expect(PageChangedStore.counter).to.equal(NUM_DOCS * i);
          });
        }

        for (let i = 1; i >= 0; i--) {
          it('gets the prev page for ' + i, (done) => {
            const unsubscribe = PageChangedStore.listen(
              (error, documents, start, end, page) => {
                unsubscribe();
                checkPageRange(error, documents, start, end, page, i, 0, 0);
                done();
              });
            PageChangedStore.getPrevPage(i);
          });
          it('updates counter correctly', () => {
            expect(PageChangedStore.counter).to.equal(NUM_DOCS * i);
          });
        }
      });
      describe('with skip', () => {
        const skip = 5;
        before((done) => {
          PageChangedStore.reset();
          PageChangedStore.onCollectionChanged('compass-crud.test');
          PageChangedStore.skip = skip;
          done();
        });
        after((done) => {
          PageChangedStore.reset();
          done();
        });
        for (let i = 1; i < 3; i++) {
          it('gets the next page for ' + i, (done) => {
            const unsubscribe = PageChangedStore.listen(
              (error, documents, start, end, page) => {
                unsubscribe();
                checkPageRange(error, documents, start, end, page, i, skip, 0);
                done();
              });
            PageChangedStore.getNextPage(i);
          });
          it('updates counter correctly', () => {
            expect(PageChangedStore.counter).to.equal(NUM_DOCS * i);
          });
        }
        for (let i = 1; i >= 0; i--) {
          it('gets the prev page for ' + i, (done) => {
            const unsubscribe = PageChangedStore.listen(
              (error, documents, start, end, page) => {
                unsubscribe();
                checkPageRange(error, documents, start, end, page, i, skip, 0);
                done();
              });
            PageChangedStore.getPrevPage(i);
          });
          it('updates counter correctly', () => {
            expect(PageChangedStore.counter).to.equal(NUM_DOCS * i);
          });
        }
      });
      describe('with limit', () => {
        const limit = 50;
        before((done) => {
          PageChangedStore.reset();
          PageChangedStore.onCollectionChanged('compass-crud.test');
          PageChangedStore.limit = limit;
          done();
        });
        after((done) => {
          PageChangedStore.reset();
          done();
        });
        for (let i = 1; i < 3; i++) {
          it('gets the next page for ' + i, (done) => {
            const unsubscribe = PageChangedStore.listen(
              (error, documents, start, end, page) => {
                unsubscribe();
                checkPageRange(error, documents, start, end, page, i, 0, limit);
                done();
              });
            PageChangedStore.getNextPage(i);
          });
          it('updates counter correctly', () => {
            expect(PageChangedStore.counter).to.equal(NUM_DOCS * i);
          });
        }
        for (let i = 1; i >= 0; i--) {
          it('gets the prev page for ' + i, (done) => {
            const unsubscribe = PageChangedStore.listen(
              (error, documents, start, end, page) => {
                unsubscribe();
                checkPageRange(error, documents, start, end, page, i, 0, limit);
                done();
              });
            PageChangedStore.getPrevPage(i);
          });
          it('updates counter correctly', () => {
            expect(PageChangedStore.counter).to.equal(NUM_DOCS * i);
          });
        }
      });
      describe('with skip and limit', () => {
        const limit = 50;
        const skip = 2;
        before((done) => {
          PageChangedStore.reset();
          PageChangedStore.onCollectionChanged('compass-crud.test');
          PageChangedStore.limit = limit;
          PageChangedStore.skip = skip;
          done();
        });
        after((done) => {
          PageChangedStore.reset();
          done();
        });
        for (let i = 1; i < 3; i++) {
          it('gets the next page for ' + i, (done) => {
            const unsubscribe = PageChangedStore.listen(
              (error, documents, start, end, page) => {
                unsubscribe();
                checkPageRange(error, documents, start, end, page, i, skip, limit);
                done();
              });
            PageChangedStore.getNextPage(i);
          });
          it('updates counter correctly', () => {
            expect(PageChangedStore.counter).to.equal(NUM_DOCS * i);
          });
        }
        for (let i = 1; i >= 0; i--) {
          it('gets the prev page for ' + i, (done) => {
            const unsubscribe = PageChangedStore.listen(
              (error, documents, start, end, page) => {
                unsubscribe();
                checkPageRange(error, documents, start, end, page, i, skip, limit);
                done();
              });
            PageChangedStore.getPrevPage(i);
          });
          it('updates counter correctly', () => {
            expect(PageChangedStore.counter).to.equal(NUM_DOCS * i);
          });
        }
      });

      describe('skip around pages', () => {
        const limit = 55;
        const skip = 3;
        before((done) => {
          PageChangedStore.reset();
          PageChangedStore.onCollectionChanged('compass-crud.test');
          PageChangedStore.limit = limit;
          PageChangedStore.skip = skip;
          done();
        });
        after((done) => {
          PageChangedStore.reset();
          done();
        });
        it('next to page 1', (done) => {
          const unsubscribe = PageChangedStore.listen(
            (error, documents, start, end, page) => {
              unsubscribe();
              checkPageRange(error, documents, start, end, page, 1, skip, limit);
              expect(PageChangedStore.counter).to.equal(NUM_DOCS);
              done();
            });
          PageChangedStore.getNextPage(1);
        });
        it('prev to page 0', (done) => {
          const unsubscribe = PageChangedStore.listen(
            (error, documents, start, end, page) => {
              unsubscribe();
              checkPageRange(error, documents, start, end, page, 0, skip, limit);
              expect(PageChangedStore.counter).to.equal(0);
              done();
            });
          PageChangedStore.getPrevPage(0);
        });
        it('next to page 1', (done) => {
          const unsubscribe = PageChangedStore.listen(
            (error, documents, start, end, page) => {
              unsubscribe();
              checkPageRange(error, documents, start, end, page, 1, skip, limit);
              expect(PageChangedStore.counter).to.equal(NUM_DOCS);
              done();
            });
          PageChangedStore.getNextPage(1);
        });
        it('next to page 2', (done) => {
          const unsubscribe = PageChangedStore.listen(
            (error, documents, start, end, page) => {
              unsubscribe();
              checkPageRange(error, documents, start, end, page, 2, skip, limit);
              expect(PageChangedStore.counter).to.equal(NUM_DOCS * 2);
              done();
            });
          PageChangedStore.getNextPage(2);
        });
        it('prev to page 1', (done) => {
          const unsubscribe = PageChangedStore.listen(
            (error, documents, start, end, page) => {
              unsubscribe();
              checkPageRange(error, documents, start, end, page, 1, skip, limit);
              expect(PageChangedStore.counter).to.equal(NUM_DOCS);
              done();
            });
          PageChangedStore.getPrevPage(1);
        });
      });
    });
  });
});
