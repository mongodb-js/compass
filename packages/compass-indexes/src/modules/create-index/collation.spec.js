import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  changeCollationOption,
  CHANGE_COLLATION_OPTION
} from '../create-index/collation';

describe('create index collation module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, changeCollationOption('locale', 'ar'))).
          to.deep.equal({ locale: 'ar' });
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeCollationOption', function() {
    it('returns the action', function() {
      expect(changeCollationOption('locale', 'ar')).to.deep.equal({
        type: CHANGE_COLLATION_OPTION,
        field: 'locale',
        value: 'ar'
      });
    });
  });
});
