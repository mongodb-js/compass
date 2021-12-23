import { expect } from 'chai';
import reducer, { INITIAL_STATE, writeStateChanged } from './is-writable';

describe('is writable module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, writeStateChanged({ isWritable: false }))).to.equal(false);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});
