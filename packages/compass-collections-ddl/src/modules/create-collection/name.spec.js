import reducer, {
  INITIAL_STATE,
  changeCollectionName,
  CHANGE_COLLECTION_NAME
} from 'modules/create-collection/name';

describe('create collection name module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeCollectionName('testing'))).to.equal('testing');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeCollectionName', () => {
    it('returns the action', () => {
      expect(changeCollectionName('test')).to.deep.equal({
        type: CHANGE_COLLECTION_NAME,
        name: 'test'
      });
    });
  });
});
