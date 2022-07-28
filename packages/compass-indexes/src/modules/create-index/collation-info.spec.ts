import reducer, {
  collationInfoChanged,
  COLLATION_INFO_CHANGED,
} from './collation-info';
import { expect } from 'chai';

describe('collation info module', function () {
  describe('#collationInfoChanged', function () {
    it('returns the COLLATION_INFO_CHANGED action', function () {
      expect(collationInfoChanged("{locale: 'simple'}")).to.deep.equal({
        type: COLLATION_INFO_CHANGED,
        collationString: "{locale: 'simple'}",
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not collation info changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          text: '',
          value: null,
          isValid: true,
        });
      });
    });

    context('when the action is collation info changed', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, collationInfoChanged("{locale: 'simple'}"))
        ).to.deep.equal({
          text: "{locale: 'simple'}",
          value: { locale: 'simple' },
          isValid: true,
        });
      });
    });

    context(
      'when the action is collation info changed with an invalid collation',
      function () {
        it('returns the new state', function () {
          expect(
            reducer(undefined, collationInfoChanged("locale 'simple'}"))
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
