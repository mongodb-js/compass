import reducer, {
  createView,
  INITIAL_STATE,
  reset,
  CLEAR_ERROR,
  HANDLE_ERROR,
} from './';
import sinon from 'sinon';
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

  describe('#createView', function () {
    describe('when no error exists in the state', function () {
      describe('when the source is invalid', function () {
        const dispatchSpy = sinon.spy();
        const getState = () => ({
          ...INITIAL_STATE,
          name: 'myView',
          source: 'dataService',
          pipeline: [
            {
              $project: {
                a: 1,
              },
            },
          ],
        });

        before(async function () {
          await createView()(dispatchSpy, getState, {
            globalAppRegistry: { on: sinon.stub() } as any,
            dataService: {} as any,
            logger: { debug: sinon.stub(), track: sinon.stub() } as any,
          });
        });

        it.skip('dispatches the clear action and handle error actions', function () {
          expect(dispatchSpy.getCall(0).args[0].type).to.equal(CLEAR_ERROR);
          expect(dispatchSpy.getCall(1).args[0].type).to.equal(HANDLE_ERROR);
        });
      });
    });
  });
});
