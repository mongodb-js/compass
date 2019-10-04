import reducer, * as actions from './stats';

describe('stats [module]', () => {
  describe('#reducer', () => {
    context('when the action type is STATS_RECEIVED', () => {
      const action = actions.statsReceived({ rawDocumentsCount: 100 });

      it('returns the new state', () => {
        expect(reducer('', action)).to.deep.equal({
          rawDocumentsCount: 100
        });
      });
    });

    context('when the action type is not recognised', () => {
      it('returns the initial state', () => {
        expect(reducer(undefined, {})).to.deep.equal({});
      });
    });
  });

  describe('#statsReceived', () => {
    it('returns the action', () => {
      expect(actions.statsReceived({ rawDocumentsCount: 1 })).to.deep.equal({
        type: actions.STATS_RECEIVED,
        stats: { rawDocumentsCount: 1 }
      });
    });
  });
});
