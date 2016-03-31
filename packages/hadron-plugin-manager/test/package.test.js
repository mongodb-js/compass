'use strict';

const path = require('path');
const expect = require('chai').expect;

const Package = require('../lib/package');
const Cache = Package.Cache;
const Example = require('./packages/example');

describe('Package', function() {
  var testPackagePath = path.join(__dirname, 'packages', 'example');

  describe('#activate', function() {
    var pkg = new Package(testPackagePath);

    context('when the package is not yet loaded', function() {
      beforeEach(function() {
        delete Cache[testPackagePath];
      });

      it('loads the package and calls activate on the module', function() {
        expect(pkg.activate()).to.equal('test');
      });
    });

    context('when the package is loaded', function() {
      it('calls #activate on the loaded module', function() {
        expect(pkg.activate()).to.equal('test');
      });
    });
  });

  describe('#load', function() {
    var pkg = new Package(testPackagePath);

    it('returns the module', function() {
      expect(pkg.load()).to.equal(Example);
    });

    it('sets the module in the cache', function() {
      expect(Cache[testPackagePath]).to.equal(Example);
    });
  });

  describe('#new', function() {
    var pkg = new Package(testPackagePath);

    it('sets the package path', function() {
      expect(pkg.packagePath).to.equal(testPackagePath);
    });

    it('parses the package.json and sets the metadata', function() {
      expect(pkg.metadata.name).to.equal('test-package');
    });
  });
});
