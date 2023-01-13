import sinon from 'sinon';
import { expect } from 'chai';
import reducer, { createDatabase } from '../create-database';
import { NO_DOT } from '../create-collection';
import { reset } from '../reset';
import { CLEAR_ERROR, HANDLE_ERROR } from '../error';

describe('create database module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      context('when the action is reset', function () {
        const dataService = 'data-service';

        it('returns the reset state', function () {
          expect(reducer({ dataService: dataService }, reset())).to.deep.equal({
            dataService: 'data-service',
            error: null,
            isRunning: false,
            isVisible: false,
          });
        });
      });
    });
  });

  describe('#createDatabase', function () {
    context('when no error exists in the state', function () {
      context('when the database name is invalid', function () {
        const dispatchSpy = sinon.spy();
        const getState = () => ({ dataService: { dataService: 'ds' } });

        before(function () {
          createDatabase({
            database: 'test.test',
          })(dispatchSpy, getState);
        });

        it('dispatches the clear action and handle error actions', function () {
          expect(dispatchSpy.getCall(0).args[0].type).to.equal(CLEAR_ERROR);
          expect(dispatchSpy.getCall(1).args[0].type).to.equal(HANDLE_ERROR);
          expect(dispatchSpy.getCall(1).args[0].error.message).to.equal(NO_DOT);
        });
      });

      context('when the database name is valid', function () {
        context('when the collection contains no special options', function () {
          context('when the create is a success', function () {});

          context('when the create errors', function () {});
        });

        context('when the collection is capped', function () {
          context('when the create is a success', function () {});

          context('when the create errors', function () {});
        });

        context('when the collection has a collation', function () {
          context('when the create is a success', function () {});

          context('when the create errors', function () {});
        });
      });
    });
  });
});
