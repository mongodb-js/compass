import React from 'react';
import {
  screen,
  render,
  cleanup,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import type { ConnectionOptions } from 'mongodb-data-service';
import { expect } from 'chai';
import { CompassWeb } from './entrypoint';
import Sinon from 'sinon';
import { ConnectFnProvider } from '@mongodb-js/compass-connections';
import { MockDataService as TestHelpersMockDataService } from '@mongodb-js/testing-library-compass';

function mockDb(name: string) {
  return { _id: name, name };
}

class MockDataService extends TestHelpersMockDataService {
  constructor(connectionOptions: ConnectionOptions) {
    super(connectionOptions);
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
}

describe('CompassWeb', function () {
  before(function () {
    // TODO(COMPASS-7551): for some reason, specifically evergreen rhel machine can't
    // fully render this component, skipping for now
    if (process.env.IS_RHEL === 'true') {
      this.skip();
    }
  });

  const mockConnectFn = Sinon.spy(
    ({ connectionOptions }: { connectionOptions: ConnectionOptions }) => {
      return Sinon.spy(new MockDataService(connectionOptions));
    }
  );

  const onTrackSpy = Sinon.spy();

  afterEach(function () {
    cleanup();
    Sinon.resetHistory();
  });

  async function renderCompassWebAndConnect(
    props: Partial<React.ComponentProps<typeof CompassWeb>> = {},
    connectFn = mockConnectFn
  ) {
    const result = render(
      <ConnectFnProvider connect={connectFn as any}>
        <CompassWeb
          orgId=""
          projectId=""
          initialWorkspace={undefined as any}
          onActiveWorkspaceTabChange={() => {}}
          onTrack={onTrackSpy}
          {...props}
          initialPreferences={{
            enableCreatingNewConnections: true,
            ...props.initialPreferences,
          }}
        ></CompassWeb>
      </ConnectFnProvider>
    );
    userEvent.click(
      screen.getAllByRole('button', { name: 'Add new connection' })[0]
    );
    await waitFor(() => {
      screen.getByRole('button', { name: 'Save & Connect' });
    });
    userEvent.click(screen.getByRole('button', { name: 'Save & Connect' }));
    return result;
  }

  afterEach(cleanup);

  it('should render CompassWeb and connect using provided connection string', async function () {
    await renderCompassWebAndConnect();

    await waitFor(() => {
      screen.getByText('Connecting to localhost:27017');
    });

    expect(mockConnectFn.getCall(0).args[0].connectionOptions).to.have.property(
      'connectionString',
      'mongodb://localhost:27017/?appName=Compass+Web'
    );

    await waitFor(() => {
      screen.getByText('Connected to localhost:27017');
    });

    expect(onTrackSpy).to.have.been.calledWith('New Connection');
  });

  it('should render error state if connection fails', async function () {
    await renderCompassWebAndConnect({}, (() => {
      return Promise.reject(new Error('Failed to connect'));
    }) as any);

    await waitFor(() => {
      screen.getByText('There was a problem connecting to localhost:27017');
    });

    expect(onTrackSpy).to.have.been.calledWith('Connection Failed');
  });
});
