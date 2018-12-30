import reducer, {
  INITIAL_STATE,
  changeCappedSize,
  CHANGE_CAPPED_SIZE
} from 'modules/create-database/capped-size';

describe('create database capped size module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeCappedSize('128'))).to.equal(128);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeCappedSize', () => {
    it('returns the action', () => {
      expect(changeCappedSize('124')).to.deep.equal({
        type: CHANGE_CAPPED_SIZE,
        size: '124'
      });
    });
  });
});
