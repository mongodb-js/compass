import { expect } from 'chai';
import { useAllSavedConnections } from './use-all-saved-connections';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { createElement } from 'react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
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

describe('useAllSavedConnections', function () {
  let renderHookWithContext: typeof renderHook;
  let connectionStorage: ConnectionStorage;

  beforeEach(function () {
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
        createElement(ConnectionStorageContext.Provider, {
          value: connectionStorage,
          children: [
            createElement(ConnectionRepositoryContextProvider, {
              children,
            }),
          ],
        });
      return renderHook(callback, { wrapper, ...options });
    };
  });

  describe('list of connections', function () {
    it('should return all favorite connections from storage', async function () {
      const { result } = renderHookWithContext(() => useAllSavedConnections());
      await waitFor(() => {
        const { favorites, nonFavorites } = result.current;
        expect(favorites.length).to.equal(1);
        expect(favorites[0].id).to.equal('favorite');
        expect(nonFavorites.length).to.equal(1);
        expect(nonFavorites[0].id).to.equal('nonfavorite');
      });
    });

    describe('when an storage event happens', function () {
      it('should rerender the new list of connections', async function () {
        const { result } = renderHookWithContext(() =>
          useAllSavedConnections()
        );

        const connectionStorageInspectable = connectionStorage as any;
        connectionStorageInspectable.loadAll = function () {
          return Promise.resolve([NONFAVORITE_CONNECTION_INFO]);
        };

        connectionStorageInspectable.events.emit(
          ConnectionStorageEvents.ConnectionsChanged
        );

        await waitFor(() => {
          const { favorites, nonFavorites } = result.current;
          expect(favorites.length).to.equal(0);
          expect(nonFavorites.length).to.equal(1);
          expect(nonFavorites[0].id).to.equal('nonfavorite');
        });
      });
    });
  });
});
