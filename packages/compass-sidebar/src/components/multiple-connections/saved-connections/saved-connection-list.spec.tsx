import React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavedConnectionList } from './saved-connection-list';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

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
  const onConnect = spy();
  const onNewConnection = spy();
  const onDeleteConnection = spy();
  const onEditConnection = spy();
  const onDuplicateConnection = spy();
  const onToggleFavoriteConnection = spy();

  function doRender(
    favoriteInfo: ConnectionInfo[],
    nonFavoriteInfo: ConnectionInfo[]
  ) {
    return render(
      <SavedConnectionList
        favoriteConnections={favoriteInfo}
        nonFavoriteConnections={nonFavoriteInfo}
        onNewConnection={onNewConnection}
        onConnect={onConnect}
        onEditConnection={onEditConnection}
        onDeleteConnection={onDeleteConnection}
        onDuplicateConnection={onDuplicateConnection}
        onToggleFavoriteConnection={onToggleFavoriteConnection}
      />
    );
  }

  beforeEach(function () {
    doRender([FAVOURITE_CONNECTION_INFO], [NON_FAVOURITE_CONNECTION_INFO]);
  });

  afterEach(function () {
    cleanup();
  });

  it('should render all connections', function () {
    [FAVOURITE_CONNECTION_INFO, NON_FAVOURITE_CONNECTION_INFO].every(
      (connection) => {
        expect(screen.queryByText(connection.favorite?.name || '<>')).to.exist;
      }
    );
  });

  it('should allow to create new connections', async function () {
    const newConnectionButton = screen.getByTestId('new-connection-button');
    userEvent.click(newConnectionButton);

    await waitFor(() => {
      expect(onNewConnection).to.have.been.called;
    });
  });

  it('should show the number of connections', function () {
    expect(screen.queryByText('(2)')).to.exist;
  });
});
