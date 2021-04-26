import reducer, {
  INITIAL_STATE,
  changeName,
  CHANGE_NAME
} from 'modules/create-index/name';

describe('create index name module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeName('testing'))).to.equal('testing');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeName', () => {
    it('returns the action', () => {
      expect(changeName('test')).to.deep.equal({
        type: CHANGE_NAME,
        name: 'test'
      });
    });
  });
});
