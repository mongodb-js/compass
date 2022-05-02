import sinon from 'sinon';
import { expect } from 'chai';
import reducer, { createDatabase } from '../create-database';
import { NO_DOT } from '../create-collection';
import { reset } from '../reset';
import { CLEAR_ERROR, HANDLE_ERROR } from '../error';

describe('create database module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is reset', () => {
        const dataService = 'data-service';

        it('returns the reset state', () => {
          expect(reducer({ dataService: dataService }, reset())).to.deep.equal({
            dataService: 'data-service',
            error: null,
            isRunning: false,
            isVisible: false
          });
        });
      });
    });
  });

  describe('#createDatabase', () => {
    context('when no error exists in the state', () => {
      context('when the database name is invalid', () => {
        const dispatchSpy = sinon.spy();
        const getState = () => ({ dataService: { dataService: 'ds' }});

        before(() => {
          createDatabase({
            database: 'test.test'
          })(dispatchSpy, getState);
        });

        it('dispatches the clear action and handle error actions', () => {
          expect(dispatchSpy.getCall(0).args[0].type).to.equal(CLEAR_ERROR);
          expect(dispatchSpy.getCall(1).args[0].type).to.equal(HANDLE_ERROR);
          expect(dispatchSpy.getCall(1).args[0].error.message).to.equal(NO_DOT);
        });
      });

      context('when the database name is valid', () => {
        context('when the collection contains no special options', () => {
          context('when the create is a success', () => {

          });

          context('when the create errors', () => {

          });
        });

        context('when the collection is capped', () => {
          context('when the create is a success', () => {

          });

          context('when the create errors', () => {

          });
        });

        context('when the collection has a collation', () => {
          context('when the create is a success', () => {

          });

          context('when the create errors', () => {

          });
        });
      });
    });
  });
});
