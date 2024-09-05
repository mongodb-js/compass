import React, { type ComponentProps } from 'react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import * as hadronIpc from 'hadron-ipc';
import sinon from 'sinon';
import { ThemedHome } from './home';
import type { DataService } from 'mongodb-data-service';
import { WithAtlasProviders } from './entrypoint';
import {
  renderWithConnections,
  cleanup,
  screen,
  waitFor,
  within,
} from '@mongodb-js/testing-library-compass';
import type { AllPreferences } from 'compass-preferences-model/provider';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

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
} as const;

describe('Home [Component]', function () {
  function renderHome(
    props: Partial<ComponentProps<typeof ThemedHome>> = {},
    connections: ConnectionInfo[] = [],
    dataService = createDataService(),
    preferences: Partial<AllPreferences> = {}
  ) {
    const result = renderWithConnections(
      <WithAtlasProviders>
        <ThemedHome {...HOME_PROPS} {...props} />
      </WithAtlasProviders>,
      {
        preferences: {
          showedNetworkOptIn: true,
          networkTraffic: true,
          enableMultipleConnectionSystem: false,
          ...preferences,
        },
        connectFn: () => {
          return dataService;
        },
        connections,
      }
    );
    return result;
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
      renderHome({
        showSettings: showSettingsSpy,
        showWelcomeModal: true,
      });

      const modal = screen.getByTestId('welcome-modal');
      within(modal).getByTestId('open-settings-link').click();
      await waitFor(() => {
        expect(screen.queryByTestId('welcome-modal')).to.not.exist;
      });
      expect(showSettingsSpy.callCount).to.equal(1);
    });

    describe('and multi connections is enabled', function () {
      it('renders only the workspaces', function () {
        renderHome({}, [], createDataService(), {
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
          [],
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
});
