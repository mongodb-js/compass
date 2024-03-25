import { expect } from 'chai';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { createElement } from 'react';
import {
  type ConnectionInfo,
  type ConnectionStatus,
} from '@mongodb-js/connection-info';
import {
  type PreferencesAccess,
  createSandboxFromDefaultPreferences,
} from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import {
  ConnectionsManager,
  ConnectionsManagerEvents,
  ConnectionsManagerProvider,
} from '../provider';
import {
  ConnectionRepository,
  ConnectionRepositoryContextProvider,
  ConnectionStorage,
  ConnectionStorageContext,
} from '@mongodb-js/connection-storage/provider';
import {
  ConnectionStorageBus,
  ConnectionStorageEvents,
} from '@mongodb-js/connection-storage/renderer';
import { useCanOpenNewConnections } from './use-can-open-new-connections';

const FAVORITE_CONNECTION_INFO: ConnectionInfo = {
  id: 'favorite',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  savedConnectionType: 'favorite',
};

const NONFAVORITE_CONNECTION_INFO: ConnectionInfo = {
  id: 'nonfavorite',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  savedConnectionType: 'recent',
};

describe.only('useCanOpenNewConnections', function () {
  let renderHookWithContext: typeof renderHook;
  let connectionStorage: ConnectionStorage;
  let connectionManager: ConnectionsManager;
  let preferencesAccess: PreferencesAccess;

  function withConnectionWithStatus(
    connectionId: ConnectionInfo['id'],
    status: ConnectionStatus
  ) {
    const connectionManagerInspectable = connectionManager as any;
    connectionManagerInspectable.connectionStatuses.set(connectionId, status);
  }

  async function withConnectionLimit(limit: number) {
    await preferencesAccess.savePreferences({
      userCanHaveMaximumNumberOfActiveConnections: limit,
    });
  }
  beforeEach(async function () {
    preferencesAccess = await createSandboxFromDefaultPreferences();
    connectionManager = new ConnectionsManager({} as any);
    connectionStorage = {
      loadAll() {
        return Promise.resolve([
          FAVORITE_CONNECTION_INFO,
          NONFAVORITE_CONNECTION_INFO,
        ]);
      },
      events: new ConnectionStorageBus(),
    } as ConnectionStorage;

    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(PreferencesProvider, {
          value: preferencesAccess,
          children: [
            createElement(ConnectionStorageContext.Provider, {
              value: connectionStorage,
              children: [
                createElement(ConnectionRepositoryContextProvider, {
                  children: [
                    createElement(ConnectionsManagerProvider, {
                      value: connectionManager,
                      children,
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      return renderHook(callback, { wrapper, ...options });
    };
  });

  describe('number of active connections', function () {
    it('should return the count of active connections', async function () {
      withConnectionWithStatus(FAVORITE_CONNECTION_INFO.id, 'connected');

      const { result } = renderHookWithContext(() =>
        useCanOpenNewConnections()
      );

      await waitFor(() => {
        const { numberOfConnectionsOpen } = result.current;
        expect(numberOfConnectionsOpen).to.equal(1);
      });
    });
  });

  describe('connection limiting', function () {
    it('should not limit when the maximum number of connections is not reached', async function () {
      await withConnectionLimit(1);

      const { result } = renderHookWithContext(() =>
        useCanOpenNewConnections()
      );

      await waitFor(() => {
        const { numberOfConnectionsOpen, canOpenNewConnection } =
          result.current;
        expect(numberOfConnectionsOpen).to.equal(0);
        expect(canOpenNewConnection).to.equal(true);
      });
    });

    it('should limit when the maximum number of connections is reached', async function () {
      withConnectionWithStatus(FAVORITE_CONNECTION_INFO.id, 'connected');
      await withConnectionLimit(1);

      const { result } = renderHookWithContext(() =>
        useCanOpenNewConnections()
      );

      await waitFor(() => {
        const {
          numberOfConnectionsOpen,
          canOpenNewConnection,
          canNotOpenReason,
        } = result.current;
        expect(numberOfConnectionsOpen).to.equal(1);
        expect(canOpenNewConnection).to.equal(false);
        expect(canNotOpenReason).to.equal('maximum-number-exceeded');
      });
    });
  });
});
