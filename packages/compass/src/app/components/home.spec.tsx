import React, { type ComponentProps } from 'react';
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
  userEvent,
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
      async function () {
        console.log('??');
        const sidebar = screen.getByTestId('navigation-sidebar');
        console.log('GOT SIDEBAR');
        const connectionItem = await within(sidebar).findByText(
          'localhost:27017'
        );
        console.log('ITEM', connectionItem.getAttribute('data-is-connected'));
        expect(connectionItem).to.have.attribute('data-is-connected', 'true');
      },
      { timeout: 1_000_000 }
    );
  }

  afterEach(() => {
    cleanup();
    sinon.restore();
  });

  describe('is not connected', function () {
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
});
