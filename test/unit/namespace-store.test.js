const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');
const { expect } = require('chai');
const Reflux = require('reflux');
const NamespaceStore = require('../../src/internal-packages/app/lib/stores/namespace-store');

/**
 * Useful background information on namespaces:
 * https://docs.mongodb.com/manual/reference/limits/#naming-restrictions
 */
describe('NamespaceStore', () => {
  const initialDatabase = 'foo';
  const initialCollection = 'bar.baz';
  let appRegistry;

  beforeEach(() => {
    NamespaceStore.ns = `${initialDatabase}.${initialCollection}`;
    appRegistry = app.appRegistry;
    app.appRegistry = new AppRegistry();
  });

  afterEach(() => {
    app.appRegistry = appRegistry;
  });

  describe('#set ns', () => {
    it('triggers a store event', (done) => {
      const unsubscribe = NamespaceStore.listen((ns) => {
        expect(ns).to.equal('database.collection');
        unsubscribe();
        done();
      });
      NamespaceStore.ns = 'database.collection';
    });

    it('when collection changes, calls onCollectionChanged', (done) => {
      const newNamespace = `${initialDatabase}.change.the-collection.please`;
      const CollectionSubscriberStore = Reflux.createStore({
        onCollectionChanged(namespace) {
          expect(namespace).to.be.equal(newNamespace);
          done();
        }
      });
      app.appRegistry.registerStore('CollectionSubscriber.Store', CollectionSubscriberStore);
      NamespaceStore.ns = newNamespace;
    });

    it('when database changes, calls onDatabaseChanged', (done) => {
      const newNamespace = `changeTheDB.${initialCollection}`;
      const DatabaseSubscriberStore = Reflux.createStore({
        onDatabaseChanged(namespace) {
          expect(namespace).to.be.equal(newNamespace);
          done();
        }
      });
      app.appRegistry.registerStore('DatabaseSubscriber.Store', DatabaseSubscriberStore);
      NamespaceStore.ns = newNamespace;
    });
  });
});
