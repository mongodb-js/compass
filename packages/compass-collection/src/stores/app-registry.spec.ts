import type AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import sinon from 'sinon';

import reducer, {
  appRegistryActivated,
  appRegistryEmit,
  APP_REGISTRY_ACTIVATED
} from './app-registry';

describe('app registry module', function () {
  describe('#appRegistryActivated', function () {
    it('returns the APP_REGISTRY_ACTIVATED action', function () {
      expect(appRegistryActivated({} as AppRegistry)).to.deep.equal({
        type: APP_REGISTRY_ACTIVATED,
        appRegistry: {}
      });
    });
  });

  describe('#appRegistryEmit', function () {
    const spy = sinon.spy();
    const appRegistry = { emit: spy };
    const getState = () => {
      return { appRegistry: appRegistry };
    };

    it('emits the action on the app registry', function () {
      appRegistryEmit('name', { name: 'test' })(null, getState);
      expect(spy.calledWith('name', { name: 'test' })).to.equal(true);
    });
  });

  describe('#reducer', function () {
    context('when the action is not app registry activated', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.equal(null);
      });
    });

    context('when the action is app registry activated', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, appRegistryActivated({} as AppRegistry))).to.deep.equal({});
      });
    });
  });
});
