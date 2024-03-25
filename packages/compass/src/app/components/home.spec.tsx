import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import { AppRegistryProvider } from 'hadron-app-registry';
import * as hadronIpc from 'hadron-ipc';
import sinon from 'sinon';
import Home from './home';
import type { DataService } from 'mongodb-data-service';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { WithAtlasProviders, WithStorageProviders } from './compass';

const createDataService = () =>
  ({
    getConnectionString() {
      return { hosts: ['localhost:27020'] };
    },
    getConnectionOptions() {
      return {};
    },
    getMongoClientConnectionOptions() {
      return {};
    },
    getLastSeenTopology() {
      return {
        type: 'Unknown',
        servers: ['localhost:27020'],
        setName: 'foo',
      };
    },
    configuredKMSProviders() {
      return [];
    },
    currentOp() {},
    top() {},
    on() {},
    off() {},
    removeListener() {},
  } as unknown as DataService);

class MockConnectionStorage {
  static importConnections() {}
  static exportConnections() {
    return Promise.resolve('[]');
  }
  static deserializeConnections() {
    return Promise.resolve([]);
  }
  static getLegacyConnections() {
    return Promise.resolve([]);
  }
}

describe('Home [Component]', function () {
  const testAppRegistry = new AppRegistry();
  function renderHome(dataService = createDataService()) {
    render(
      <PreferencesProvider
        value={
          {
            getPreferences() {
              return { showedNetworkOptIn: true };
            },
            onPreferenceValueChanged() {
              return () => {};
            },
          } as any
        }
      >
        <AppRegistryProvider localAppRegistry={testAppRegistry}>
          <WithAtlasProviders>
            <WithStorageProviders>
              <Home
                appName="home-testing"
                // TODO(COMPASS-7397): compass-connection is not a real plugin and so
                // we have to pass mocked services all the way through
                __TEST_MONGODB_DATA_SERVICE_CONNECT_FN={() => {
                  return Promise.resolve(dataService);
                }}
                __TEST_CONNECTION_STORAGE={MockConnectionStorage as any}
              />
            </WithStorageProviders>
          </WithAtlasProviders>
        </AppRegistryProvider>
      </PreferencesProvider>
    );
  }

  async function waitForConnect() {
    userEvent.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(
      () => {
        screen.getByTestId('home');
      },
      { timeout: 1_000_000 }
    );
  }

  afterEach(cleanup);

  describe('is not connected', function () {
    beforeEach(function () {
      renderHome();
    });

    it('renders the connect screen', function () {
      expect(screen.getByTestId('connections')).to.be.visible;
    });
  });

  describe('is connected', function () {
    describe('when UI status is complete', function () {
      let dataServiceDisconnectedSpy: sinon.SinonSpy;

      beforeEach(async function () {
        dataServiceDisconnectedSpy = sinon.fake.resolves(true);
        const dataService = {
          ...createDataService(),
          disconnect: dataServiceDisconnectedSpy,
          addReauthenticationHandler: sinon.stub(),
        };
        renderHome(dataService);
        await waitForConnect();
      });

      afterEach(function () {
        sinon.restore();
      });

      describe('on `app:disconnect`', function () {
        beforeEach(function () {
          hadronIpc.ipcRenderer?.emit('app:disconnect');
        });

        it('renders the new connect form', async function () {
          await waitFor(() => {
            expect(screen.queryByTestId('connections-wrapper')).to.be.visible;
          });
        });

        it('calls to disconnect the data service', function () {
          expect(dataServiceDisconnectedSpy.callCount).to.equal(1);
        });
      });
    });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      render(<Home appName="home-testing" />);
    });
  });
});
