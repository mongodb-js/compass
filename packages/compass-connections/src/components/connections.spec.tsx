import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import { expect } from 'chai';
import type { ConnectionInfo, ConnectionOptions } from 'mongodb-data-service';
import { v4 as uuid } from 'uuid';
import sinon from 'sinon';

import Connections from './connections';
import type { ConnectionStore } from '../stores/connections-store';
import { ToastArea } from '@mongodb-js/compass-components';

function getMockConnectionStorage(
  mockConnections: ConnectionInfo[]
): ConnectionStore {
  return {
    loadAll: () => {
      return Promise.resolve(mockConnections);
    },
    save: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  };
}

async function loadSavedConnectionAndConnect(connectionInfo: ConnectionInfo) {
  const savedConnectionButton = screen.getByTestId(
    `saved-connection-button-${connectionInfo.id}`
  );
  fireEvent.click(savedConnectionButton);

  // Wait for the connection to load in the form.
  await waitFor(() =>
    expect(screen.queryByRole('textbox').textContent).to.equal(
      connectionInfo.connectionOptions.connectionString
    )
  );

  const connectButton = screen.getByText('Connect');
  fireEvent.click(connectButton);

  // Wait for the connecting... modal to hide.
  await waitFor(() => expect(screen.queryByText('Cancel')).to.not.exist);
}

describe('Connections Component', function () {
  let onConnectedSpy: sinon.SinonSpy;

  beforeEach(function () {
    onConnectedSpy = sinon.spy();
  });

  afterEach(function () {
    sinon.restore();
    cleanup();
  });

  describe('when rendered', function () {
    let loadConnectionsSpy: sinon.SinonSpy;
    beforeEach(function () {
      const mockStorage = getMockConnectionStorage([]);
      loadConnectionsSpy = sinon.spy(mockStorage, 'loadAll');

      render(
        <Connections
          onConnected={onConnectedSpy}
          connectionStorage={mockStorage}
          appName="Test App Name"
        />
      );
    });

    it('calls once to load the connections', function () {
      expect(loadConnectionsSpy.callCount).to.equal(1);
    });

    it('renders the connect button from the connect-form', function () {
      const button = screen.queryByText('Connect').closest('button');
      expect(button).to.not.equal(null);
    });

    it('renders atlas cta button', function () {
      const button = screen.getByTestId('atlas-cta-link');
      expect(button.getAttribute('href')).to.equal(
        'https://www.mongodb.com/cloud/atlas/lp/general/try?utm_source=compass&utm_medium=product'
      );
    });

    it('shows two connections lists', function () {
      const listItems = screen.getAllByRole('list');
      expect(listItems.length).to.equal(2);
    });

    it('should not show any banners', function () {
      expect(screen.queryByRole('alert')).to.not.exist;
    });

    it('should load an empty connections list with no connections', function () {
      const listItems = screen.queryAllByRole('listitem');
      expect(listItems.length).to.equal(0);

      const favorites = screen.queryAllByTestId('favorite-connection');
      expect(favorites.length).to.equal(0);

      const recents = screen.queryAllByTestId('recent-connection');
      expect(recents.length).to.equal(0);
    });
  });

  describe('when rendered with saved connections in storage', function () {
    let mockConnectFn: sinon.SinonSpy;
    let mockStorage: ConnectionStore;
    let savedConnectionId: string;
    let savedConnectionWithAppNameId: string;
    let saveConnectionSpy: sinon.SinonSpy;
    let connections: ConnectionInfo[];

    beforeEach(async function () {
      mockConnectFn = sinon.fake.resolves({
        mockDataService: 'yes',
      });
      savedConnectionId = uuid();
      savedConnectionWithAppNameId = uuid();
      saveConnectionSpy = sinon.spy();

      connections = [
        {
          id: savedConnectionId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false',
          },
        },
        {
          id: savedConnectionWithAppNameId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27019/?appName=Some+App+Name',
          },
        },
      ];
      mockStorage = getMockConnectionStorage(connections);
      sinon.replace(mockStorage, 'save', saveConnectionSpy);

      render(
        <ToastArea>
          <Connections
            onConnected={onConnectedSpy}
            connectFn={mockConnectFn}
            connectionStorage={mockStorage}
            appName="Test App Name"
          />
        </ToastArea>
      );

      await waitFor(() => expect(screen.queryAllByRole('listitem')).to.exist);
    });

    it('should render the saved connections', function () {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).to.equal(2);

      const favorites = screen.queryAllByTestId('favorite-connection');
      expect(favorites.length).to.equal(0);

      const recents = screen.getAllByTestId('recent-connection');
      expect(recents.length).to.equal(2);
    });

    it('renders the title of the saved connection', function () {
      expect(screen.getByText('localhost:27018')).to.be.visible;
    });

    describe('when a saved connection is clicked on and connected to', function () {
      beforeEach(async function () {
        this.clock = sinon.useFakeTimers({
          now: 1483228800000,
        });
        await loadSavedConnectionAndConnect(
          connections.find(({ id }) => id === savedConnectionId)
        );
      });

      afterEach(function () {
        this.clock.restore();
      });

      it('should call the connect function with the connection options to connect', function () {
        expect(mockConnectFn.callCount).to.equal(1);
        expect(mockConnectFn.firstCall.args[0]).to.deep.equal({
          connectionString:
            'mongodb://localhost:27018/?readPreference=primary&ssl=false&appName=Test+App+Name',
        });
      });

      it('should call to save the connection with the connection config', function () {
        expect(saveConnectionSpy.callCount).to.equal(1);
        expect(saveConnectionSpy.firstCall.args[0].id).to.equal(
          savedConnectionId
        );
        expect(
          saveConnectionSpy.firstCall.args[0].connectionOptions
        ).to.deep.equal({
          connectionString:
            'mongodb://localhost:27018/?readPreference=primary&ssl=false',
        });
      });

      it('should call to save the connection with a new lastUsed time', function () {
        expect(saveConnectionSpy.callCount).to.equal(1);
        expect(saveConnectionSpy.firstCall.args[0].lastUsed.getTime()).to.equal(
          1483228800000
        );
      });

      it('should emit the connection configuration used to connect', function () {
        expect(onConnectedSpy.firstCall.args[0].id).to.equal(savedConnectionId);
        expect(
          onConnectedSpy.firstCall.args[0].connectionOptions
        ).to.deep.equal({
          connectionString:
            'mongodb://localhost:27018/?readPreference=primary&ssl=false',
        });
      });

      it('should emit the data service', function () {
        expect(onConnectedSpy.firstCall.args[1].mockDataService).to.equal(
          'yes'
        );
      });
    });

    describe('when a saved connection with appName is clicked on and connected to', function () {
      beforeEach(async function () {
        await loadSavedConnectionAndConnect(
          connections.find(({ id }) => id === savedConnectionWithAppNameId)
        );
      });

      it('should call the connect function without replacing appName', function () {
        expect(mockConnectFn.callCount).to.equal(1);
        expect(mockConnectFn.firstCall.args[0]).to.deep.equal({
          connectionString: 'mongodb://localhost:27019/?appName=Some+App+Name',
        });
      });
    });
  });

  describe('connecting to a connection that is not succeeding', function () {
    let mockConnectFn: sinon.SinonSpy;
    let saveConnectionSpy: sinon.SinonSpy;
    let savedConnectableId: string;
    let savedUnconnectableId: string;
    let connections: ConnectionInfo[];

    beforeEach(async function () {
      saveConnectionSpy = sinon.spy();
      savedConnectableId = uuid();
      savedUnconnectableId = uuid();

      mockConnectFn = sinon.fake(
        async (connectionOptions: ConnectionOptions) => {
          if (
            connectionOptions.connectionString ===
            'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000&appName=Test+App+Name'
          ) {
            return new Promise((resolve) => {
              // On first call we want this attempt to be cancelled before
              // this promise resolves.
              setTimeout(resolve, 20);
            });
          }
          return Promise.resolve({
            mockDataService: 'yes',
          });
        }
      );

      connections = [
        {
          id: savedConnectableId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false',
          },
        },
        {
          id: savedUnconnectableId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000',
          },
        },
      ];
      const mockStorage = getMockConnectionStorage(connections);
      sinon.replace(mockStorage, 'save', saveConnectionSpy);

      render(
        <Connections
          onConnected={onConnectedSpy}
          connectFn={mockConnectFn}
          connectionStorage={mockStorage}
          appName="Test App Name"
        />
      );

      await waitFor(
        () =>
          expect(
            screen.queryByTestId(
              `saved-connection-button-${savedUnconnectableId}`
            )
          ).to.exist
      );

      const savedConnectionButton = screen.getByTestId(
        `saved-connection-button-${savedUnconnectableId}`
      );
      fireEvent.click(savedConnectionButton);

      // Wait for the connection to load in the form.
      await waitFor(() =>
        expect(screen.queryByRole('textbox').textContent).to.equal(
          'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000'
        )
      );

      const connectButton = screen.getByText('Connect');
      fireEvent.click(connectButton);

      // Wait for the connecting... modal to be shown.
      await waitFor(() => expect(screen.queryByText('Cancel')).to.be.visible);
    });

    describe('when the connection attempt is cancelled', function () {
      beforeEach(async function () {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        // Wait for the connecting... modal to hide.
        await waitFor(() => expect(screen.queryByText('Cancel')).to.not.exist);
      });

      it('should enable the connect button', function () {
        const connectButton = screen.getByText('Connect');
        expect(connectButton).to.not.match('disabled');
      });

      it('should not call to save the connection', function () {
        expect(saveConnectionSpy.callCount).to.equal(0);
      });

      it('should not emit connected', function () {
        expect(onConnectedSpy.called).to.equal(false);
      });

      it('should have the disabled connect test id', function () {
        expect(screen.getByTestId('connections-disconnected')).to.be.visible;
      });

      it('should call the connect function with the connection options to connect', function () {
        expect(mockConnectFn.callCount).to.equal(1);
        expect(mockConnectFn.firstCall.args[0]).to.deep.equal({
          connectionString:
            'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000&appName=Test+App+Name',
        });
      });

      describe('connecting to a successful connection after cancelling a connect', function () {
        beforeEach(async function () {
          await loadSavedConnectionAndConnect(
            connections.find(({ id }) => id === savedConnectableId)
          );
        });

        it('should call onConnected once', function () {
          expect(onConnectedSpy.callCount).to.equal(1);
        });

        it('should call to save the connection once', function () {
          expect(saveConnectionSpy.callCount).to.equal(1);
        });

        it('should emit the connection configuration used to connect', function () {
          expect(onConnectedSpy.firstCall.args[0].id).to.equal(
            savedConnectableId
          );
          expect(
            onConnectedSpy.firstCall.args[0].connectionOptions
          ).to.deep.equal({
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false',
          });
        });

        it('should call the connect function with the connection options to connect', function () {
          expect(mockConnectFn.callCount).to.equal(2);
          expect(mockConnectFn.secondCall.args[0]).to.deep.equal({
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false&appName=Test+App+Name',
          });
        });

        it('should emit the data service', function () {
          expect(onConnectedSpy.firstCall.args[1].mockDataService).to.equal(
            'yes'
          );
        });
      });
    });
  });
});
