import React from 'react';
import { expect } from 'chai';
import { UUID } from 'bson';
import sinon from 'sinon';
import Connections from './legacy-connections';
import type { ConnectionInfo } from '../connection-info-provider';
import {
  renderWithConnections,
  screen,
  userEvent,
  waitFor,
  cleanup,
} from '@mongodb-js/testing-library-compass';

async function loadSavedConnectionAndConnect(connectionInfo: ConnectionInfo) {
  const savedConnectionButton = screen.getByTestId(
    `saved-connection-button-${connectionInfo.id}`
  );
  userEvent.click(savedConnectionButton);

  // Wait for the connection to load in the form.
  await waitFor(() =>
    expect(screen.queryByTestId('connectionString')?.textContent).to.equal(
      connectionInfo.connectionOptions.connectionString
    )
  );

  const connectButton = screen.getByRole('button', { name: 'Save & Connect' });
  userEvent.click(connectButton);

  // Wait for the connecting... modal to hide.
  await waitFor(() => expect(screen.queryByText('Cancel')).to.not.exist);
}

// TODO(COMPASS-7906): remove
describe.skip('Connections Component', function () {
  afterEach(function () {
    sinon.restore();
    cleanup();
  });

  context('when rendered', function () {
    beforeEach(function () {
      renderWithConnections(<Connections appRegistry={{} as any} />);
    });

    it('renders the connect button from the connect-form', function () {
      const button = screen.queryByText('Connect')?.closest('button');
      expect(button).to.not.equal(null);
    });

    it('renders atlas cta button', function () {
      const button = screen.getByTestId('atlas-cta-link');
      expect(button.getAttribute('href')).to.equal(
        'https://www.mongodb.com/cloud/atlas/lp/try4?utm_source=compass&utm_medium=product&utm_content=v1'
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

    it('should include the help panels', function () {
      expect(screen.queryByText(/How do I find my/)).to.be.visible;
      expect(screen.queryByText(/How do I format my/)).to.be.visible;
    });
  });

  context('when rendered with saved connections in storage', function () {
    let savedConnectionId: string;
    let savedConnectionWithAppNameId: string;
    let connections: ConnectionInfo[];
    let connectSpyFn: sinon.SinonSpy;
    let saveConnectionSpy: sinon.SinonSpy;
    let getState;

    beforeEach(async function () {
      savedConnectionId = new UUID().toString();
      savedConnectionWithAppNameId = new UUID().toString();

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

      connectSpyFn = sinon.stub().returns({});

      const { connectionsStore, connectionStorage } = renderWithConnections(
        <Connections appRegistry={{} as any} />,
        {
          connections,
          connectFn: connectSpyFn,
        }
      );

      saveConnectionSpy = sinon.spy(connectionStorage, 'save');
      getState = connectionsStore.getState;

      await waitFor(() => {
        expect(screen.queryAllByRole('listitem')).to.exist;
      });
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

    context(
      'when a saved connection is clicked on and connected to',
      function () {
        beforeEach(async function () {
          await loadSavedConnectionAndConnect(
            connections.find(({ id }) => id === savedConnectionId)!
          );
        });

        it('should call the connect function with the connection options to connect', function () {
          expect(connectSpyFn.callCount).to.equal(1);
          expect(connectSpyFn.firstCall.args[0]).to.have.property(
            'connectionString',
            'mongodb://localhost:27018/?readPreference=primary&ssl=false&appName=TEST'
          );
        });

        it('should call to save the connection', function () {
          expect(saveConnectionSpy.callCount).to.equal(1);
        });

        it('should update the connection with a new lastUsed time', function () {
          expect(
            getState().connections.byId[savedConnectionId].info
          ).to.have.property('lastUsed');
        });
      }
    );

    context(
      'when a saved connection with appName is clicked on and connected to',
      function () {
        beforeEach(async function () {
          await loadSavedConnectionAndConnect(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            connections.find(({ id }) => id === savedConnectionWithAppNameId)!
          );
        });

        it('should call the connect function without replacing appName', function () {
          expect(connectSpyFn.callCount).to.equal(1);
          expect(connectSpyFn.firstCall.args[0]).to.have.property(
            'connectionString',
            'mongodb://localhost:27019/?appName=Some+App+Name'
          );
        });
      }
    );
  });

  context(
    'when connecting to a connection that is not succeeding',
    function () {
      let savedConnectableId: string;
      let savedUnconnectableId: string;
      let connections: ConnectionInfo[];
      let connectSpyFn: sinon.SinonSpy;
      let saveConnectionSpy: sinon.SinonSpy;

      beforeEach(async function () {
        savedConnectableId = new UUID().toString();
        savedUnconnectableId = new UUID().toString();
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

        connectSpyFn = sinon
          .stub()
          // On first call we cancel it, so just never resolve to give UI time
          // to render the connecting... state
          .onFirstCall()
          .callsFake(() => {
            return new Promise(() => {});
          })
          // On second call connect successfully without blocking
          .onSecondCall()
          .callsFake(() => {
            return {};
          });

        const { connectionStorage } = renderWithConnections(
          <Connections appRegistry={{} as any} />,
          { connections, connectFn: connectSpyFn }
        );

        saveConnectionSpy = sinon.spy(connectionStorage, 'save');

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
        userEvent.click(savedConnectionButton);

        // Wait for the connection to load in the form.
        await waitFor(() =>
          expect(
            screen.queryByTestId('connectionString')?.textContent
          ).to.equal(
            'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000'
          )
        );

        const connectButton = screen.getByRole('button', {
          name: 'Save & Connect',
        });
        userEvent.click(connectButton);

        // Wait for the connecting... modal to be shown.
        await waitFor(() => {
          expect(screen.queryByText('Cancel')).to.be.visible;
        });
      });

      context('when the connection attempt is cancelled', function () {
        beforeEach(async function () {
          const cancelButton = screen.getByRole('button', { name: 'Cancel' });
          userEvent.click(cancelButton);

          // Wait for the connecting... modal to hide.
          await waitFor(() => {
            expect(screen.queryByText('Cancel')).to.not.exist;
          });
        });

        it('should enable the connect button', function () {
          const connectButton = screen.getByRole('button', {
            name: 'Save & Connect',
          });
          expect(connectButton).to.not.match('disabled');
        });

        it('should not call to save the connection', function () {
          expect(saveConnectionSpy.callCount).to.equal(0);
        });

        it('should have the connections-wrapper test id', function () {
          expect(screen.getByTestId('connections-wrapper')).to.be.visible;
        });

        it('should call the connect function with the connection options to connect', function () {
          expect(connectSpyFn.callCount).to.equal(1);
          expect(connectSpyFn.firstCall.args[0]).to.have.property(
            'connectionString',
            'mongodb://localhost:27099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000&appName=TEST'
          );
        });

        context(
          'connecting to a successful connection after cancelling a connect',
          function () {
            beforeEach(async function () {
              await loadSavedConnectionAndConnect(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                connections.find(({ id }) => id === savedConnectableId)!
              );
            });

            it('should call to save the connection once', function () {
              expect(saveConnectionSpy.callCount).to.equal(1);
            });

            it('should call the connect function with the connection options to connect', function () {
              expect(connectSpyFn.callCount).to.equal(2);
              expect(connectSpyFn.secondCall.args[0]).to.have.property(
                'connectionString',
                'mongodb://localhost:27018/?readPreference=primary&ssl=false&appName=TEST'
              );
            });
          }
        );
      });
    }
  );
});
