import React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavedConnection } from './saved-connection';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

const CONNECTION_INFO: ConnectionInfo = {
  id: '1',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    name: 'My Name',
    color: 'color2',
  },
  savedConnectionType: 'favorite',
};

describe('SavedConnection Component', function () {
  const onConnect = spy();
  const onDeleteConnection = spy();
  const onEditConnection = spy();
  const onDuplicateConnection = spy();
  const onToggleFavoriteConnection = spy();

  function doRender(info: ConnectionInfo) {
    return render(
      <SavedConnection
        onConnect={onConnect}
        onEditConnection={onEditConnection}
        onDeleteConnection={onDeleteConnection}
        onDuplicateConnection={onDuplicateConnection}
        onToggleFavoriteConnection={onToggleFavoriteConnection}
        connectionInfo={info}
      />
    );
  }

  beforeEach(function () {
    doRender(CONNECTION_INFO);
  });

  afterEach(function () {
    cleanup();
  });

  it('should render the connection name', function () {
    const connection = screen.queryByText(
      CONNECTION_INFO.favorite?.name || '<>'
    );
    expect(connection).to.exist;
  });

  describe('connection', function () {
    it('should be visible and clickable when hovering on the connection', async function () {
      const connection = screen.getByText(
        CONNECTION_INFO.favorite?.name || '<>'
      );
      userEvent.hover(connection);

      const connectionButton = await waitFor(() =>
        screen.findByTestId('connect-button')
      );

      userEvent.click(connectionButton);

      await waitFor(() => {
        expect(onConnect).to.have.been.calledWith(CONNECTION_INFO);
      });
    });
  });

  describe('context menu', function () {
    beforeEach(async function () {
      const connection = screen.getByText(
        CONNECTION_INFO.favorite?.name || '<>'
      );
      userEvent.hover(connection);

      const contextMenuButton = await waitFor(() =>
        screen.findByTestId('connection-menu-show-actions')
      );

      userEvent.click(contextMenuButton);
    });

    it('should be visible when hovering on the connection', async function () {
      await waitFor(async () => {
        const editConnectionAction = await screen.findByText('Edit connection');
        expect(editConnectionAction).to.exist;
      });
    });

    const testCases: [string, typeof spy][] = [
      ['Edit connection', onEditConnection],
      ['Unfavorite', onToggleFavoriteConnection],
      ['Duplicate', onDuplicateConnection],
      ['Remove', onDeleteConnection],
    ];

    testCases.forEach(([actionText, callback]) => {
      describe(actionText, function () {
        it('should be clickable', async function () {
          const button = await waitFor(() => screen.findByText(actionText));
          userEvent.click(button);

          expect(callback).to.have.been.calledWith(CONNECTION_INFO);
        });
      });
    });

    describe('Copy connection string', function () {
      it('should copy the current connection connection string', async function () {
        const button = await waitFor(() =>
          screen.findByText('Copy connection string')
        );
        userEvent.click(button);

        await waitFor(async () => {
          const clipboardText = await navigator.clipboard.readText();
          expect(clipboardText).to.equal(
            CONNECTION_INFO.connectionOptions.connectionString
          );
        });
      });

      describe('Favorite', function () {
        beforeEach(function () {
          cleanup();
        });

        it('is only visible for non favorite connections', async function () {
          const nonFavoriteConnectionInfo: ConnectionInfo = {
            ...CONNECTION_INFO,
            savedConnectionType: 'recent',
          };
          doRender(nonFavoriteConnectionInfo);

          const connection = screen.getByText(
            CONNECTION_INFO.favorite?.name || '<>'
          );
          userEvent.hover(connection);

          const contextMenuButton = await waitFor(() =>
            screen.findByTestId('connection-menu-show-actions')
          );

          userEvent.click(contextMenuButton);

          const button = await waitFor(() => screen.findByText('Favorite'));
          userEvent.click(button);

          expect(onToggleFavoriteConnection).to.have.been.calledWith(
            nonFavoriteConnectionInfo
          );
        });
      });
    });
  });
});
