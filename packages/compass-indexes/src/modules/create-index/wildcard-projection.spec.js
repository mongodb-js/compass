import reducer, {
  INITIAL_STATE,
  changeWildcardProjection,
  CHANGE_WILDCARD_PROJECTION
} from 'modules/create-index/wildcard-projection';

describe('create index wildcard projection module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(
          reducer(undefined, changeWildcardProjection({'testkey': 'testvalue'}))
        ).to.deep.equal({'testkey': 'testvalue'});
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeWildcardProjection', () => {
    it('returns the action', () => {
      expect(changeWildcardProjection({'testkey': 'testvalue'})).to.deep.equal({
        type: CHANGE_WILDCARD_PROJECTION,
        wildcardProjection: {'testkey': 'testvalue'}
      });
    });
  });
});
