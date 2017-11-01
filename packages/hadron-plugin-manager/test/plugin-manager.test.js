'use strict';

const path = require('path');
const expect = require('chai').expect;
const sinon = require('sinon');
const Action = require('../lib/action');
const PluginManager = require('../lib/plugin-manager');

describe('PluginManager', () => {
  describe('#activate', () => {
    context('when the directories exist', () => {
      const pluginsPath = path.join(__dirname, 'plugins');
      const intPluginsPath = path.join(__dirname, 'internal-plugins');

      let manager;
      beforeEach(() => {
        manager = new PluginManager(
          [ intPluginsPath, pluginsPath ],
          __dirname,
          ['external-plugins/example3']
        );
      });

      it('activates all the plugins', (done) => {
        const spy = sinon.spy();
        const unsubscribe = Action.pluginActivationCompleted.listen((s) => {
          expect(manager.plugins).to.have.length(9);
          expect(spy.callCount).to.be.equal(0);
          expect(s).to.equal(spy);
          unsubscribe();
          done();
        });
        manager.activate(spy);
      });

      it('only calls Action.pluginActivationCompleted once', (done) => {
        const spy = sinon.spy();
        const unsubscribe = Action.pluginActivationCompleted.listen(spy);
        setTimeout(() => {
          expect(spy.callCount).to.be.equal(1);
          unsubscribe();
          done();
        }, 10);
        manager.activate();
      });
    });

    context('when the directories do not exist', () => {
      const manager = new PluginManager([ 'test-plugins' ], __dirname, []);

      it('activates no the plugins', (done) => {
        const spy = sinon.spy();
        const unsubscribe = Action.pluginActivationCompleted.listen(() => {
          expect(manager.plugins).to.have.length(0);
          unsubscribe();
          done();
        });
        manager.activate(spy);
      });
    });
  });

  describe('#new', () => {
    const manager = new PluginManager();

    it('initializes empty plugins', () => {
      expect(manager.plugins).to.have.length(0);
    });
  });
});
