const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');
const { expect } = require('chai');
const Reflux = require('reflux');
const NamespaceStore = require('../../src/internal-plugins/app/lib/stores/namespace-store');

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

    context('when collection changes', () => {
      it('emits the collection-changed event', (done) => {
        const newNamespace = `${initialDatabase}.change.the-collection.please`;
        app.appRegistry.on('collection-changed', (namespace) => {
          expect(namespace).to.be.equal(newNamespace);
          done();
        });
        NamespaceStore.ns = newNamespace;
      });
    });

    context('when the initial collection contains a dot', () => {
      context('when only the part after the dot changes', () => {
        it('emits the collection-changed event', (done) => {
          NamespaceStore.ns = 'foo.bar.baz';
          const newNamespace = 'foo.bar.jaguar';
          app.appRegistry.on('collection-changed', (namespace) => {
            expect(namespace).to.be.equal(newNamespace);
            done();
          });
          NamespaceStore.ns = newNamespace;
        });
      });
    });

    context('when the initial collection does not contain a dot', () => {
      it('emits the collection-changed event', (done) => {
        NamespaceStore.ns = 'foo.bar';
        const newNamespace = 'jaguar.bar';
        app.appRegistry.on('collection-changed', (namespace) => {
          expect(namespace).to.be.equal(newNamespace);
          done();
        });
        NamespaceStore.ns = newNamespace;
      });
    });

    context('when database changes', () => {
      it('emits the databaase-changed event', (done) => {
        const newNamespace = `changeTheDB.${initialCollection}`;
        app.appRegistry.on('database-changed', (namespace) => {
          expect(namespace).to.be.equal(newNamespace);
          done();
        });
        NamespaceStore.ns = newNamespace;
      });
    });
  });
});
