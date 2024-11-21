import { expect } from 'chai';
import sinon from 'sinon';
import type { RenderConnectionsOptions } from '@mongodb-js/testing-library-compass';
import {
  waitFor,
  screen,
  createDefaultConnectionInfo,
  wait,
  render,
} from '@mongodb-js/testing-library-compass';
import React from 'react';

const mockConnections = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: 'mongodb://turtle',
    },
    favorite: {
      name: 'turtles',
    },
    savedConnectionType: 'favorite' as const,
  },
  {
    id: 'oranges',
    connectionOptions: {
      connectionString: 'mongodb://peaches',
    },
    favorite: {
      name: 'peaches',
    },
    savedConnectionType: 'favorite' as const,
  },
];

function renderCompassConnections(opts?: RenderConnectionsOptions) {
  return render(
    <div>
      {/* it's a bit weird, but testing-library-compass already renders CompassConnections for us */}
    </div>,
    opts
  );
}

describe('CompassConnections store', function () {
  afterEach(() => {
    sinon.resetHistory();
    sinon.restore();
  });

  describe('#connect', function () {
    it('should show notifications throughout connection flow and save connection to persistent store', async function () {
      const { connectionsStore, connectionStorage, track } =
        renderCompassConnections({
          connectFn: async () => {
            await wait(100);
            return {};
          },
        });

      const connectionInfo = createDefaultConnectionInfo();

      const storedConnectionBeforeConnect = await connectionStorage.load({
        id: connectionInfo.id,
      });
      // Verifying it's not in storage
      expect(storedConnectionBeforeConnect).to.eq(undefined);

      const connectPromise = connectionsStore.actions.connect(connectionInfo);

      await waitFor(() => {
        expect(track).to.have.been.calledWith('Connection Attempt');
      });

      await waitFor(() => {
        expect(screen.getByText('Connecting to localhost:27017')).to.exist;
      });

      await connectPromise;

      expect(screen.getByText('Connected to localhost:27017')).to.exist;

      // Saved after connect
      const storedConnectionAfterConnect = await connectionStorage.load({
        id: connectionInfo.id,
      });
      expect(storedConnectionAfterConnect).to.exist;

      await waitFor(() => {
        expect(track.getCall(1).firstArg).to.eq('New Connection');
      });
    });

    it('should show error toast if connection failed', async function () {
      const { connectionsStore } = renderCompassConnections({
        connectFn: sinon
          .stub()
          .rejects(new Error('Failed to connect to cluster')),
      });

      const connectionInfo = createDefaultConnectionInfo();

      const connectPromise = connectionsStore.actions.connect(connectionInfo);

      await waitFor(() => {
        expect(screen.getByText('Failed to connect to cluster')).to.exist;
      });

      try {
        // Connect method should not reject, all the logic is encapsulated,
        // there is no reason to expose the error outside the store
        await connectPromise;
      } catch (err) {
        expect.fail('Expected connect() method to not throw');
      }
    });

    it('should show non-genuine modal at the end of connection if non genuine mongodb detected', async function () {
      const { connectionsStore } = renderCompassConnections({});

      await connectionsStore.actions.connect({
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://dummy:1234@dummy-name.cosmos.azure.com:443/?ssl=true',
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/appears to be an emulation of MongoDB/)).to
          .exist;
      });
    });

    it('should show max connections toast if maximum connections number reached', async function () {
      const { connectionsStore } = renderCompassConnections({
        preferences: {
          maximumNumberOfActiveConnections: 0,
        },
      });

      const connectPromise = connectionsStore.actions.connect(
        createDefaultConnectionInfo()
      );

      await waitFor(() => {
        expect(screen.getByText(/First disconnect from another connection/)).to
          .exist;
      });

      // Await just not to leave the hanging promise in the test
      await connectPromise;
    });

    it('should show device auth code modal when OIDC flow triggers the notification', async function () {
      let resolveConnect;
      const connectFn = sinon.stub().callsFake(() => {
        return new Promise((resolve) => {
          resolveConnect = () => resolve({});
        });
      });

      const { connectionsStore } = renderCompassConnections({
        connectFn,
      });

      const connectPromise = connectionsStore.actions.connect(
        createDefaultConnectionInfo()
      );

      await waitFor(() => {
        expect(connectFn).to.have.been.calledOnce;
      });

      const connectionOptions = connectFn.getCall(0).firstArg;

      connectionOptions.oidc.notifyDeviceFlow({
        verificationUrl: 'http://example.com/device-auth',
        userCode: 'ABCabc123',
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Visit the following URL to complete authentication/)
        ).to.exist;

        expect(
          screen.getByRole('link', { name: 'http://example.com/device-auth' })
        ).to.exist;

        expect(screen.getByText('ABCabc123')).to.exist;
      });

      resolveConnect();

      await connectPromise;

      await waitFor(() => {
        expect(() =>
          screen.getByText('Complete authentication in the browser')
        ).to.throw();
      });
    });

    it('should only update favorite info for existing connection with new props when existing connection is successfull', async function () {
      const { connectionsStore, connectionStorage } = renderCompassConnections({
        connections: mockConnections,
      });

      await connectionsStore.actions.connect({
        ...mockConnections[0],
        connectionOptions: {
          ...mockConnections[0].connectionOptions,
          connectionString: 'mongodb://foobar',
        },
        favorite: { name: 'foobar' },
      });

      const storedConnection = await connectionStorage.load({
        id: mockConnections[0].id,
      });

      // Connection string in the storage wasn't updated
      expect(storedConnection).to.have.nested.property(
        'connectionOptions.connectionString',
        'mongodb://turtle'
      );

      // Connection favorite name was updated
      expect(storedConnection).to.have.nested.property(
        'favorite.name',
        'foobar'
      );
    });

    it('should not update existing connection if connection failed', async function () {
      const { connectionsStore, connectionStorage } = renderCompassConnections({
        connections: mockConnections,
        connectFn: sinon.stub().rejects(new Error('Failed to connect')),
      });

      await connectionsStore.actions.connect({
        ...mockConnections[0],
        favorite: { name: 'foobar' },
      });

      // Connection in the storage wasn't updated
      expect(
        await connectionStorage.load({ id: mockConnections[0].id })
      ).to.have.nested.property('favorite.name', 'turtles');
    });
  });

  describe('#saveAndConnect', function () {
    it('saves the connection options before connecting', async function () {
      const { connectionsStore, track, connectionStorage } =
        renderCompassConnections({
          connections: mockConnections,
        });

      const updatedConnection = {
        ...mockConnections[0],
        savedConnectionType: 'recent' as const,
      };

      await connectionsStore.actions.saveAndConnect(updatedConnection);

      await waitFor(() => {
        expect(track.getCall(1).firstArg).to.eq('New Connection');
      });

      expect(
        await connectionStorage.load({ id: updatedConnection.id })
      ).to.have.property('savedConnectionType', 'recent');

      expect(
        screen.getByText(`Connected to ${mockConnections[0].favorite.name}`)
      ).to.exist;
    });
  });

  describe('#disconnect', function () {
    it('disconnect even if connection is in progress cleaning up progress toasts', async function () {
      const { connectionsStore, track } = renderCompassConnections({
        connectFn() {
          return new Promise(() => {
            // going to cancel this one
          });
        },
      });

      const connectionInfo = createDefaultConnectionInfo();
      const connectPromise = connectionsStore.actions.connect(connectionInfo);

      await waitFor(() => {
        expect(screen.getByText(/Connecting to/)).to.exist;
      });

      connectionsStore.actions.disconnect(connectionInfo.id);
      await connectPromise;

      expect(track).to.have.been.calledWith('Connection Disconnected');
      expect(() => screen.getByText(/Connecting to/)).to.throw;
    });
  });

  describe('#createNewConnection', function () {});

  describe('#saveEditedConnection', function () {
    it('new connection: should call save and track the creation', async function () {
      const { connectionsStore, track, connectionStorage } =
        renderCompassConnections({});

      // We can't save non-existent connections, create new one before
      // proceeding
      connectionsStore.actions.createNewConnection();

      const editingConnection =
        connectionsStore.getState().connections.byId[
          connectionsStore.getState().editingConnectionInfoId
        ];

      const newConnection = {
        ...editingConnection.info,
        favorite: {
          name: 'peaches (50) peaches',
        },
        savedConnectionType: 'favorite' as const,
      };

      await connectionsStore.actions.saveEditedConnection(newConnection);

      expect(track).to.have.been.calledWith('Connection Created');

      expect(await connectionStorage.load({ id: newConnection.id })).to.exist;
    });

    it('existing connection: should call save and should not track the creation', async function () {
      const { connectionsStore, track, connectionStorage } =
        renderCompassConnections({
          connections: mockConnections,
        });

      const updatedConnection = {
        ...mockConnections[0],
        savedConnectionType: 'recent' as const,
      };

      await connectionsStore.actions.saveEditedConnection(updatedConnection);

      expect(track).not.to.have.been.called;

      expect(
        await connectionStorage.load({ id: updatedConnection.id })
      ).to.have.property('savedConnectionType', 'recent');
    });
  });

  describe('#removeConnection', function () {
    it('should disconnect and call delete and track the deletion', async function () {
      const { connectionsStore, connectionStorage, track } =
        renderCompassConnections({
          connections: mockConnections,
        });

      await connectionsStore.actions.connect(mockConnections[0]);

      connectionsStore.actions.removeConnection(mockConnections[0].id);

      await waitFor(() => {
        expect(track).to.have.been.calledWith('Connection Removed');
        expect(track).to.have.been.calledWith('Connection Disconnected');
      });

      expect(connectionsStore.getState().connections.byId).to.not.have.property(
        mockConnections[0].id
      );
      expect(await connectionStorage.load({ id: mockConnections[0].id })).to.not
        .exist;
    });
  });

  describe('#editConnection', function () {
    it('should only allow to edit existing connections', function () {
      const { connectionsStore } = renderCompassConnections({
        connections: mockConnections,
      });

      connectionsStore.actions.editConnection('123');
      expect(connectionsStore.getState()).to.have.property(
        'isEditingConnectionInfoModalOpen',
        false
      );

      connectionsStore.actions.editConnection(mockConnections[0].id);
      expect(connectionsStore.getState()).to.have.property(
        'isEditingConnectionInfoModalOpen',
        true
      );
      expect(connectionsStore.getState()).to.have.property(
        'editingConnectionInfoId',
        mockConnections[0].id
      );
    });
  });

  describe('#duplicateConnection', function () {
    it('should copy connection and add a copy number at the end', function () {
      const { connectionsStore } = renderCompassConnections({
        connections: mockConnections,
      });

      for (let i = 0; i <= 30; i++) {
        connectionsStore.actions.duplicateConnection(mockConnections[1].id, {
          autoDuplicate: true,
        });
      }

      expect(
        Object.values(connectionsStore.getState().connections.byId).findIndex(
          (connection) => {
            return connection.info.favorite?.name === 'peaches (30)';
          }
        )
      ).to.be.gte(0);
    });

    it('should create a name if there is none', async function () {
      const { connectionsStore } = renderCompassConnections({
        connections: [
          {
            id: '123',
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
            favorite: {
              name: '',
              color: 'color2',
            },
            savedConnectionType: 'recent' as const,
          },
        ],
      });

      connectionsStore.actions.duplicateConnection('123', {
        autoDuplicate: true,
      });

      await waitFor(() => {
        expect(
          Object.values(connectionsStore.getState().connections.byId).find(
            (connection) => {
              return connection.info.favorite?.name === 'localhost:27017 (1)';
            }
          )
        ).to.exist.and.to.have.nested.property('info.favorite.color', 'color2');
      });
    });

    it('should only look for copy number at the end of the connection name', async function () {
      const newConnection = {
        ...createDefaultConnectionInfo(),
        favorite: {
          name: 'peaches (50) peaches',
        },
        savedConnectionType: 'favorite' as const,
      };

      const { connectionsStore } = renderCompassConnections({
        connections: [newConnection],
      });

      connectionsStore.actions.duplicateConnection(newConnection.id, {
        autoDuplicate: true,
      });

      await waitFor(() => {
        expect(
          Object.values(connectionsStore.getState().connections.byId).find(
            (connection) => {
              return (
                connection.info.favorite?.name === 'peaches (50) peaches (1)'
              );
            }
          )
        ).to.exist;
      });
    });
  });
});
