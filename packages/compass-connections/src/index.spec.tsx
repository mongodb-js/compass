import React from 'react';
import type { RenderConnectionsOptions } from '@mongodb-js/testing-library-compass';
import {
  createDefaultConnectionInfo,
  render,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

function renderCompassConnections(opts?: RenderConnectionsOptions) {
  return render(
    <div>
      {/* it's a bit weird, but testing-library-compass already renders CompassConnections for us */}
    </div>,
    opts
  );
}

describe('CompassConnections', function () {
  it('autoconnects and does not save autoconnect info when mounted', async function () {
    const { connectionsStore, connectionStorage } = renderCompassConnections({
      onAutoconnectInfoRequest() {
        return Promise.resolve({
          id: 'autoconnect',
          connectionOptions: {
            connectionString: 'mongodb://autoconnect',
          },
        });
      },
    });

    await waitFor(() => {
      expect(connectionsStore.getState().connections.byId)
        .to.have.property('autoconnect')
        .have.property('status', 'connected');
    });

    const storedConnection = await connectionStorage.load({
      id: 'autoconnect',
    });

    // autoconnect info should never be saved
    expect(storedConnection).to.eq(undefined);
  });

  it('cleans-up connections when unmounted', async function () {
    const conn1 = createDefaultConnectionInfo();
    const conn2 = createDefaultConnectionInfo();

    const result = renderCompassConnections({ connections: [conn1, conn2] });

    await result.connectionsStore.actions.connect(conn1);

    expect(
      result.connectionsStore.getState().connections.byId[conn1.id]
    ).to.have.property('status', 'connected');

    result.unmount();

    expect(
      result.connectionsStore.getState().connections.byId[conn1.id]
    ).to.have.property('status', 'disconnected');
  });
});
