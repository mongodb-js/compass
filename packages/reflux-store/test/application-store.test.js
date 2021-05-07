'use strict';

const expect = require('chai').expect;
const ApplicationStore = require('../lib/application-store');

describe('ApplicationStore', function() {
  describe('#set dataService', function() {
    it('sets the data service', function() {
      ApplicationStore.dataService = 'test';
      expect(ApplicationStore.dataService).to.equal('test');
    });
  });
});
