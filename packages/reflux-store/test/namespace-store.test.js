'use strict';

const expect = require('chai').expect;
const NamespaceStore = require('../lib/namespace-store');

describe('NamespaceStore', function() {
  describe('#set ns', function() {
    it('triggers a store event', function(done) {
      var unsubscribe = NamespaceStore.listen(function(ns) {
        expect(ns).to.equal('database.collection');
        unsubscribe();
        done();
      });
      NamespaceStore.ns = 'database.collection';
    });
  });
});
