import React, { type ComponentProps } from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import { AppRegistryProvider } from 'hadron-app-registry';
import * as hadronIpc from 'hadron-ipc';
import sinon from 'sinon';
import Home from './home';
import type { DataService } from 'mongodb-data-service';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { WithAtlasProviders, WithStorageProviders } from './entrypoint';
import EventEmitter from 'events';

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
  static events = new EventEmitter();
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

const HOME_PROPS = {
  appName: 'home-testing',
  createFileInputBackend: (() => {}) as any,
  hideCollectionSubMenu: () => {},
  onDisconnect: () => {},
  showCollectionSubMenu: () => {},
  showSettings: () => {},
  getAutoConnectInfo: () => Promise.resolve(undefined),
  showWelcomeModal: false,
} as const;

describe('Home [Component]', function () {
  const testAppRegistry = new AppRegistry();
  function renderHome(
    props: Partial<ComponentProps<typeof Home>> = {},
    dataService = createDataService()
  ) {
    render(
      <PreferencesProvider
        value={
          {
            getPreferences() {
              // with networkTraffic=true, we show the link to open settings modal from the welcome modal
              return { showedNetworkOptIn: true, networkTraffic: true };
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
                {...HOME_PROPS}
                // TODO(COMPASS-7397): compass-connection is not a real plugin and so
                // we have to pass mocked services all the way through
                __TEST_MONGODB_DATA_SERVICE_CONNECT_FN={() => {
                  return Promise.resolve(dataService);
                }}
                __TEST_CONNECTION_STORAGE={MockConnectionStorage as any}
                {...props}
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
    it('renders the connect screen', function () {
      renderHome();
      expect(screen.getByTestId('connections')).to.be.visible;
    });

    it('renders welcome modal and hides it', async function () {
      renderHome({ showWelcomeModal: true });
      const modal = screen.getByTestId('welcome-modal');
      expect(modal).to.be.visible;
      within(modal).getByRole('button', { name: 'Start' }).click();
      await waitFor(() => {
        expect(screen.queryByTestId('welcome-modal')).to.not.exist;
      });
    });

    it('calls openSettings when user clicks on settings', async function () {
      const showSettingsSpy = sinon.spy();
      renderHome({ showSettings: showSettingsSpy, showWelcomeModal: true });

      const modal = screen.getByTestId('welcome-modal');
      within(modal).getByTestId('open-settings-link').click();
      await waitFor(() => {
        expect(screen.queryByTestId('welcome-modal')).to.not.exist;
      });
      expect(showSettingsSpy.callCount).to.equal(1);
    });
  });

  describe('is connected', function () {
    describe('when UI status is complete', function () {
      let dataServiceDisconnectedSpy: sinon.SinonSpy;

      let onDisconnectSpy: sinon.SinonSpy;
      let hideCollectionSubMenuSpy: sinon.SinonSpy;

      beforeEach(async function () {
        dataServiceDisconnectedSpy = sinon.fake.resolves(true);
        hideCollectionSubMenuSpy = sinon.spy();
        onDisconnectSpy = sinon.spy();
        const dataService = {
          ...createDataService(),
          disconnect: dataServiceDisconnectedSpy,
          addReauthenticationHandler: sinon.stub(),
        };
        renderHome(
          {
            hideCollectionSubMenu: hideCollectionSubMenuSpy,
            onDisconnect: onDisconnectSpy,
          },
          dataService
        );
        screen.logTestingPlaygroundURL();
        await waitForConnect();
      });

      afterEach(function () {
        sinon.restore();
      });

      it('on `app:disconnect`', async function () {
        hadronIpc.ipcRenderer?.emit('app:disconnect');

        expect(onDisconnectSpy.called, 'it calls onDisconnect').to.be.true;
        expect(
          hideCollectionSubMenuSpy.called,
          'it calls hideCollectionSubMenu'
        ).to.be.true;

        await waitFor(() => {
          expect(screen.queryByTestId('connections-wrapper')).to.be.visible;
        });
        expect(dataServiceDisconnectedSpy.callCount).to.equal(1);
      });
    });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      render(<Home {...HOME_PROPS} />);
    });
  });
});
