import { expect } from 'chai';
import { MongoError } from 'mongodb';

import reducer, {
  ActionTypes as ErrorActionTypes,
  INITIAL_STATE,
  clearError,
  handleError,
} from './error';

describe('handle error name module', function () {
  const error = new Error('testing');

  describe('#reducer', function () {
    context('when an action is provided', function () {
      context('when the action is handle error', function () {
        it('processes the error', function () {
          expect(reducer(undefined, handleError(error))).to.equal(error.message);
          expect(reducer(undefined, handleError('something random'))).to.equal('something random');
          expect(reducer(undefined, handleError(new MongoError('legacy error')))).to.equal('legacy error');
          expect(reducer(undefined, handleError(undefined))).to.equal('Unknown error');
          expect(reducer(undefined, handleError(null))).to.equal('Unknown error');
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
        type: ErrorActionTypes.HandleError,
        error: error,
      });
    });
  });

  describe('#clearError', function () {
    it('returns the action', function () {
      expect(clearError()).to.deep.equal({
        type: ErrorActionTypes.ClearError,
      });
    });
  });
});
