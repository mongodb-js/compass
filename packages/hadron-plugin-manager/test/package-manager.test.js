'use strict';

const path = require('path');
const expect = require('chai').expect;
const Action = require('../lib/action');
const PackageManager = require('../lib/package-manager');

describe('PackageManager', function() {
  describe('#activate', function() {
    var packagesPath = path.join(__dirname, 'packages');
    var manager = new PackageManager(packagesPath);

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
