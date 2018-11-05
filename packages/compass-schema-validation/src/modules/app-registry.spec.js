import reducer, {
  appRegistryActivated,
  appRegistryEmit,
  APP_REGISTRY_ACTIVATED
} from 'modules/app-registry';

describe('app registry module', () => {
  describe('#appRegistryActivated', () => {
    it('returns the APP_REGISTRY_ACTIVATED action', () => {
      expect(appRegistryActivated('app')).to.deep.equal({
        type: APP_REGISTRY_ACTIVATED,
        appRegistry: 'app'
      });
    });
  });

  describe('#appRegistryEmit', () => {
    const spy = sinon.spy();
    const appRegistry = { emit: spy };
    const getState = () => {
      return { appRegistry: appRegistry };
    };

    it('emits the action on the app registry', () => {
      appRegistryEmit('name', { name: 'test' })(null, getState);
      expect(spy.calledWith('name', { name: 'test' })).to.equal(true);
    });
  });

  describe('#reducer', () => {
    context('when the action is not app registry activated', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(null);
      });
    });

    context('when the action is app registry activated', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, appRegistryActivated('testing'))).to.equal('testing');
      });
    });
  });
});
