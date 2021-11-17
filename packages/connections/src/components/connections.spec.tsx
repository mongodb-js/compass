import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import { expect } from 'chai';
import { ConnectionInfo } from 'mongodb-data-service';
import { v4 as uuid } from 'uuid';
import sinon from 'sinon';
import getPort from 'get-port';

import Connections from './connections';
import { ConnectionStore } from '../stores/connections-store';

function getMockConnectionStorage(
  mockConnections: ConnectionInfo[]
): ConnectionStore {
  return {
    loadAll: () => {
      return Promise.resolve(mockConnections);
    },
    save: () => Promise.resolve(),
  };
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
    let savedConnectionId: string;
    let saveConnectionSpy: sinon.SinonSpy;

    beforeEach(async function () {
      savedConnectionId = uuid();
      saveConnectionSpy = sinon.spy();

      const mockStorage = getMockConnectionStorage([
        {
          id: savedConnectionId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false',
          },
        },
      ]);
      sinon.replace(mockStorage, 'save', saveConnectionSpy);

      render(
        <Connections
          onConnected={onConnectedSpy}
          connectionStorage={mockStorage}
        />
      );

      await waitFor(() => expect(screen.queryByRole('listitem')).to.be.visible);
    });

    it('should render the saved connections', function () {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).to.equal(1);

      const favorites = screen.queryAllByTestId('favorite-connection');
      expect(favorites.length).to.equal(0);

      const recents = screen.getAllByTestId('recent-connection');
      expect(recents.length).to.equal(1);
    });

    it('renders the title of the saved connection', function () {
      expect(screen.getByText('localhost:27018')).to.be.visible;
    });

    describe('when the saved connection is clicked on and connected to', function () {
      beforeEach(async function () {
        const savedConnectionButton = screen.getByTestId(
          `saved-connection-button-${savedConnectionId}`
        );
        fireEvent.click(savedConnectionButton);

        // Wait for the connection to load in the form.
        await waitFor(() =>
          expect(screen.queryByRole('textbox').textContent).to.equal(
            'mongodb://localhost:27018/?readPreference=primary&ssl=false'
          )
        );

        const connectButton = screen.getByText('Connect');
        fireEvent.click(connectButton);

        // Wait for the connecting... modal to hide.
        await waitFor(
          () =>
            expect(screen.queryByTestId('cancel-connection-attempt-button')).to
              .not.exist
        );
        await waitFor(
          () =>
            expect(screen.queryByTestId('connections-disconnected')).to.not
              .exist
        );
      });

      afterEach(async function () {
        await onConnectedSpy.firstCall?.args[1].disconnect().catch(console.log);
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
        const differenceInTimeFromNowAndLastUsed =
          Date.now() - saveConnectionSpy.firstCall.args[0].lastUsed.getTime();
        expect(differenceInTimeFromNowAndLastUsed).to.be.lessThanOrEqual(
          10_000 // 10s
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
        expect(onConnectedSpy.firstCall.args[1].isWritable).to.not.equal(
          undefined
        );
      });
    });
  });

  describe('connecting to a connection that is not succeeding', function () {
    let saveConnectionSpy: sinon.SinonSpy;
    let savedConnectableId: string;
    let savedUnconnectableId: string;
    let inactiveTestPort: number;

    before(async function () {
      inactiveTestPort = await getPort();
    });

    beforeEach(async function () {
      saveConnectionSpy = sinon.spy();
      savedConnectableId = uuid();
      savedUnconnectableId = uuid();

      const mockStorage = getMockConnectionStorage([
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
            // Times out in 5000ms.
            connectionString: `mongodb://localhost:${inactiveTestPort}/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000`,
          },
        },
      ]);
      sinon.replace(mockStorage, 'save', saveConnectionSpy);

      render(
        <Connections
          onConnected={onConnectedSpy}
          connectionStorage={mockStorage}
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
          `mongodb://localhost:${inactiveTestPort}/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000`
        )
      );

      const connectButton = screen.getByText('Connect');
      fireEvent.click(connectButton);

      // Wait for the connecting... modal to be shown.
      await waitFor(
        () =>
          expect(screen.queryByTestId('cancel-connection-attempt-button')).to.be
            .visible
      );
    });

    describe('when the connection attempt is cancelled', function () {
      beforeEach(async function () {
        const cancelButton = screen.getByTestId(
          'cancel-connection-attempt-button'
        );
        fireEvent.click(cancelButton);

        // Wait for the connecting... modal to hide.
        await waitFor(
          () =>
            expect(screen.queryByTestId('cancel-connection-attempt-button')).to
              .not.exist
        );
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

      describe('connecting to a successful connection after cancelling a connect', function () {
        beforeEach(async function () {
          const savedConnectionButton = screen.getByTestId(
            `saved-connection-button-${savedConnectableId}`
          );
          fireEvent.click(savedConnectionButton);

          // Wait for the connection to load in the form.
          await waitFor(() =>
            expect(screen.queryByRole('textbox').textContent).to.equal(
              'mongodb://localhost:27018/?readPreference=primary&ssl=false'
            )
          );

          const connectButton = screen.getByText('Connect');
          fireEvent.click(connectButton);

          // Wait for the connecting... modal to hide.
          await waitFor(
            () =>
              expect(screen.queryByTestId('cancel-connection-attempt-button'))
                .to.not.exist
          );
          await waitFor(
            () =>
              expect(screen.queryByTestId('connections-disconnected')).to.not
                .exist
          );
        });

        afterEach(async function () {
          await onConnectedSpy.firstCall?.args[1]
            .disconnect()
            .catch(console.log);
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

        it('should emit the data service', function () {
          expect(onConnectedSpy.firstCall.args[1].isWritable).to.not.equal(
            undefined
          );
        });
      });
    });
  });
});
