import React from 'react';
import { expect } from 'chai';
import { stub, spy, type SinonStub } from 'sinon';
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MultipleConnectionSidebar from './sidebar';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ToastArea } from '@mongodb-js/compass-components';
import {
  InMemoryConnectionStorage,
  ConnectionStorageProvider,
} from '@mongodb-js/connection-storage/provider';
import type { DataService } from 'mongodb-data-service';
import {
  ConnectionsManagerProvider,
  ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import { createSidebarStore } from '../../stores';
import { Provider } from 'react-redux';
import AppRegistry from 'hadron-app-registry';
import {
  type PreferencesAccess,
  createSandboxFromDefaultPreferences,
} from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import {
  type WorkspacesService,
  WorkspacesServiceProvider,
} from '@mongodb-js/compass-workspaces/provider';
import { WorkspacesProvider } from '@mongodb-js/compass-workspaces';

type PromiseFunction = (
  resolve: (dataService: DataService) => void,
  reject: (error: { message: string }) => void
) => void;

function slowConnection(response: PromiseFunction): Promise<DataService> {
  return new Promise<DataService>((resolve, reject) => {
    setTimeout(() => response(resolve, reject), 20);
  });
}

function andFail(message: string): PromiseFunction {
  return (resolve, reject) => reject({ message });
}

function andSucceed(): PromiseFunction {
  return (resolve) => resolve({} as DataService);
}

const savedConnection: ConnectionInfo = {
  id: '12345',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    name: 'localhost',
    color: 'color2',
  },
  savedConnectionType: 'favorite',
};

describe('Multiple Connections Sidebar Component', function () {
  let preferences: PreferencesAccess;

  const connectionStorage = new InMemoryConnectionStorage([savedConnection]);
  const globalAppRegistry = new AppRegistry();
  const emitSpy = spy(globalAppRegistry, 'emit');
  let store: ReturnType<typeof createSidebarStore>['store'];
  let deactivate: () => void;
  let openMyQueriesWorkspaceStub: SinonStub;

  const connectFn = stub();

  function doRender() {
    const connectionManager = new ConnectionsManager({
      logger: { debug: stub() } as any,
      __TEST_CONNECT_FN: connectFn,
    });
    ({ store, deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        instancesManager: {
          listMongoDBInstances() {
            return [];
          },
        },
        logger: { log: { warn() {} }, mongoLogId() {} },
      } as any,
      { on() {}, cleanup() {}, addCleanup() {} } as any
    ));
    openMyQueriesWorkspaceStub = stub();

    return render(
      <ToastArea>
        <PreferencesProvider value={preferences}>
          <WorkspacesServiceProvider
            value={
              {
                openMyQueriesWorkspace: openMyQueriesWorkspaceStub,
              } as unknown as WorkspacesService
            }
          >
            <WorkspacesProvider
              value={[{ name: 'My Queries', component: () => null }]}
            >
              <ConnectionStorageProvider value={connectionStorage}>
                <ConnectionsManagerProvider value={connectionManager}>
                  <Provider store={store}>
                    <MultipleConnectionSidebar
                      activeWorkspace={{ type: 'connection' }}
                    />
                  </Provider>
                </ConnectionsManagerProvider>
              </ConnectionStorageProvider>
            </WorkspacesProvider>
          </WorkspacesServiceProvider>
        </PreferencesProvider>
      </ToastArea>
    );
  }

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableNewMultipleConnectionSystem: true,
    });

    doRender();
  });

  afterEach(function () {
    deactivate();
    cleanup();
    emitSpy.resetHistory();
    openMyQueriesWorkspaceStub.resetHistory();
  });

  describe('opening a new connection', function () {
    let parentSavedConnection: HTMLElement;

    describe('when successfully connected', function () {
      it('calls the connection function and renders the progress toast', async function () {
        connectFn.returns(slowConnection(andSucceed()));
        parentSavedConnection = screen.getByTestId('saved-connection-12345');

        userEvent.hover(parentSavedConnection);

        const connectButton = within(parentSavedConnection).getByLabelText(
          'Connect'
        );

        userEvent.click(connectButton);
        const connectingToast = screen.getByText('Connecting to localhost');
        expect(connectingToast).to.exist;
        expect(connectFn).to.have.been.called;

        await waitFor(() => {
          expect(screen.queryByText('Connecting to localhost')).to.not.exist;
        });
      });
    });

    describe('when failing to connect', function () {
      it('calls the connection function and renders the error toast', async function () {
        connectFn.returns(slowConnection(andFail('Expected failure')));
        parentSavedConnection = screen.getByTestId('saved-connection-12345');

        userEvent.hover(parentSavedConnection);

        const connectButton = within(parentSavedConnection).getByLabelText(
          'Connect'
        );

        userEvent.click(connectButton);
        const connectingToast = screen.getByText('Connecting to localhost');
        expect(connectingToast).to.exist;
        expect(connectFn).to.have.been.called;

        await waitFor(() => {
          expect(screen.queryByText('Expected failure')).to.exist;
        });
      });
    });
  });

  describe('actions', () => {
    it('when clicking on the Settings btn, it emits open-compass-settings', () => {
      const settingsBtn = screen.getByTitle('Compass Settings');
      expect(settingsBtn).to.be.visible;

      userEvent.click(settingsBtn);

      expect(emitSpy).to.have.been.calledWith('open-compass-settings');
    });

    it('when clicking on "My Queries", it opens the workspace', () => {
      const navItem = screen.getByText('My Queries');
      expect(navItem).to.be.visible;

      userEvent.click(navItem);

      expect(openMyQueriesWorkspaceStub).to.have.been.called;
    });
  });
});
