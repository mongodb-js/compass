import reducer, {
  INITIAL_STATE,
  changeNamespace,
  CHANGE_NAMESPACE
} from 'modules/namespace';

describe('namespace module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeNamespace('new namespace'))).to.equal('new namespace');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeNamespace', () => {
    it('returns the action', () => {
      expect(changeNamespace('new namespace w action')).to.deep.equal({
        type: CHANGE_NAMESPACE,
        namespace: 'new namespace w action'
      });
    });
  });
});
