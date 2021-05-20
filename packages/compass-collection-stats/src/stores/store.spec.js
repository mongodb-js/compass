import AppRegistry from 'hadron-app-registry';
import configureStore from 'stores';
import sinon from 'sinon';


describe('CollectionStatsstore [store]', () => {
  describe('#configureStore', () => {
    context('when providing no options', () => {
      let store;

      beforeEach(() => {
        store = configureStore();
      });

      it('defaults isReadonly to false', () => {
        expect(store.state.isReadonly).to.be.false;
      });

      it('defaults document count to invalid', () => {
        expect(store.state.documentCount).to.be.equal('N/A');
      });

      it('defaults document count to invalid', () => {
        expect(store.state.totalDocumentSize).to.be.equal('N/A');
      });

      it('defaults document count to invalid', () => {
        expect(store.state.avgDocumentSize).to.be.equal('N/A');
      });

      it('defaults document count to invalid', () => {
        expect(store.state.indexCount).to.be.equal('N/A');
      });

      it('defaults document count to invalid', () => {
        expect(store.state.totalIndexSize).to.be.equal('N/A');
      });

      it('defaults document count to invalid', () => {
        expect(store.state.avgIndexSize).to.be.equal('N/A');
      });

      it('defaults raw document count to invalid', () => {
        expect(store.state.rawDocumentCount).to.be.equal(0);
      });

      it('defaults raw document count to invalid', () => {
        expect(store.state.rawTotalDocumentSize).to.be.equal(0);
      });

      it('defaults raw document count to invalid', () => {
        expect(store.state.rawAvgDocumentSize).to.be.equal(0);
      });

      it('defaults raw document count to invalid', () => {
        expect(store.state.rawIndexCount).to.be.equal(0);
      });

      it('defaults raw document count to invalid', () => {
        expect(store.state.rawTotalIndexSize).to.be.equal(0);
      });

      it('defaults raw document count to invalid', () => {
        expect(store.state.rawAvgIndexSize).to.be.equal(0);
      });
    });

    context('when providing options', () => {
      context('when providing a local app registry', () => {
        let store;
        const appRegistry = new AppRegistry();

        beforeEach(() => {
          store = configureStore({ localAppRegistry: appRegistry });
        });

        it('sets the local app registry on the store', () => {
          expect(store.appRegistry).to.equal(appRegistry);
        });
      });

      context('when providing a data provider', () => {
        let store;
        let estimatedCountStub;
        let collectionStub;
        let dataService;
        beforeEach(() => {
          estimatedCountStub = sinon.stub();
          collectionStub = sinon.stub();

          dataService = {
            estimatedCount: estimatedCountStub,
            collection: collectionStub,
            isConnected: () => true
          };

          store = configureStore({
            dataProvider: {
              error: null,
              dataProvider: dataService,
            },
            namespace: 'db.coll'
          });
        });

        it('sets the data provider on the store', () => {
          expect(store.dataService).to.equal(dataService);
        });

        it('fetches details', () => {
          collectionStub.callsFake((ns, options, cb) => {
            cb(null, {
              document_count: 123
            });
          });

          store.loadCollectionStats();

          expect(store.state.documentCount).to.equal('123');
        });

        it('re-fetch the document count if was not in stats (support hack for time-series in v5.0)', () => {
          collectionStub.callsFake((ns, options, cb) => {
            cb(null, {});
          });

          estimatedCountStub.callsFake((ns, options, cb) => {
            cb(null, 123);
          });

          store.loadCollectionStats();

          expect(store.state.documentCount).to.equal('123');
        });

        it('resets the state in case of error (collection stats)', () => {
          collectionStub.callsFake((ns, options, cb) => {
            cb(new Error('failed'));
          });

          store.state.documentCount = '123';

          store.loadCollectionStats();

          expect(store.state.documentCount).to.equal('N/A');
          expect(store.dataService).to.equal(dataService);
        });

        it('resets only the documentCount in case of error on estimated count', () => {
          collectionStub.callsFake((ns, options, cb) => {
            cb(null, {
              index_count: 123
            });
          });

          estimatedCountStub.callsFake((ns, options, cb) => {
            cb(new Error('failed'));
          });

          store.loadCollectionStats();

          expect(store.state.indexCount).to.equal('123');
          expect(store.state.documentCount).to.equal('N/A');
          expect(store.dataService).to.equal(dataService);
        });
      });

      context('when providing is readonly', () => {
        let store;

        beforeEach(() => {
          store = configureStore({ isReadonly: true });
        });

        it('sets the is readonly value on the store', () => {
          expect(store.state.isReadonly).to.equal(true);
        });
      });

      context('wnen providing a namespace', () => {
        let store;

        beforeEach(() => {
          store = configureStore({ namespace: 'db.coll' });
        });

        it('sets the namespace on the store', () => {
          expect(store.ns).to.equal('db.coll');
        });
      });
    });
  });
});
