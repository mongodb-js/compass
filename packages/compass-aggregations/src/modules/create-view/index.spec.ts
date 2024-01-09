import reducer, { INITIAL_STATE, reset } from './';
import { expect } from 'chai';

describe('create view module', function () {
  describe('#reducer', function () {
    describe('when an action is provided', function () {
      describe('when the action is reset', function () {
        it('returns the reset state', function () {
          expect(reducer(INITIAL_STATE, reset())).to.deep.equal({
            ...INITIAL_STATE,
          });
        });
      });
    });
  });
});
