import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  clearError,
  handleError,
  CLEAR_ERROR,
  HANDLE_ERROR,
} from './error';

describe('handle error name module', function () {
  const error = new Error('testing');

  describe('#reducer', function () {
    context('when an action is provided', function () {
      context('when the action is handle error', function () {
        it('returns the new state', function () {
          expect(reducer(undefined, handleError(error))).to.equal(error);
        });
      });

      context('when the action is clear error', function () {
        it('returns null', function () {
          expect(reducer(undefined, clearError())).to.equal(null);
        });
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#handleError', function () {
    it('returns the action', function () {
      expect(handleError(error)).to.deep.equal({
        type: HANDLE_ERROR,
        error: error,
      });
    });
  });

  describe('#clearError', function () {
    it('returns the action', function () {
      expect(clearError()).to.deep.equal({
        type: CLEAR_ERROR,
      });
    });
  });
});
