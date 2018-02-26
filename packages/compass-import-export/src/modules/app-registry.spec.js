import reducer, * as actions from 'modules/app-registry';

describe('app-registry [module]', () => {
  const spy = sinon.spy();

  describe('#reducer', () => {
    context('when the action type is APP_REGISTRY_ACTIVATED', () => {
      const action = actions.appRegistryActivated(spy);

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

  describe('#statsReceived', () => {
    it('returns the action', () => {
      expect(actions.appRegistryActivated(spy)).to.deep.equal({
        type: actions.APP_REGISTRY_ACTIVATED,
        appRegistry: spy
      });
    });
  });
});
