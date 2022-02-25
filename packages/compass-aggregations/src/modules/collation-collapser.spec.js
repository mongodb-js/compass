import reducer, { collationCollapseToggled, COLLATION_COLLAPSE_TOGGLED } from './collation-collapser';
import { expect } from 'chai';

describe('collation collapser module', function() {
  describe('#collationCollapseToggled', function() {
    it('returns the COLLATION_COLLAPSE_TOGGLED action', function() {
      expect(collationCollapseToggled()).to.deep.equal({
        type: COLLATION_COLLAPSE_TOGGLED
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not collation collapser toggled', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is collation collapser toggled', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, collationCollapseToggled()))
          .to.equal(true);
      });
    });
  });
});
