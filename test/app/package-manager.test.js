'use strict';

require('../helpers.js');

const expect = require('chai').expect;

const core = require('compass-core');
const Action = core.Action;
const ComponentRegistry = core.ComponentRegistry;
const PackageManager = core.PackageManager.constructor;

describe('PackageManager', function() {
  describe('#activate', function() {
    var manager = new PackageManager();

    afterEach(function() {
      ComponentRegistry.deregisterAll();
    });

    it('activates all the packages', function(done) {
      var unsubscribe = Action.packageActivationCompleted.listen(function() {
        expect(manager.packages).to.have.length(1);
        unsubscribe();
        done();
      });
      manager.activate();
    });
  });

  describe('#new', function() {
    var manager = new PackageManager();

    it('initializes empty packages', function() {
      expect(manager.packages).to.have.length(0);
    });
  });
});
