import reducer, { collationCollapseToggled, COLLATION_COLLAPSE_TOGGLED } from 'modules/collation-collapser';

describe('collation collapser module', () => {
  describe('#collationCollapseToggled', () => {
    it('returns the COLLATION_COLLAPSE_TOGGLED action', () => {
      expect(collationCollapseToggled()).to.deep.equal({
        type: COLLATION_COLLAPSE_TOGGLED
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not collation collapser toggled', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is collation collapser toggled', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, collationCollapseToggled()))
          .to.equal(true);
      });
    });
  });
});
