import { expect } from 'chai';
import reducer, {
  INITIAL_STATE,
  changeCollectionName,
  CHANGE_COLLECTION_NAME
} from '../drop-collection/name';

describe('drop collection name module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, changeCollectionName('testing'))).to.equal('testing');
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeCollectionName', function() {
    it('returns the action', function() {
      expect(changeCollectionName('test')).to.deep.equal({
        type: CHANGE_COLLECTION_NAME,
        name: 'test'
      });
    });
  });
});
