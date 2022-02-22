import reducer, { collationChanged, COLLATION_CHANGED } from './collation';
import { expect } from 'chai';

describe('collation module', function() {
  describe('#collationChanged', function() {
    it('returns the COLLATION_CHANGED action', function() {
      expect(collationChanged("{locale: 'simple'}")).to.deep.equal({
        type: COLLATION_CHANGED,
        collation: { locale: 'simple' }
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not collation changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(null);
      });
    });

    context('when the action is collation changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, collationChanged("{locale: 'simple'}")))
          .to.deep.equal({ locale: 'simple' });
      });
    });
  });
});
