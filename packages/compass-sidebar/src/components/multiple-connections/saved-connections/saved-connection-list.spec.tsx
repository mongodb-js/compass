import React from 'react';
import { expect } from 'chai';
import { spy, stub } from 'sinon';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavedConnectionList } from './saved-connection-list';
import {
  InMemoryConnectionStorage,
  ConnectionStorageProvider,
  type ConnectionInfo,
} from '@mongodb-js/connection-storage/provider';

import {
  ConnectionsManagerProvider,
  ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';

const FAVOURITE_CONNECTION_INFO: ConnectionInfo = {
  id: '1',
  connectionOptions: {
    connectionString: 'mongodb://localhost.webscale:27017',
  },
  favorite: {
    name: 'My Favorite',
    color: 'color2',
  },
  savedConnectionType: 'favorite',
};

const NON_FAVOURITE_CONNECTION_INFO: ConnectionInfo = {
  id: '2',
  connectionOptions: {
    connectionString: 'mongodb://localhost.webscalent:27017',
  },
  favorite: {
    name: 'My Non Favorite',
    color: 'color5',
  },
  savedConnectionType: 'recent',
};

describe('SavedConnectionList Component', function () {
  const onConnectSpy = spy();
  const onNewConnectionSpy = spy();
  const onDeleteConnectionSpy = spy();
  const onEditConnectionSpy = spy();
  const onDuplicateConnectionSpy = spy();
  const onToggleFavoriteConnectionSpy = spy();

  const connectFn = stub();

  function doRender(
    favoriteInfo: ConnectionInfo[],
    nonFavoriteInfo: ConnectionInfo[]
  ) {
    const connectionStorage = new InMemoryConnectionStorage([
      FAVOURITE_CONNECTION_INFO,
      NON_FAVOURITE_CONNECTION_INFO,
    ]);

    const connectionManager = new ConnectionsManager({
      logger: {} as any,
      __TEST_CONNECT_FN: connectFn,
    });

    return render(
      <ConnectionStorageProvider value={connectionStorage}>
        <ConnectionsManagerProvider value={connectionManager}>
          <SavedConnectionList
            favoriteConnections={favoriteInfo}
            nonFavoriteConnections={nonFavoriteInfo}
            onNewConnection={onNewConnectionSpy}
            onConnect={onConnectSpy}
            onEditConnection={onEditConnectionSpy}
            onDeleteConnection={onDeleteConnectionSpy}
            onDuplicateConnection={onDuplicateConnectionSpy}
            onToggleFavoriteConnection={onToggleFavoriteConnectionSpy}
          />
        </ConnectionsManagerProvider>
      </ConnectionStorageProvider>
    );
  }

  describe('When saved connections exist', function () {
    beforeEach(function () {
      doRender([FAVOURITE_CONNECTION_INFO], [NON_FAVOURITE_CONNECTION_INFO]);
    });

    afterEach(function () {
      cleanup();
    });

    it('should render all connections', function () {
      [FAVOURITE_CONNECTION_INFO, NON_FAVOURITE_CONNECTION_INFO].every(
        (connection) => {
          expect(screen.queryByText(connection.favorite?.name || '<>')).to
            .exist;
        }
      );
    });

    it('should allow to create new connections', async function () {
      const newConnectionButton = screen.getByTestId('new-connection-button');
      userEvent.click(newConnectionButton);

      await waitFor(() => {
        expect(onNewConnectionSpy).to.have.been.called;
      });
    });

    it('should show the number of connections', function () {
      expect(screen.queryByText('(2)')).to.exist;
    });

    it('should not show the empty connections message', function () {
      expect(screen.queryByText('You have not connected to any deployments.'))
        .to.be.null;
    });
  });

  describe('When there are no saved connections', function () {
    beforeEach(function () {
      doRender([], []);
    });

    afterEach(function () {
      cleanup();
    });

    it('should show the empty connections message', function () {
      expect(screen.queryByText('You have not connected to any deployments.'))
        .to.be.visible;
    });
  });
});
