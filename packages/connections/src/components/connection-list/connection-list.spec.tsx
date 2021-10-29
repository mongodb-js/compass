import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { ConnectionInfo } from 'mongodb-data-service';

import ConnectionList from './connection-list';

const mockRecents: ConnectionInfo[] = [];
for (let i = 0; i < 5; i++) {
  mockRecents.push({
    id: `mock-connection-${i}`,
    connectionOptions: {
      connectionString: `mongodb://localhost:2${
        5000 + Math.floor(Math.random() * 5000)
      }`,
    },
    lastUsed: new Date(Date.now() - (Date.now() / 2) * Math.random()),
  });
}
const mockConnections = [
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
    id: 'mock-connection-invalid string',
    connectionOptions: {
      connectionString: 'invalid connection string',
    },
    lastUsed: new Date(),
  },
  ...mockRecents,
];

describe('ConnectionList Component', function () {
  let setActiveConnectionIdSpy;
  beforeEach(function () {
    setActiveConnectionIdSpy = sinon.spy();
  });
  describe('when rendered', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockConnections[2].id}
          connections={mockConnections}
          setActiveConnectionId={setActiveConnectionIdSpy}
        />
      );
    });

    it('shows two lists', function () {
      const listItems = screen.getAllByRole('list');
      expect(listItems.length).to.equal(2);
    });

    it('renders all of the connections in the lists', function () {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).to.equal(mockConnections.length);
    });

    it('renders the favorite connections in a list', function () {
      const listItems = screen.getAllByTestId('favorite-connection');
      expect(listItems.length).to.equal(2);
    });

    it('renders the recent connections in a list', function () {
      const listItems = screen.getAllByTestId('recent-connection');
      expect(listItems.length).to.equal(6);
    });
  });

  describe('when new connection is clicked', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockConnections[2].id}
          connections={mockConnections}
          setActiveConnectionId={setActiveConnectionIdSpy}
        />
      );

      expect(setActiveConnectionIdSpy.called).to.equal(false);

      const button = screen.getByText('New Connection').closest('button');
      fireEvent(
        button,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    it('calls changed active connection id to undefined', function () {
      expect(setActiveConnectionIdSpy.called).to.equal(true);
      expect(setActiveConnectionIdSpy.firstCall.args[0]).to.equal(undefined);
    });
  });

  describe('when a connection is clicked', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockConnections[2].id}
          connections={mockConnections}
          setActiveConnectionId={setActiveConnectionIdSpy}
        />
      );

      expect(setActiveConnectionIdSpy.called).to.equal(false);

      const button = screen
        .getByText(mockConnections[1].favorite.name)
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
        mockConnections[1].id
      );
    });
  });
});
