'use strict';

const path = require('path');
const expect = require('chai').expect;
const sinon = require('sinon');
const Action = require('../lib/action');
const PackageManager = require('../lib/package-manager');

describe('PackageManager', () => {
  describe('#activate', () => {
    context('when the directories exist', () => {
      const packagesPath = path.join(__dirname, 'packages');
      const intPackagesPath = path.join(__dirname, 'internal-packages');
      let manager;
      beforeEach(() => {
        manager = new PackageManager(
          [ intPackagesPath, packagesPath ],
          __dirname,
          ['external-packages/example3']
        );
      });

      it('activates all the packages', (done) => {
        const unsubscribe = Action.packageActivationCompleted.listen(() => {
          expect(manager.packages).to.have.length(6);
          unsubscribe();
          done();
        });
        manager.activate();
      });

      it('only calls Action.packageActivationCompleted once', (done) => {
        const spy = sinon.spy();
        const unsubscribe = Action.packageActivationCompleted.listen(spy);
        setTimeout(() => {
          expect(spy.callCount).to.be.equal(1);
          unsubscribe();
          done();
        }, 10);
        manager.activate();
      });
    });

    context('when the directories do not exist', () => {
      const manager = new PackageManager([ 'test-packages' ], __dirname, []);

      it('activates no the packages', (done) => {
        const unsubscribe = Action.packageActivationCompleted.listen(() => {
          expect(manager.packages).to.have.length(0);
          unsubscribe();
          done();
        });
        manager.activate();
      });
    });
  });

  describe('#new', () => {
    const manager = new PackageManager();

    it('initializes empty packages', () => {
      expect(manager.packages).to.have.length(0);
    });
  });
});
