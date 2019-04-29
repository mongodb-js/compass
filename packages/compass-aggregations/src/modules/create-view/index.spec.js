import reducer, { createView, INITIAL_STATE } from 'modules/create-view';
import { reset } from 'modules/create-view/reset';
import { CLEAR_ERROR, HANDLE_ERROR } from 'modules/create-view/error';

describe('create view module', () => {
  describe('#reducer', () => {
    describe('when an action is provided', () => {
      describe('when the action is reset', () => {
        const dataService = 'data-service';

        it('returns the reset state', () => {
          expect(reducer({ dataService: dataService }, reset())).to.deep.equal({
            ...INITIAL_STATE,
            dataService: dataService
          });
        });
      });
    });
  });

  describe('#createView', () => {
    describe('when no error exists in the state', () => {
      describe('when the source is invalid', () => {
        const dispatchSpy = sinon.spy();
        const getState = () => ({
          name: 'myView',
          source: 'dataService',
          pipeline: [
            {
              $project: {
                a: 1
              }
            }
          ],
          dataService: { dataService: 'ds' }
        });

        before(() => {
          createView()(dispatchSpy, getState);
        });

        it.skip('dispatches the clear action and handle error actions', () => {
          expect(dispatchSpy.getCall(0).args[0].type).to.equal(CLEAR_ERROR);
          expect(dispatchSpy.getCall(1).args[0].type).to.equal(HANDLE_ERROR);
        });
      });
    });
  });
});
