import reducer, * as actions from './global-app-registry';

describe('global-app-registry [module]', () => {
  const spy = sinon.spy();

  describe('#reducer', () => {
    context('when the action type is GLOBAL_APP_REGISTRY_ACTIVATED', () => {
      const action = actions.globalAppRegistryActivated(spy);

      it('returns the new state', () => {
        expect(reducer('', action)).to.equal(spy);
      });
    });

    context('when the action type is not recognised', () => {
      it('returns the initial state', () => {
        expect(reducer(undefined, {})).to.deep.equal(null);
      });
    });
  });
});
