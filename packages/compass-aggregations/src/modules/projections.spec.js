import reducer, {
  projectionsChanged,
  PROJECTIONS_CHANGED
} from './projections';
import { expect } from 'chai';
import Sinon from 'sinon';

describe('projections module', function() {
  describe('#projectionsChanged', function() {
    it('returns the PROJECTIONS_CHANGED action', function() {
      const dispatchSpy = Sinon.spy();
      projectionsChanged()(dispatchSpy, () => ({ pipeline: [] }))
      expect(dispatchSpy).to.be.calledOnceWith({
        type: PROJECTIONS_CHANGED,
        projections: []
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
