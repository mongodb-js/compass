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
import {
  PreferencesProvider,
  type AllPreferences,
} from 'compass-preferences-model/provider';
import { WithAtlasProviders, WithStorageProviders } from './entrypoint';
import { TEST_CONNECTION_INFO } from '@mongodb-js/compass-connections/provider';
import { InMemoryConnectionStorage } from '@mongodb-js/connection-storage/provider';

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

const HOME_PROPS = {
  appName: 'home-testing',
  createFileInputBackend: (() => {}) as any,
  hideCollectionSubMenu: () => {},
  onDisconnect: () => {},
  showCollectionSubMenu: () => {},
  showSettings: () => {},
  getAutoConnectInfo: () => Promise.resolve(undefined),
  showWelcomeModal: false,
  connectionStorage: new InMemoryConnectionStorage([TEST_CONNECTION_INFO]),
} as const;

describe('Home [Component]', function () {
  const testAppRegistry = new AppRegistry();
  function renderHome(
    props: Partial<ComponentProps<typeof Home>> = {},
    dataService = createDataService(),
    preferences: Partial<AllPreferences> = {}
  ) {
    render(
      <PreferencesProvider
        value={
          {
            getPreferences() {
              // with networkTraffic=true, we show the link to open settings modal from the welcome modal
              return {
                showedNetworkOptIn: true,
                networkTraffic: true,
                enableMultipleConnectionSystem: false,
                ...preferences,
              };
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

  afterEach(() => {
    cleanup();
    sinon.restore();
  });

  describe('is not connected', function () {
    it('renders the connect screen', function () {
      renderHome();
      expect(() => screen.getByTestId('home')).to.throw;
      expect(screen.getByTestId('connections-wrapper')).to.be.displayed;
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

    describe('and multi connections is enabled', function () {
      it('renders only the workspaces', function () {
        renderHome({}, createDataService(), {
          enableMultipleConnectionSystem: true,
        });
        expect(screen.getByTestId('home')).to.be.displayed;
        expect(() => screen.getByTestId('connections-wrapper')).to.throw;
      });
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
        await waitForConnect();
      });

      afterEach(function () {
        sinon.restore();
      });

      it('renders only the workspaces', function () {
        expect(screen.getByTestId('home')).to.be.displayed;
        expect(() => screen.getByTestId('connections-wrapper')).to.throw;
      });

      it('on `app:disconnect`', async function () {
        hadronIpc.ipcRenderer?.emit('app:disconnect');
        await waitFor(() => {
          expect(onDisconnectSpy.called, 'it calls onDisconnect').to.be.true;
          expect(
            hideCollectionSubMenuSpy.called,
            'it calls hideCollectionSubMenu'
          ).to.be.true;
        });

        await waitFor(() => {
          expect(screen.queryByTestId('connections-wrapper')).to.be.visible;
        });
        expect(dataServiceDisconnectedSpy.callCount).to.equal(1);
      });
    });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      renderHome();
    });

    context('when user has any legacy connection', function () {
      it('shows modal', async function () {
        sinon
          .stub(HOME_PROPS.connectionStorage, 'getLegacyConnections')
          .resolves([{ name: 'Connection1' }]);

        renderHome();

        await waitFor(
          () => expect(screen.getByTestId('legacy-connections-modal')).to.exist
        );

        const modal = screen.getByTestId('legacy-connections-modal');
        expect(within(modal).getByText('Connection1')).to.exist;
      });

      it('does not show modal when user hides it', async function () {
        sinon
          .stub(HOME_PROPS.connectionStorage, 'getLegacyConnections')
          .resolves([{ name: 'Connection2' }]);

        renderHome();

        await waitFor(() => screen.getByTestId('legacy-connections-modal'));

        const modal = screen.getByTestId('legacy-connections-modal');

        const storageSpy = sinon.spy(Storage.prototype, 'setItem');

        // Click the don't show again checkbox and close the modal
        userEvent.click(within(modal).getByText(/don't show this again/i));
        userEvent.click(within(modal).getByText(/close/i));

        // Saves data in storage
        expect(storageSpy.firstCall.args).to.deep.equal([
          'hide_legacy_connections_modal',
          'true',
        ]);

        expect(() => {
          screen.getByTestId('legacy-connections-modal');
        }).to.throw;
      });
    });
  });
});
