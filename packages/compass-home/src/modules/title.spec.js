import reducer, {
  INITIAL_STATE,
  changeTitle,
  CHANGE_TITLE
} from 'modules/title';

describe('title module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeTitle('new title'))).to.equal('new title');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeTitle', () => {
    it('returns the action', () => {
      expect(changeTitle('new title w action')).to.deep.equal({
        type: CHANGE_TITLE,
        title: 'new title w action'
      });
    });
  });
});
