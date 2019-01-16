import reducer, {
  INITIAL_STATE,
  getDescription,
  GET_DESCRIPTION
} from 'modules/description';

describe('drop/create index is visible module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, getDescription('new description'))).to.equal('new description');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#getDescription', () => {
    it('returns the action', () => {
      expect(getDescription('new description w action')).to.deep.equal({
        type: GET_DESCRIPTION,
        description: 'new description w action'
      });
    });
  });
});
