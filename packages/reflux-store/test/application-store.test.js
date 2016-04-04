'use strict';

const expect = require('chai').expect;
const ApplicationStore = require('../lib/application-store');

describe('ApplicationStore', function() {
  describe('#set dataService', function() {
    it('triggers a store event', function(done) {
      var unsubscribe = ApplicationStore.listen(function(store) {
        expect(store.dataService).to.equal('test');
        unsubscribe();
        done();
      });
      ApplicationStore.dataService = 'test';
    });
  });
});
