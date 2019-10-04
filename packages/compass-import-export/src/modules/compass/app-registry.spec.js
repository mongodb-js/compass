import reducer, * as actions from './app-registry';

describe('app-registry [module]', () => {
  const spy = sinon.spy();

  describe('#reducer', () => {
    context('when the action type is ACTIVATED', () => {
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
        type: actions.ACTIVATED,
        appRegistry: spy
      });
    });
  });

  describe('#appRegistryEmit', () => {
    it('returns the action', () => {
      expect(actions.appRegistryEmit('refresh-documents', spy)).to.deep.equal({
        type: actions.EMIT,
        name: 'refresh-documents',
        args: [ spy ]
      });
    });
  });
});
