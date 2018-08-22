import reducer, { collationValidated, COLLATION_VALIDATED } from 'modules/is-collation-valid';

describe('collation validated module', () => {
  describe('#isCollationValid', () => {
    it('returns the COLLATION_VALIDATED action', () => {
      expect(collationValidated("{locale: 'simple'}")).to.deep.equal({
        type: COLLATION_VALIDATED,
        isCollationValid: true
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not collation validated', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is collation validated', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, collationValidated("{locale: 'simple'}"))).to.equal(true);
      });
    });
  });
});
