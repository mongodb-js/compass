import reducer, { collationStringChanged, COLLATION_STRING_CHANGED } from 'modules/collation-string';

describe('collation string module', () => {
  describe('#collationStringChanged', () => {
    it('returns the COLLATION_STRING_CHANGED action', () => {
      expect(collationStringChanged("{locale: 'simple'}")).to.deep.equal({
        type: COLLATION_STRING_CHANGED,
        collationString: "{locale: 'simple'}"
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not collation string changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal('');
      });
    });

    context('when the action is collation string changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, collationStringChanged("{locale: 'simple'}")))
          .to.equal("{locale: 'simple'}");
      });
    });
  });
});
