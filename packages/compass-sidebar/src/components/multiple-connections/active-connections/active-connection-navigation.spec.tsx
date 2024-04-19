import React from 'react';
import { expect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import ActiveConnectionNavigation from './active-connection-navigation';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
  TEST_CONNECTION_INFO,
} from '@mongodb-js/compass-connections/provider';
import { createSidebarStore } from '../../../stores';
import { Provider } from 'react-redux';
import AppRegistry from 'hadron-app-registry';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import userEvent from '@testing-library/user-event';
import sinon from 'sinon';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

const mockConnections: ConnectionInfo[] = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: 'mongodb://turtle',
    },
    savedConnectionType: 'recent',
  },
  {
    id: 'oranges',
    connectionOptions: {
      connectionString: 'mongodb://peaches',
    },
    favorite: {
      name: 'peaches',
    },
    savedConnectionType: 'favorite',
  },
];

describe('<ActiveConnectionNavigation />', function () {
  let connectionsManager: ConnectionsManager;
  let store: ReturnType<typeof createSidebarStore>['store'];
  let deactivate: () => void;
  const globalAppRegistry = new AppRegistry();
  const onOpenConnectionInfoStub = sinon.stub();
  const onCopyConnectionStringStub = sinon.stub();
  const onToggleFavoriteConnectionStub = sinon.stub();

  beforeEach(async () => {
    connectionsManager = new ConnectionsManager({} as any);
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    (connectionsManager as any).connectionStatuses.set('oranges', 'connected');
    ({ store, deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        instancesManager: {
          listMongoDBInstances() {
            return new Map();
          },
        } as any,
        connectionsManager,
        logger: createNoopLoggerAndTelemetry(),
        initialConnectionInfo: TEST_CONNECTION_INFO,
      },
      { on() {}, cleanup() {}, addCleanup() {} } as any
    ));

    const preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableRenameCollectionModal: true,
      enableNewMultipleConnectionSystem: true,
    });

    render(
      <PreferencesProvider value={preferences}>
        <ConnectionsManagerProvider value={connectionsManager}>
          <Provider store={store}>
            <ActiveConnectionNavigation
              activeConnections={mockConnections}
              activeWorkspace={{ id: 'turtle', type: 'Databases' }}
              onOpenConnectionInfo={onOpenConnectionInfoStub}
              onCopyConnectionString={onCopyConnectionStringStub}
              onToggleFavoriteConnection={onToggleFavoriteConnectionStub}
            />
          </Provider>
        </ConnectionsManagerProvider>
      </PreferencesProvider>
    );
  });

  afterEach(() => {
    deactivate();
    sinon.resetHistory();
  });

  it('Should render the number of connections', async function () {
    await waitFor(() => {
      expect(screen.queryByText('(2)')).to.be.visible;
    });
  });

  describe('Connection actions', () => {
    it('Calls onOpenConnectionInfo', async () => {
      userEvent.hover(screen.getByText('turtle'));

      const connectionActionsBtn = screen.getAllByTitle('Show actions')[0]; // TODO: This will be a single element once we fix the workspaces
      expect(connectionActionsBtn).to.be.visible;

      userEvent.click(connectionActionsBtn);

      const openConnectionInfoBtn = await screen.findByText(
        'Show connection info'
      );
      expect(openConnectionInfoBtn).to.be.visible;

      userEvent.click(openConnectionInfoBtn);

      expect(onOpenConnectionInfoStub).to.have.been.calledWith('turtle');
    });

    it('Calls onCopyConnectionString', async () => {
      userEvent.hover(screen.getByText('turtle'));

      const connectionActionsBtn = screen.getAllByTitle('Show actions')[0]; // TODO: This will be a single element once we fix the workspaces
      expect(connectionActionsBtn).to.be.visible;

      userEvent.click(connectionActionsBtn);

      const copyConnectionStringBtn = await screen.findByText(
        'Copy connection string'
      );
      expect(copyConnectionStringBtn).to.be.visible;

      userEvent.click(copyConnectionStringBtn);

      expect(onCopyConnectionStringStub).to.have.been.calledWith('turtle');
    });

    it('Calls onToggleFavoriteConnection', async () => {
      userEvent.hover(screen.getByText('turtle'));

      const connectionActionsBtn = screen.getAllByTitle('Show actions')[0]; // TODO: This will be a single element once we fix the workspaces
      expect(connectionActionsBtn).to.be.visible;

      userEvent.click(connectionActionsBtn);

      const favoriteBtn = await screen.findByText('Favorite');
      expect(favoriteBtn).to.be.visible;

      userEvent.click(favoriteBtn);

      expect(onToggleFavoriteConnectionStub).to.have.been.calledWith('turtle');
    });
  });
});
