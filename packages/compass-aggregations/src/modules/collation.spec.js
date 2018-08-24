import reducer, { collationChanged, COLLATION_CHANGED } from 'modules/collation';

describe('collation module', () => {
  describe('#collationChanged', () => {
    it('returns the COLLATION_CHANGED action', () => {
      expect(collationChanged("{locale: 'simple'}")).to.deep.equal({
        type: COLLATION_CHANGED,
        collation: { locale: 'simple' }
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not collation changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(null);
      });
    });

    context('when the action is collation changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, collationChanged("{locale: 'simple'}")))
          .to.deep.equal({ locale: 'simple' });
      });
    });
  });
});
