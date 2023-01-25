import reducer, { createId, CREATE_ID } from './id';
import { expect } from 'chai';

describe('id module', function () {
  describe('#createId', function () {
    it('returns the CREATE_ID action', function () {
      expect(createId()).to.deep.equal({
        type: CREATE_ID,
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not create id', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.equal('');
      });
    });

    context('when the action is create id', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, createId())).to.not.equal('');
      });
    });
  });
});
