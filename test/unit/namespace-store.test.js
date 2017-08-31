const { expect } = require('chai');
const NamespaceStore = require('../../src/internal-packages/app/lib/stores/namespace-store');


describe('NamespaceStore', () => {
  describe('#set ns', () => {
    it('triggers a store event', (done) => {
      const unsubscribe = NamespaceStore.listen((ns) => {
        expect(ns).to.equal('database.collection');
        unsubscribe();
        done();
      });
      NamespaceStore.ns = 'database.collection';
    });
  });
});
