import sinon from 'sinon';
import { expect } from 'chai';
import { ERROR_UPDATING_VIEW, updateView } from './update-view';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import AppRegistry from 'hadron-app-registry';
import {
  type ConnectionInfoRef,
  ConnectionScopedAppRegistryImpl,
} from '@mongodb-js/compass-connections/provider';
import { createDefaultConnectionInfo } from '@mongodb-js/testing-library-compass';

const TEST_CONNECTION_INFO = { ...createDefaultConnectionInfo(), title: '' };

describe('update-view module', function () {
  const globalAppRegistry = new AppRegistry();
  const connectionInfoRef: ConnectionInfoRef = {
    current: TEST_CONNECTION_INFO,
  };
  const connectionScopedAppRegistry = new ConnectionScopedAppRegistryImpl(
    globalAppRegistry.emit.bind(globalAppRegistry),
    connectionInfoRef
  );
  const thunkArg = {
    globalAppRegistry,
    connectionScopedAppRegistry,
    localAppRegistry: new AppRegistry(),
    pipelineBuilder: {
      getPipelineFromStages() {
        return [{ $project: { _id: 0, avg_price: { $avg: '$price' } } }];
      },
      getPipelineFromSource() {
        return [{ $project: { _id: 0, avg_price: { $avg: '$price' } } }];
      },
    },
    workspaces: {
      openCollectionWorkspace() {},
    },
    logger: createNoopLogger(),
    track: createNoopTrack(),
    connectionInfoRef: {
      current: TEST_CONNECTION_INFO,
    },
  };

  describe('#updateView', function () {
    let dispatchFake = sinon.fake();
    let stateMock: any;
    let getStateMock: () => any;
    let updateCollectionFake = sinon.fake();

    beforeEach(async function () {
      dispatchFake = sinon.fake();
      updateCollectionFake = sinon.fake.resolves(undefined);
      stateMock = {
        pipelineBuilder: { pipelineMode: 'builder-ui' },
        focusMode: { isEnabled: false },
        namespace: 'aa.bb',
        editViewName: 'aa.bb',
        dataService: {
          dataService: {
            updateCollection: updateCollectionFake,
          },
        },
      };
      getStateMock = () => stateMock;

      const runUpdateView = updateView();
      await runUpdateView(dispatchFake, getStateMock, thunkArg as any);
    });

    it('first it calls to dismiss any existing error', function () {
      expect(dispatchFake.firstCall.args[0]).to.deep.equal({
        type: 'aggregations/update-view/DISMISS_VIEW_UPDATE_ERROR',
      });
    });

    it('calls the data service to update the view for the provided ns', function () {
      expect(updateCollectionFake.firstCall.args[0]).to.equal('aa.bb');
      expect(updateCollectionFake.firstCall.args[1]).to.deep.equal({
        viewOn: 'bb',
        pipeline: [
          {
            $project: {
              _id: 0,
              avg_price: {
                $avg: '$price',
              },
            },
          },
        ],
      });
    });

    it('does not perform a updateViewErrorOccured action', function () {
      const calls = dispatchFake.getCalls();
      calls.map((call) => {
        expect(call.args[0].type).to.not.equal(ERROR_UPDATING_VIEW);
      });
    });

    describe('when the dataservice updateCollection errors', function () {
      beforeEach(async function () {
        stateMock.dataService.dataService = {
          updateCollection: sinon.fake.rejects(
            new Error('lacking grocery stores open on Sundays')
          ),
        };
        getStateMock = () => stateMock;
        const runUpdateView = updateView();
        await runUpdateView(dispatchFake, getStateMock, thunkArg as any);
      });

      it('dispatches the updateViewErrorOccured action with an error', function () {
        const calls = dispatchFake.getCalls();
        const matching = calls.filter(
          (call) => call.args[0].type === ERROR_UPDATING_VIEW
        );
        expect(matching[0].args[0]).to.deep.equal({
          type: 'aggregations/update-view/ERROR_UPDATING_VIEW',
          error: 'Error: lacking grocery stores open on Sundays',
        });
      });
    });
  });
});
