'use strict';

const path = require('path');
const expect = require('chai').expect;

const Package = require('../lib/package');
const Cache = Package.Cache;
const Example = require('./packages/example');

describe('Package', () => {
  const testPackagePath = path.join(__dirname, 'packages', 'example');

  describe('#activate', () => {
    context('when the activation has no errors', () => {
      const pkg = new Package(testPackagePath);

      context('when the package is not yet loaded', () => {
        beforeEach(() => {
          delete Cache[testPackagePath];
        });

        it('loads the package and calls activate on the module', () => {
          expect(pkg.activate()).to.equal('test');
        });

        it('sets the package as activated', () => {
          expect(pkg.isActivated).to.equal(true);
        });
      });

      context('when the package is loaded', () => {
        it('calls #activate on the loaded module', () => {
          expect(pkg.activate()).to.equal('test');
        });
      });
    });

    context('when the activation errors', () => {
      const errorPackagePath = path.join(__dirname, 'packages', 'example3');
      const pkg = new Package(errorPackagePath);

      before(() => {
        pkg.activate();
      });

      it('sets the package as not activated', () => {
        expect(pkg.isActivated).to.equal(false);
      });

      it('sets the package error', () => {
        expect(pkg.error.message).to.equal('error');
      });
    });

    context('when loading errors', () => {
      const errorPackagePath = path.join(__dirname, 'packages', 'example4');
      const pkg = new Package(errorPackagePath);

      before(() => {
        pkg.activate();
      });

      it('sets the package as not activated', () => {
        expect(pkg.isActivated).to.equal(false);
      });

      it('sets the package error', () => {
        expect(pkg.error.message).to.include('Cannot find module');
      });
    });
  });

  describe('#load', () => {
    context('when loading does not error', () => {
      const pkg = new Package(testPackagePath);

      it('returns the module', () => {
        expect(pkg.load()).to.equal(Example);
      });

      it('sets the module in the cache', () => {
        expect(Cache[testPackagePath]).to.equal(Example);
      });
    });
  });

  describe('#new', () => {
    const pkg = new Package(testPackagePath);

    it('sets the package path', () => {
      expect(pkg.packagePath).to.equal(testPackagePath);
    });

    it('parses the package.json and sets the metadata', () => {
      expect(pkg.metadata.name).to.equal('test-package');
    });
  });
});
