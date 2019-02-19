import reducer, {
  INITIAL_STATE,
  changeDescription,
  CHANGE_DESCRIPTION
} from 'modules/description';

describe('sidebar description', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeDescription('new description'))).to.equal('new description');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeDescription', () => {
    it('returns the action', () => {
      expect(changeDescription('new description w action')).to.deep.equal({
        type: CHANGE_DESCRIPTION,
        description: 'new description w action'
      });
    });
  });
});
