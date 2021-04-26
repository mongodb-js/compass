import reducer, {
  projectionsChanged,
  PROJECTIONS_CHANGED
} from 'modules/projections';

describe('projections module', () => {
  describe('#projectionsChanged', () => {
    it('returns the PROJECTIONS_CHANGED action', () => {
      expect(projectionsChanged([])).to.deep.equal({
        type: PROJECTIONS_CHANGED
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not projections changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([]);
      });
    });
  });
});
