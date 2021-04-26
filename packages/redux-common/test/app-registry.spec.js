const { expect } = require('chai');
const AppRegistry = require('hadron-app-registry');
const reducer = require('../app-registry');
const {
  LOCAL_APP_REGISTRY_ACTIVATED,
  GLOBAL_APP_REGISTRY_ACTIVATED,
  INITIAL_STATE,
  localAppRegistryActivated,
  globalAppRegistryActivated,
  localAppRegistryEmit,
  globalAppRegistryEmit
} = require('../app-registry');

describe('app-registry module', () => {
  describe('#localAppRegistryActivated', () => {
    const appRegistry = {};

    it('returns the action', () => {
      expect(localAppRegistryActivated(appRegistry)).to.deep.equal({
        type: LOCAL_APP_REGISTRY_ACTIVATED,
        appRegistry: appRegistry
      });
    });
  });

  describe('#globalAppRegistryActivated', () => {
    const appRegistry = {};

    it('returns the action', () => {
      expect(globalAppRegistryActivated(appRegistry)).to.deep.equal({
        type: GLOBAL_APP_REGISTRY_ACTIVATED,
        appRegistry: appRegistry
      });
    });
  });

  describe('#localAppRegistryEmit', () => {
    context('when the app registry exists', () => {
      context('when emitting a no value', () => {
        const appRegistry = new AppRegistry();
        const func = localAppRegistryEmit('test');
        const getState = () => ({
          appRegistry: {
            localAppRegistry: appRegistry
          }
        });

        it('emits the event on the app registry', (done) => {
          appRegistry.on('test', (meta) => {
            expect(meta).to.equal(undefined);
            done();
          });
          func(null, getState);
        });
      });

      context('when emitting a single value', () => {
        context('when the value is an object', () => {
          const metadata = { name: 'testing' };
          const appRegistry = new AppRegistry();
          const func = localAppRegistryEmit('test', metadata);
          const getState = () => ({
            appRegistry: {
              localAppRegistry: appRegistry
            }
          });

          it('emits the event on the app registry', (done) => {
            appRegistry.on('test', (meta) => {
              expect(meta).to.deep.equal(metadata);
              done();
            });
            func(null, getState);
          });
        });

        context('when the value is a primitive', () => {
          const metadata = 'testing';
          const appRegistry = new AppRegistry();
          const func = localAppRegistryEmit('test', metadata);
          const getState = () => ({
            appRegistry: {
              localAppRegistry: appRegistry
            }
          });

          it('emits the event on the app registry', (done) => {
            appRegistry.on('test', (meta) => {
              expect(meta).to.deep.equal(metadata);
              done();
            });
            func(null, getState);
          });
        });
      });

      context('when emitting multiple values', () => {
        const appRegistry = new AppRegistry();
        const func = localAppRegistryEmit('test', 1, 2, 'three');
        const getState = () => ({
          appRegistry: {
            localAppRegistry: appRegistry
          }
        });

        it('emits the event on the app registry', (done) => {
          appRegistry.on('test', (arg1, arg2, arg3) => {
            expect(arg1).to.deep.equal(1);
            expect(arg2).to.deep.equal(2);
            expect(arg3).to.deep.equal('three');
            done();
          });
          func(null, getState);
        });
      });
    });

    context('when the app registry does not exist', () => {
      const metadata = { name: 'testing' };
      const func = localAppRegistryEmit('test', metadata);
      const getState = () => ({
        appRegistry: {
          localAppRegistry: null
        }
      });

      it('does not attempt to emit the event', () => {
        expect(func.bind(null, null, getState)).to.not.throw();
      });
    });
  });

  describe('#globalAppRegistryEmit', () => {
    context('when the app registry exists', () => {
      context('when emitting a no value', () => {
        const appRegistry = new AppRegistry();
        const func = globalAppRegistryEmit('test');
        const getState = () => ({
          appRegistry: {
            globalAppRegistry: appRegistry
          }
        });

        it('emits the event on the app registry', (done) => {
          appRegistry.on('test', (meta) => {
            expect(meta).to.equal(undefined);
            done();
          });
          func(null, getState);
        });
      });

      context('when emitting a single value', () => {
        context('when the value is an object', () => {
          const metadata = { name: 'testing' };
          const appRegistry = new AppRegistry();
          const func = globalAppRegistryEmit('test', metadata);
          const getState = () => ({
            appRegistry: {
              globalAppRegistry: appRegistry
            }
          });

          it('emits the event on the app registry', (done) => {
            appRegistry.on('test', (meta) => {
              expect(meta).to.deep.equal(metadata);
              done();
            });
            func(null, getState);
          });
        });

        context('when the value is a primitive', () => {
          const metadata = 'testing';
          const appRegistry = new AppRegistry();
          const func = globalAppRegistryEmit('test', metadata);
          const getState = () => ({
            appRegistry: {
              globalAppRegistry: appRegistry
            }
          });

          it('emits the event on the app registry', (done) => {
            appRegistry.on('test', (meta) => {
              expect(meta).to.deep.equal(metadata);
              done();
            });
            func(null, getState);
          });
        });
      });

      context('when emitting multiple values', () => {
        const appRegistry = new AppRegistry();
        const func = localAppRegistryEmit('test', 1, 2, 'three');
        const getState = () => ({
          appRegistry: {
            localAppRegistry: appRegistry
          }
        });

        it('emits the event on the app registry', (done) => {
          appRegistry.on('test', (arg1, arg2, arg3) => {
            expect(arg1).to.deep.equal(1);
            expect(arg2).to.deep.equal(2);
            expect(arg3).to.deep.equal('three');
            done();
          });
          func(null, getState);
        });
      });
    });

    context('when the app registry does not exist', () => {
      const metadata = { name: 'testing' };
      const func = globalAppRegistryEmit('test', metadata);
      const getState = () => ({
        appRegistry: {
          globalAppRegistry: null
        }
      });

      it('does not attempt to emit the event', () => {
        expect(func.bind(null, null, getState)).to.not.throw();
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is unknown', () => {
      it('returns the initial state', () => {
        expect(reducer(undefined, {})).to.deep.equal(INITIAL_STATE);
      });
    });

    context('when the action is local activated', () => {
      const appRegistry = new AppRegistry();

      it('returns the new state', () => {
        expect(reducer(undefined, localAppRegistryActivated(appRegistry))).to.deep.equal({
          localAppRegistry: appRegistry,
          globalAppRegistry: null
        });
      });
    });

    context('when the action is global activated', () => {
      const appRegistry = new AppRegistry();

      it('returns the new state', () => {
        expect(reducer(undefined, globalAppRegistryActivated(appRegistry))).to.deep.equal({
          localAppRegistry: null,
          globalAppRegistry: appRegistry
        });
      });
    });
  });
});
