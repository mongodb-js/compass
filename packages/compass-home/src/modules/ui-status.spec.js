import reducer, {
  INITIAL_STATE,
  changeUiStatus,
  CHANGE_UI_STATUS
} from 'modules/ui-status';

describe('ui-status module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeUiStatus('new uiStatus'))).to.equal('new uiStatus');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeUiStatus', () => {
    it('returns the action', () => {
      expect(changeUiStatus('new uiStatus w action')).to.deep.equal({
        type: CHANGE_UI_STATUS,
        uiStatus: 'new uiStatus w action'
      });
    });
  });
});
