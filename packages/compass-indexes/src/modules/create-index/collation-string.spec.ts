import reducer, {
  collationStringChanged,
  COLLATION_STRING_CHANGED,
} from './collation-string';
import { expect } from 'chai';

describe('collation string module', function () {
  describe('#collationStringChanged', function () {
    it('returns the COLLATION_STRING_CHANGED action', function () {
      expect(collationStringChanged("{locale: 'simple'}")).to.deep.equal({
        type: COLLATION_STRING_CHANGED,
        collationString: "{locale: 'simple'}",
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not collation string changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal('');
      });
    });

    context('when the action is collation string changed', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, collationStringChanged("{locale: 'simple'}"))
        ).to.deep.equal("{locale: 'simple'}");
      });
    });

    context(
      'when the action is collation string changed with an invalid collation',
      function () {
        it('returns the new state', function () {
          expect(
            reducer(undefined, collationStringChanged("locale 'simple'}"))
          ).to.deep.equal("locale 'simple'}");
        });
      }
    );
  });
});
