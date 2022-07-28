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
        value: "{locale: 'simple'}",
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not collation string changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          text: '',
          value: null,
          isValid: true,
        });
      });
    });

    context('when the action is collation string changed', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, collationStringChanged("{locale: 'simple'}"))
        ).to.deep.equal({
          text: "{locale: 'simple'}",
          value: { locale: 'simple' },
          isValid: true,
        });
      });
    });

    context(
      'when the action is collation string changed with an invalid collation',
      function () {
        it('returns the new state', function () {
          expect(
            reducer(undefined, collationStringChanged("locale 'simple'}"))
          ).to.deep.equal({
            text: "locale 'simple'}",
            value: null,
            isValid: false,
          });
        });
      }
    );
  });
});
