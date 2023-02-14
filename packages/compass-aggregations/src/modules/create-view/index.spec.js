import reducer, { createView, INITIAL_STATE } from '../create-view';
import { reset } from '../create-view/reset';
import { CLEAR_ERROR, HANDLE_ERROR } from '../create-view/error';
import sinon from 'sinon';
import { expect } from 'chai';

describe('create view module', function () {
  describe('#reducer', function () {
    describe('when an action is provided', function () {
      describe('when the action is reset', function () {
        const dataService = 'data-service';

        it('returns the reset state', function () {
          expect(
            reducer({ dataService: dataService, appRegistry: 'test' }, reset())
          ).to.deep.equal({
            ...INITIAL_STATE,
            dataService: dataService,
            appRegistry: 'test',
          });
        });
      });
    });
  });

  describe('#createView', function () {
    describe('when no error exists in the state', function () {
      describe('when the source is invalid', function () {
        const dispatchSpy = sinon.spy();
        const getState = () => ({
          name: 'myView',
          source: 'dataService',
          pipeline: [
            {
              $project: {
                a: 1,
              },
            },
          ],
          dataService: { dataService: 'ds' },
        });

        before(function () {
          createView()(dispatchSpy, getState);
        });

        it.skip('dispatches the clear action and handle error actions', function () {
          expect(dispatchSpy.getCall(0).args[0].type).to.equal(CLEAR_ERROR);
          expect(dispatchSpy.getCall(1).args[0].type).to.equal(HANDLE_ERROR);
        });
      });
    });
  });
});
