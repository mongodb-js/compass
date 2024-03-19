import React from 'react';
import { screen, render, cleanup, waitFor } from '@testing-library/react';
import type { ConnectionOptions } from 'mongodb-data-service';
import { expect } from 'chai';
import { CompassWeb } from './';
import Sinon from 'sinon';
import EventEmitter from 'events';
import ConnectionString from 'mongodb-connection-string-url';

function mockDb(name: string) {
  return { _id: name, name };
}

class MockDataService extends EventEmitter {
  constructor(private connectionOptions: ConnectionOptions) {
    super();
  }
  getConnectionString() {
    return new ConnectionString(this.connectionOptions.connectionString);
  }
  getConnectionOptions() {
    return { connectionString: 'mongodb://localhost:27017' };
  }
  getLastSeenTopology() {
    return { type: 'Unknown', servers: new Map([]) };
  }
  instance() {
    return Promise.resolve({});
  }
  currentOp() {
    return Promise.resolve({});
  }
  top() {
    return Promise.resolve({});
  }
  configuredKMSProviders() {
    return [];
  }
  listDatabases() {
    return Promise.resolve([mockDb('foo'), mockDb('bar'), mockDb('buz')]);
  }
  disconnect() {}
  addReauthenticationHandler() {}
}

describe('CompassWeb', function () {
  before(function () {
    // TODO(COMPASS-7551): for some reason, specifically evergreen rhel machine can't
    // fully render this component, skipping for now
    if (process.env.EVERGREEN_BUILD_VARIANT === 'rhel') {
      this.skip();
    }
  });

  const mockConnectFn = Sinon.spy(
    ({ connectionOptions }: { connectionOptions: ConnectionOptions }) => {
      return Sinon.spy(new MockDataService(connectionOptions));
    }
  );

  function renderCompassWeb(
    props: Partial<React.ComponentProps<typeof CompassWeb>> = {},
    connectFn = mockConnectFn
  ) {
    return render(
      <CompassWeb
        connectionInfo={{
          id: 'foo',
          connectionOptions: { connectionString: 'mongodb://localhost:27017' },
        }}
        onActiveWorkspaceTabChange={() => {}}
        {...props}
        // @ts-expect-error see component props description
        __TEST_MONGODB_DATA_SERVICE_CONNECT_FN={connectFn}
      ></CompassWeb>
    );
  }

  afterEach(cleanup);

  it('should render CompassWeb and connect using provided connection string', async function () {
    renderCompassWeb();

    await waitFor(() => {
      screen.getByText('Connecting to localhost:27017…');
    });

    expect(mockConnectFn).to.have.been.calledWithMatch({
      connectionOptions: { connectionString: 'mongodb://localhost:27017' },
    });

    // Wait for connection to happen and navigation tree to render
    await waitFor(() => {
      screen.getByTestId('compass-web-connected');
      screen.getByRole('button', { name: 'Databases' });
      screen.getAllByRole('tree');
    });

    // TODO(COMPASS-7551): These are not rendered in tests because of the
    // navigation virtualization. We should make it possible to render those
    // here either by modifying the dom observer mock or by providing some way
    // to pass the test value to the virtualized component
    // expect(screen.getByRole('treeitem', {name: 'foo'})).to.exist;
    // expect(screen.getByRole('treeitem', {name: 'bar'})).to.exist;
    // expect(screen.getByRole('treeitem', {name: 'buz'})).to.exist;
  });
});
