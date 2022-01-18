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
      connectionString: `mongodb://localhost:2${5000 + i}`,
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
  ...mockRecents,
];

describe('ConnectionList Component', function () {
  let setActiveConnectionIdSpy;
  let createNewConnectionSpy;
  beforeEach(function () {
    setActiveConnectionIdSpy = sinon.spy();
    createNewConnectionSpy = sinon.spy();
  });
  describe('when rendered', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockConnections[2].id}
          connections={mockConnections}
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
      expect(listItems.length).to.equal(mockConnections.length);
    });

    it('favorites are alphabetically sorted', function () {
      const listItems = screen.getAllByTestId('favorite-connection');
      expect(listItems.length).to.equal(3);
    });

    it('renders the favorite connections in a list', function () {
      const listItems = screen.getAllByTestId('favorite-connection-title');
      expect(listItems[0].textContent).to.equal('Atlas test');
      expect(listItems[1].textContent).to.equal('favorite');
      expect(listItems[2].textContent).to.equal(
        'super long favorite name - super long favorite name - super long favorite name - super long favorite name'
      );
    });

    it('renders the recent connections in a list', function () {
      const listItems = screen.getAllByTestId('recent-connection');
      expect(listItems.length).to.equal(6);
    });

    it('renders the recent connections in most recent first order', function () {
      const listItems = screen.getAllByTestId('recent-connection-description');
      expect(
        new Date(listItems[0].textContent).getTime()
      ).to.be.greaterThanOrEqual(new Date(listItems[1].textContent).getTime());
      expect(
        new Date(listItems[1].textContent).getTime()
      ).to.be.greaterThanOrEqual(new Date(listItems[2].textContent).getTime());
      expect(
        new Date(listItems[2].textContent).getTime()
      ).to.be.greaterThanOrEqual(new Date(listItems[3].textContent).getTime());
    });
  });

  describe('when new connection is clicked', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockConnections[2].id}
          connections={mockConnections}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={setActiveConnectionIdSpy}
          removeAllRecentsConnections={() => true}
          onDoubleClick={() => true}
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

    it('calls create new connection', function () {
      expect(createNewConnectionSpy.called).to.equal(true);
      expect(setActiveConnectionIdSpy.called).to.equal(false);
    });
  });

  describe('when a favorite connection is clicked', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockConnections[2].id}
          connections={mockConnections}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={setActiveConnectionIdSpy}
          removeAllRecentsConnections={() => true}
          onDoubleClick={() => true}
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
        'mock-connection-empty-connection'
      );
    });
  });

  describe('when a recent connection is clicked', function () {
    beforeEach(function () {
      render(
        <ConnectionList
          activeConnectionId={mockConnections[2].id}
          connections={mockConnections}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={setActiveConnectionIdSpy}
          removeAllRecentsConnections={() => true}
          onDoubleClick={() => true}
        />
      );

      expect(setActiveConnectionIdSpy.called).to.equal(false);

      const button = screen
        .getByText(
          mockConnections[7].connectionOptions.connectionString.substr(10)
        )
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
    beforeEach(function () {
      removeAllRecentsConnectionsSpy = sinon.spy();
      render(
        <ConnectionList
          activeConnectionId={mockConnections[2].id}
          connections={mockConnections}
          createNewConnection={createNewConnectionSpy}
          setActiveConnectionId={() => true}
          removeAllRecentsConnections={removeAllRecentsConnectionsSpy}
          onDoubleClick={() => true}
        />
      );

      expect(removeAllRecentsConnectionsSpy.called).to.equal(false);

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
