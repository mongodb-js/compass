import React from 'react';
import {
  screen,
  render,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import type { ConnectionOptions } from 'mongodb-data-service';
import { expect } from 'chai';
import { CompassWeb } from './entrypoint';
import Sinon from 'sinon';
import { ConnectFnProvider } from '@mongodb-js/compass-connections';
import { MockDataService as TestHelpersMockDataService } from '@mongodb-js/testing-library-compass';
import { sandboxConnectionStorage } from './connection-storage';
import { SandboxConnectionStorage } from '../sandbox/sandbox-connection-storage';
import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';
import {
  DEFAULT_COMPASS_WEB_PREFERENCES,
  setCompassWebPreferencesAccess,
} from './preferences';

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

sandboxConnectionStorage.current = new SandboxConnectionStorage();

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

  beforeEach(function () {
    // Compass-web fetches its preferences from the cloud API on mount; pre-seed
    // them so rendering doesn't depend on a network request.
    setCompassWebPreferencesAccess(
      new CompassWebPreferencesAccess({
        ...DEFAULT_COMPASS_WEB_PREFERENCES,
        enableCreatingNewConnections: true,
      })
    );
  });

  afterEach(function () {
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
          onTrack={onTrackSpy}
          {...props}
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

  describe('preferences loading', function () {
    const projectIdA = 'pineapple';
    const projectIdB = 'watermelon';

    const preferencesApiResponse = {
      // Disabled in the compass-web defaults; enabling it through the cloud
      // response is what makes the "Add new connection" button show up.
      featureFlags: { enableCreatingNewConnections: true },
      userAuid: 'test-user-auid',
      appUser: { isOptedIntoDataExplorerGenAIFeatures: false },
      currentOrganization: { genAIFeaturesEnabled: false },
    };

    let fetchStub: Sinon.SinonStub;

    beforeEach(function () {
      fetchStub = Sinon.stub(globalThis, 'fetch').callsFake((input) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
            ? input.href
            : input.url;
        const isPreferencesRequest = url.includes('/preferences');
        return Promise.resolve({
          ok: isPreferencesRequest,
          status: isPreferencesRequest ? 200 : 404,
          statusText: isPreferencesRequest ? 'OK' : 'Not Found',
          json: () =>
            Promise.resolve(isPreferencesRequest ? preferencesApiResponse : {}),
        } as unknown as Response);
      });
    });

    afterEach(function () {
      fetchStub.restore();
    });

    function preferencesFetchCalls() {
      return fetchStub
        .getCalls()
        .filter((call) => String(call.args[0]).includes('/preferences'));
    }

    function renderCompassWebForProject(projectId: string) {
      return render(
        <CompassWeb
          orgId=""
          projectId={projectId}
          onTrack={onTrackSpy}
        ></CompassWeb>
      );
    }

    it('fetches preferences from the cloud API once per project and caches them across mounts', async function () {
      const first = renderCompassWebForProject(projectIdA);
      expect(screen.getByTestId('compass-web-preferences-loader')).to.exist;
      await waitFor(() => {
        screen.getAllByRole('button', { name: 'Add new connection' });
      });
      expect(preferencesFetchCalls()).to.have.lengthOf(1);
      expect(preferencesFetchCalls()[0].args[0]).to.equal(
        `/explorer/v1/groups/${projectIdA}/preferences`
      );
      first.unmount();

      const second = renderCompassWebForProject(projectIdA);
      expect(screen.queryByTestId('compass-web-preferences-loader')).to.not
        .exist;
      screen.getAllByRole('button', { name: 'Add new connection' });
      expect(preferencesFetchCalls()).to.have.lengthOf(1);
      second.unmount();

      // Rendering a a different project triggers a new fetch.
      renderCompassWebForProject(projectIdB);
      expect(screen.getByTestId('compass-web-preferences-loader')).to.exist;
      await waitFor(() => {
        screen.getAllByRole('button', { name: 'Add new connection' });
      });
      expect(preferencesFetchCalls()).to.have.lengthOf(2);
      expect(preferencesFetchCalls()[1].args[0]).to.equal(
        `/explorer/v1/groups/${projectIdB}/preferences`
      );
    });
  });
});
