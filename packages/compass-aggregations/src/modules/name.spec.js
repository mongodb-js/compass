import reducer, { nameChanged, NAME_CHANGED } from './name';
import { expect } from 'chai';

describe('name module', function() {
  describe('#nameChanged', function() {
    it('returns the NAME_CHANGED action', function() {
      expect(nameChanged('testing')).to.deep.equal({
        type: NAME_CHANGED,
        name: 'testing'
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not name changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal('');
      });
    });

    context('when the action is name changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, nameChanged('testing'))).to.equal('testing');
      });
    });
  });
});
