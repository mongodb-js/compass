import reducer, { createCollection, NO_DOT } from 'modules/create-collection';
import { reset } from 'modules/reset';
import { CLEAR_ERROR, HANDLE_ERROR } from 'modules/error';

describe('create collection module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is reset', () => {
        const dataService = 'data-service';

        it('returns the reset state', () => {
          expect(reducer({ dataService: dataService }, reset())).to.deep.equal({
            cappedSize: '',
            collation: {},
            collectionName: '',
            dataService: 'data-service',
            error: null,
            isCapped: false,
            isCustomCollation: false,
            isRunning: false,
            isVisible: false,
            name: ''
          });
        });
      });
    });
  });

  describe('#createCollection', () => {
    context('when no error exists in the state', () => {
      context('when the collection name is invalid', () => {
        const dispatchSpy = sinon.spy();
        const getState = () => ({ name: 'test.test', dataService: { dataService: 'ds' }});

        before(() => {
          createCollection()(dispatchSpy, getState);
        });

        it('dispatches the clear action and handle error actions', () => {
          expect(dispatchSpy.getCall(0).args[0].type).to.equal(CLEAR_ERROR);
          expect(dispatchSpy.getCall(1).args[0].type).to.equal(HANDLE_ERROR);
          expect(dispatchSpy.getCall(1).args[0].error.message).to.equal(NO_DOT);
        });
      });

      context('when the collection name is valid', () => {
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
