import sinon from 'sinon';
import { expect } from 'chai';

import {
  ERROR_UPDATING_VIEW,
  updateView
} from './update-view';

describe('large-limit module', function() {
  const thunkArg = {
    pipelineBuilder: {
      getPipelineFromStages() {
        return [{ $project: { _id: 0, avg_price: { $avg: '$price' } } }];
      },
      getPipelineFromSource() {
        return [{ $project: { _id: 0, avg_price: { $avg: '$price' } } }];
      }
    }
  }

  describe('#updateView', function() {
    let dispatchFake = sinon.fake();
    let stateMock;
    let getStateMock;
    let updateCollectionFake = sinon.fake();

    beforeEach(function() {
      dispatchFake = sinon.fake();
      updateCollectionFake = sinon.fake.yields(null);
      stateMock = {
        pipelineBuilder: {pipelineMode: 'builder-ui'},
        namespace: 'aa.bb',
        editViewName: 'aa.bb',
        dataService: {
          dataService: {
            updateCollection: updateCollectionFake
          }
        }
      };
      getStateMock = () => stateMock;

      const runUpdateView = updateView();
      runUpdateView(dispatchFake, getStateMock, thunkArg);
    });

    it('first it calls to dismiss any existing error', function() {
      expect(dispatchFake.firstCall.args[0]).to.deep.equal({
        type: 'aggregations/update-view/DISMISS_VIEW_UPDATE_ERROR'
      });
    });

    it('calls the data service to update the view for the provided ns', function() {
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

    it('does not perform a updateViewErrorOccured action', function() {
      const calls = dispatchFake.getCalls();
      calls.map(call => {
        expect(call.args[0].type).to.not.equal(ERROR_UPDATING_VIEW);
      });
    });

    describe('when the dataservice updateCollection errors', function() {
      beforeEach(function() {
        stateMock.dataService.dataService = {
          updateCollection: sinon.fake.yields(
            new Error('lacking grocery stores open on Sundays')
          )
        };
        getStateMock = () => stateMock;
        const runUpdateView = updateView();
        runUpdateView(dispatchFake, getStateMock, thunkArg);
      });

      it('dispatches the updateViewErrorOccured action with an error', function() {
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
