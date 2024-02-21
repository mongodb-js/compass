import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';

import ConnectionList from './connection-list';

const mockRecents: ConnectionInfo[] = [];
for (let i = 0; i < 5; i++) {
  mockRecents.push({
    id: `mock-connection-${i}`,
    connectionOptions: {
      connectionString: `mongodb://localhost:2${5000 + i}`,
    },
    lastUsed: new Date(1647022100487 - i),
  });
}

const mockFavorites = [
  {
    id: 'mock-connection-atlas',
    connectionOptions: {
      connectionString:
        'mongodb+srv://testUserForTesting:notMyRealPassword@test.mongodb.net/test?authSource=admin&replicaSet=art-dev-shard-0&readPreference=primary&ssl=true',
    },
    favorite: {
      name: 'Atlas test',
      color: '#d4366e',
    },
    lastUsed: new Date(),
  },
  {
    id: 'mock-connection-empty-connection',
    connectionOptions: {
      connectionString: '',
    },
    favorite: {
      name: 'super long favorite name - super long favorite name - super long favorite name - super long favorite name',
      color: '#5fc86e',
    },
    lastUsed: new Date(),
  },
  {
    id: 'mock-connection-local',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27019',
    },
    favorite: {
      name: 'favorite',
      color: '#5fc86e',
    },
    lastUsed: new Date(),
  },
  {
    id: 'mock-connection-invalid string',
    connectionOptions: {
      connectionString: 'invalid connection string',
    },
    lastUsed: new Date(),
  },
];

describe('ConnectionList Component', function () {
  let setActiveConnectionIdSpy;
  let createNewConnectionSpy;
  beforeEach(function () {
    setActiveConnectionIdSpy = sinon.spy();
    createNewConnectionSpy = sinon.spy();
  });
  afterEach(cleanup);
  describe('when rendered', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockFavorites[2].id}
          favoriteConnections={mockFavorites}
          recentConnections={mockRecents}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={setActiveConnectionIdSpy}
          removeAllRecentsConnections={() => true}
          onDoubleClick={() => true}
        />
      );
    });

    it('shows two lists', function () {
      const listItems = screen.getAllByRole('list');
      expect(listItems.length).to.equal(2);
    });

    it('renders all of the connections in the lists', function () {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).to.equal(
        mockFavorites.length + mockRecents.length
      );
    });

    it('renders the favorite connections in a list', function () {
      const listItems = screen.getAllByTestId('favorite-connection-title');
      expect(listItems[0].textContent).to.equal(mockFavorites[0].favorite.name);
      expect(listItems[1].textContent).to.equal(mockFavorites[1].favorite.name);
      expect(listItems[2].textContent).to.equal(mockFavorites[2].favorite.name);
    });

    it('renders the recent connections in a list', function () {
      const listItems = screen.getAllByTestId('recent-connection');
      expect(listItems.length).to.equal(mockRecents.length);
    });

    it('does not show the saved connections filter input', function () {
      const filter = screen.queryByTestId(
        'sidebar-filter-saved-connections-input'
      );
      expect(filter).to.not.exist;
    });
  });

  describe('with more than 10 favorite connections', function () {
    beforeEach(function () {
      const favorites = [
        ...mockFavorites,
        ...mockFavorites.map((favorite) => ({
          ...favorite,
          id: favorite.id + '__1',
        })),
        ...mockFavorites.map((favorite) => ({
          ...favorite,
          id: favorite.id + '__2',
        })),
        ...mockFavorites.map((favorite) => ({
          ...favorite,
          id: favorite.id + '__3',
        })),
      ];
      render(
        <ConnectionList
          activeConnectionId={mockFavorites[2].id}
          favoriteConnections={favorites}
          recentConnections={mockRecents}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={setActiveConnectionIdSpy}
          removeAllRecentsConnections={() => true}
          onDoubleClick={() => true}
        />
      );
    });

    it('shows the saved connections filter input', function () {
      expect(screen.getByTestId('sidebar-filter-saved-connections-input')).to.be
        .visible;
      expect(
        screen.getAllByTestId('favorite-connection-title').length
      ).to.equal(12);
    });

    describe('when the saved connections filter input is updated', function () {
      beforeEach(function () {
        const textInput = screen.getByTestId(
          'sidebar-filter-saved-connections-input'
        );

        userEvent.type(textInput, 'super');
      });

      it('only shows the partial favorite connections', function () {
        expect(
          screen.getAllByTestId('favorite-connection-title').length
        ).to.equal(4);
      });
    });
  });

  describe('when new connection is clicked', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockFavorites[2].id}
          favoriteConnections={mockFavorites}
          recentConnections={mockRecents}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={setActiveConnectionIdSpy}
          removeAllRecentsConnections={() => true}
          onDoubleClick={() => true}
        />
      );

      expect(setActiveConnectionIdSpy.called).to.equal(false);

      const button = screen.getByText('New connection').closest('button');
      fireEvent(
        button,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    it('calls create new connection', function () {
      expect(createNewConnectionSpy.called).to.equal(true);
      expect(setActiveConnectionIdSpy.called).to.equal(false);
    });
  });

  describe('when a favorite connection is clicked', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockFavorites[2].id}
          favoriteConnections={mockFavorites}
          recentConnections={mockRecents}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={setActiveConnectionIdSpy}
          removeAllRecentsConnections={() => true}
          onDoubleClick={() => true}
        />
      );

      expect(setActiveConnectionIdSpy.called).to.equal(false);

      const button = screen
        .getByText(mockFavorites[1].favorite.name)
        .closest('button');
      fireEvent(
        button,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    it('calls changed active connection id to the clicked connection', function () {
      expect(setActiveConnectionIdSpy.called).to.equal(true);
      expect(setActiveConnectionIdSpy.firstCall.args[0]).to.equal(
        'mock-connection-empty-connection'
      );
    });
  });

  describe('when a recent connection is clicked', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockFavorites[2].id}
          favoriteConnections={mockFavorites}
          recentConnections={mockRecents}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={setActiveConnectionIdSpy}
          removeAllRecentsConnections={() => true}
          onDoubleClick={() => true}
        />
      );

      expect(setActiveConnectionIdSpy.called).to.equal(false);

      const button = screen
        .getByText(mockRecents[3].connectionOptions.connectionString.substr(10))
        .closest('button');
      fireEvent(
        button,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    it('calls changed active connection id to the clicked connection', function () {
      expect(setActiveConnectionIdSpy.called).to.equal(true);
      expect(setActiveConnectionIdSpy.firstCall.args[0]).to.equal(
        'mock-connection-3'
      );
    });
  });
  describe('when "clear all" button is clicked', function () {
    let removeAllRecentsConnectionsSpy;
    beforeEach(async function () {
      removeAllRecentsConnectionsSpy = sinon.spy();
      render(
        <ConnectionList
          activeConnectionId={mockFavorites[2].id}
          favoriteConnections={mockFavorites}
          recentConnections={mockRecents}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={() => true}
          removeAllRecentsConnections={removeAllRecentsConnectionsSpy}
          onDoubleClick={() => true}
        />
      );

      expect(removeAllRecentsConnectionsSpy.called).to.equal(false);

      fireEvent.mouseOver(screen.getByText('Recents'));
      await waitFor(() => screen.getByText('Clear All'));
      const button = screen.getByText('Clear All');
      fireEvent(
        button,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    it('calls function to remove all recents connections', function () {
      expect(removeAllRecentsConnectionsSpy.called).to.equal(true);
    });
  });
});
