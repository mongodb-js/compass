import reducer, { sourceNameChanged, SOURCE_NAME_CHANGED } from './source-name';
import { expect } from 'chai';

describe('sourceName module', function() {
  describe('#sourceNameChanged', function() {
    it('returns the SOURCE_NAME_CHANGED action', function() {
      expect(sourceNameChanged('testing')).to.deep.equal({
        type: SOURCE_NAME_CHANGED,
        sourceName: 'testing'
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not sourceName changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(null);
      });
    });

    context('when the action is sourceName changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, sourceNameChanged('testing'))).to.equal('testing');
      });
    });
  });
});
