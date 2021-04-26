import reducer, {
  INITIAL_STATE,
  changeCollectionNameConfirmation,
  CHANGE_COLLECTION_NAME_CONFIRMATION
} from 'modules/drop-collection/name-confirmation';

describe('drop collection name confirmation module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeCollectionNameConfirmation('testing'))).to.equal('testing');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeCollectionNameConfirmation', () => {
    it('returns the action', () => {
      expect(changeCollectionNameConfirmation('test')).to.deep.equal({
        type: CHANGE_COLLECTION_NAME_CONFIRMATION,
        nameConfirmation: 'test'
      });
    });
  });
});
