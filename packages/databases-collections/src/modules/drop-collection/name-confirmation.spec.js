import { expect } from 'chai';
import reducer, {
  INITIAL_STATE,
  changeCollectionNameConfirmation,
  CHANGE_COLLECTION_NAME_CONFIRMATION,
} from '../drop-collection/name-confirmation';

describe('drop collection name confirmation module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, changeCollectionNameConfirmation('testing'))
        ).to.equal('testing');
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeCollectionNameConfirmation', function () {
    it('returns the action', function () {
      expect(changeCollectionNameConfirmation('test')).to.deep.equal({
        type: CHANGE_COLLECTION_NAME_CONFIRMATION,
        nameConfirmation: 'test',
      });
    });
  });
});
