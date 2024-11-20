import React from 'react';
import {
  createDefaultConnectionInfo,
  render,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

describe('CompassConnections', function () {
  it('cleans-up connections when unmounted', async function () {
    const conn1 = createDefaultConnectionInfo();
    const conn2 = createDefaultConnectionInfo();

    const result = render(
      <div>
        {/* it's a bit weird, but testing-library-compass already renders CompassConnections for us */}
      </div>,
      { connections: [conn1, conn2] }
    );

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
