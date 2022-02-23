import reducer, {
  projectionsChanged,
  PROJECTIONS_CHANGED
} from './projections';
import { expect } from 'chai';

describe('projections module', function() {
  describe('#projectionsChanged', function() {
    it('returns the PROJECTIONS_CHANGED action', function() {
      expect(projectionsChanged([])).to.deep.equal({
        type: PROJECTIONS_CHANGED
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not projections changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([]);
      });
    });
  });
});
