import sinon from 'sinon';

import {
  ERROR_UPDATING_VIEW,
  updateView
} from './update-view';

describe('large-limit module', () => {
  describe('#updateView', () => {
    let dispatchFake = sinon.fake();
    let stateMock;
    let getStateMock;
    let updateCollectionFake = sinon.fake();

    beforeEach(() => {
      dispatchFake = sinon.fake();
      updateCollectionFake = sinon.fake.yields(null);
      stateMock = {
        namespace: 'aa.bb',
        editViewName: 'aa.bb',
        pipeline: [{
          id: 0,
          isEnabled: true,
          isExpanded: true,
          isValid: true,
          snippet: '',
          stageOperator: '$project',
          stage: '{_id: 0, avg_price: {$avg: "$price"}}'
        }],
        dataService: {
          dataService: {
            updateCollection: updateCollectionFake
          }
        }
      };
      getStateMock = () => stateMock;

      const runUpdateView = updateView();
      runUpdateView(dispatchFake, getStateMock);
    });

    it('first it calls to dismiss any existing error', () => {
      expect(dispatchFake.firstCall.args[0]).to.deep.equal({
        type: 'aggregations/update-view/DISMISS_VIEW_UPDATE_ERROR'
      });
    });

    it('calls the data service to update the view for the provided ns', () => {
      expect(updateCollectionFake.firstCall.args[0]).to.equal('aa.bb');
      expect(updateCollectionFake.firstCall.args[1]).to.deep.equal({
        viewOn: 'bb',
        pipeline: [{
          $project: {
            _id: 0,
            avg_price: {
              $avg: '$price'
            }
          }
        }]
      });
    });

    it('does not perform a updateViewErrorOccured action', () => {
      const calls = dispatchFake.getCalls();
      calls.map(call => {
        expect(call.args[0].type).to.not.equal(ERROR_UPDATING_VIEW);
      });
    });

    describe('when the dataservice updateCollection errors', () => {
      beforeEach(() => {
        stateMock.dataService.dataService = {
          updateCollection: sinon.fake.yields(
            new Error('lacking grocery stores open on Sundays')
          )
        };
        getStateMock = () => stateMock;
        const runUpdateView = updateView();
        runUpdateView(dispatchFake, getStateMock);
      });

      it('dispatches the updateViewErrorOccured action with an error', () => {
        const calls = dispatchFake.getCalls();
        const matching = calls.filter(call => call.args[0].type === ERROR_UPDATING_VIEW);
        expect(matching[0].args[0]).to.deep.equal({
          type: 'aggregations/update-view/ERROR_UPDATING_VIEW',
          error: 'Error: lacking grocery stores open on Sundays'
        });
      });
    });
  });
});
