import sinon from 'sinon';
import { expect } from 'chai';
import type { DataService, connect } from 'mongodb-data-service';

import {
  ConnectionStatus,
  ConnectionsManager,
  ConnectionsManagerEvents,
} from './connections-manager';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

function getConnectionsManager(mockTestConnectFn?: typeof connect) {
  const { log } = createNoopLoggerAndTelemetry();
  return new ConnectionsManager(log.unbound, () => {}, mockTestConnectFn);
}

describe('ConnectionsManager', function () {
  const connectedDataService1 = {
    id: 1,
    disconnect() {},
    addReauthenticationHandler() {},
  } as unknown as DataService;
  const connectedConnectionInfo1 = {
    id: '1',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };

  const connectedDataService2 = {
    id: 2,
    disconnect() {},
    addReauthenticationHandler() {},
  } as unknown as DataService;
  const connectedConnectionInfo2 = {
    id: '2',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27018',
    },
  };
  let connectionsManager: ConnectionsManager;
  let mockConnectFn: typeof connect;

  beforeEach(function () {
    mockConnectFn = ({ connectionOptions }) => {
      if (
        connectionOptions.connectionString ===
        connectedConnectionInfo1.connectionOptions.connectionString
      ) {
        return Promise.resolve(connectedDataService1);
      } else {
        return Promise.resolve(connectedDataService2);
      }
    };
    connectionsManager = getConnectionsManager(mockConnectFn);
  });

  context(
    'when connecting to multiple connections simultaneously',
    function () {
      beforeEach(function () {
        const originalMockFn = mockConnectFn;
        mockConnectFn = async (connectionInfo) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return await originalMockFn(connectionInfo);
        };
        connectionsManager = getConnectionsManager(mockConnectFn);
      });

      it('should emit connection-attempt-started event', async function () {
        const onConnectionStarted = sinon.stub();
        connectionsManager.on(
          ConnectionsManagerEvents.ConnectionAttemptStarted,
          onConnectionStarted
        );

        await Promise.all([
          connectionsManager.connect(connectedConnectionInfo1),
          connectionsManager.connect(connectedConnectionInfo2),
        ]);

        expect(onConnectionStarted).to.be.calledTwice;
        expect(onConnectionStarted.getCall(0).args).to.deep.equal([
          connectedConnectionInfo1.id,
        ]);
        expect(onConnectionStarted.getCall(1).args).to.deep.equal([
          connectedConnectionInfo2.id,
        ]);
      });

      it('#statusOf should return connecting', function () {
        void Promise.all([
          connectionsManager.connect(connectedConnectionInfo1),
          connectionsManager.connect(connectedConnectionInfo2),
        ]);
        expect(
          connectionsManager.statusOf(connectedConnectionInfo1.id)
        ).to.equal(ConnectionStatus.Connecting);
        expect(
          connectionsManager.statusOf(connectedConnectionInfo2.id)
        ).to.equal(ConnectionStatus.Connecting);
      });

      it('#getDataServiceForConnection should not return anything for connecting connection', function () {
        void Promise.all([
          connectionsManager.connect(connectedConnectionInfo1),
          connectionsManager.connect(connectedConnectionInfo2),
        ]);
        expect(
          connectionsManager.getDataServiceForConnection(
            connectedConnectionInfo1.id
          )
        ).to.be.undefined;
        expect(
          connectionsManager.getDataServiceForConnection(
            connectedConnectionInfo2.id
          )
        ).to.be.undefined;
      });

      context('when all connection attempts are cancelled', function () {
        it('should emit connection-attempt-cancelled for all attempted connections', function () {
          const onConnectionAttemptCancelled = sinon.stub();
          connectionsManager.on(
            ConnectionsManagerEvents.ConnectionAttemptCancelled,
            onConnectionAttemptCancelled
          );
          void Promise.all([
            connectionsManager.connect(connectedConnectionInfo1),
            connectionsManager.connect(connectedConnectionInfo2),
          ]);
          connectionsManager.cancelAllConnectionAttempts();
          expect(onConnectionAttemptCancelled).to.be.calledTwice;
          expect(onConnectionAttemptCancelled.getCall(0).args).to.deep.equal([
            connectedConnectionInfo1.id,
          ]);
          expect(onConnectionAttemptCancelled.getCall(1).args).to.deep.equal([
            connectedConnectionInfo2.id,
          ]);
        });

        it('#statusOf should return disconnected', function () {
          void Promise.all([
            connectionsManager.connect(connectedConnectionInfo1),
            connectionsManager.connect(connectedConnectionInfo2),
          ]);
          connectionsManager.cancelAllConnectionAttempts();
          expect(
            connectionsManager.statusOf(connectedConnectionInfo1.id)
          ).to.equal(ConnectionStatus.Disconnected);
          expect(
            connectionsManager.statusOf(connectedConnectionInfo2.id)
          ).to.equal(ConnectionStatus.Disconnected);
        });

        it('#getDataServiceForConnection should not return anything for connecting connection', function () {
          void Promise.all([
            connectionsManager.connect(connectedConnectionInfo1),
            connectionsManager.connect(connectedConnectionInfo2),
          ]);
          connectionsManager.cancelAllConnectionAttempts();
          expect(
            connectionsManager.getDataServiceForConnection(
              connectedConnectionInfo1.id
            )
          ).to.be.undefined;
          expect(
            connectionsManager.getDataServiceForConnection(
              connectedConnectionInfo2.id
            )
          ).to.be.undefined;
        });
      });
    }
  );

  context('when a connection attempt is cancelled', function () {
    it('should emit connection attempt cancelled event', function () {
      const onConnectionCancelled = sinon.stub();
      connectionsManager.on(
        ConnectionsManagerEvents.ConnectionAttemptCancelled,
        onConnectionCancelled
      );

      void connectionsManager.connect(connectedConnectionInfo1);
      void connectionsManager.closeConnection(connectedConnectionInfo1.id);
      expect(onConnectionCancelled).to.be.calledWithExactly(
        connectedConnectionInfo1.id
      );
    });

    it('#statusOf should return ConnectionStatus.Disconnected', function () {
      void connectionsManager.connect(connectedConnectionInfo1);
      void connectionsManager.closeConnection(connectedConnectionInfo1.id);
      expect(connectionsManager.statusOf(connectedConnectionInfo1.id)).to.equal(
        ConnectionStatus.Disconnected
      );
    });

    it('#getDataServiceForConnection should not return anything for cancelled connection attempt', function () {
      void connectionsManager.connect(connectedConnectionInfo1);
      void connectionsManager.closeConnection(connectedConnectionInfo1.id);
      expect(
        connectionsManager.getDataServiceForConnection(
          connectedConnectionInfo1.id
        )
      ).to.be.undefined;
    });

    context(
      'when attempting to connect to a cancelled connection',
      function () {
        it('should be able to connect', async function () {
          mockConnectFn = () => Promise.resolve(connectedDataService1);
          connectionsManager = getConnectionsManager(mockConnectFn);

          const onConnectionCancelled = sinon.stub();
          connectionsManager.on(
            ConnectionsManagerEvents.ConnectionAttemptCancelled,
            onConnectionCancelled
          );

          void connectionsManager.connect(connectedConnectionInfo1);
          await connectionsManager.closeConnection(connectedConnectionInfo1.id);
          expect(onConnectionCancelled).to.be.calledWithExactly(
            connectedConnectionInfo1.id
          );
          expect(
            connectionsManager.statusOf(connectedConnectionInfo1.id)
          ).to.equal(ConnectionStatus.Disconnected);

          await connectionsManager.connect(connectedConnectionInfo1);
          expect(
            connectionsManager.statusOf(connectedConnectionInfo1.id)
          ).to.equal(ConnectionStatus.Connected);
        });
      }
    );
  });

  context(
    'when connected successfully to multiple connections simultaneously',
    function () {
      it('should emit connection successful event for each connected connection', async function () {
        const onSuccessfulConnections = sinon.stub();
        connectionsManager.on(
          ConnectionsManagerEvents.ConnectionAttemptSuccessful,
          onSuccessfulConnections
        );

        await Promise.all([
          connectionsManager.connect(connectedConnectionInfo1),
          connectionsManager.connect(connectedConnectionInfo2),
        ]);
        expect(onSuccessfulConnections).to.be.calledTwice;
        expect(onSuccessfulConnections.getCall(0).args).to.deep.equal([
          connectedConnectionInfo1.id,
          connectedDataService1,
        ]);
        expect(onSuccessfulConnections.getCall(1).args).to.deep.equal([
          connectedConnectionInfo2.id,
          connectedDataService2,
        ]);
      });

      it('#statusOf should return ConnectionStatus.Connected', async function () {
        await Promise.all([
          connectionsManager.connect(connectedConnectionInfo1),
          connectionsManager.connect(connectedConnectionInfo2),
        ]);
        expect(
          connectionsManager.statusOf(connectedConnectionInfo1.id)
        ).to.equal(ConnectionStatus.Connected);
        expect(
          connectionsManager.statusOf(connectedConnectionInfo2.id)
        ).to.equal(ConnectionStatus.Connected);
      });

      it('#getDataServiceForConnection should be able to return connected dataService', async function () {
        await Promise.all([
          connectionsManager.connect(connectedConnectionInfo1),
          connectionsManager.connect(connectedConnectionInfo2),
        ]);
        expect(
          connectionsManager.getDataServiceForConnection(
            connectedConnectionInfo1.id
          )
        ).to.deep.equal(connectedDataService1);
        expect(
          connectionsManager.getDataServiceForConnection(
            connectedConnectionInfo2.id
          )
        ).to.deep.equal(connectedDataService2);
      });
    }
  );

  context('when a connection fails to connect', function () {
    const failedConnectionInfo = {
      id: '3',
      connectionOptions: {
        connectionString: 'mongodb://localhost:2',
      },
    };
    const error = new Error('Connection rejected');
    beforeEach(function () {
      mockConnectFn = () => Promise.reject(error);
      connectionsManager = getConnectionsManager(mockConnectFn);
    });

    it('should emit connection failed event for the failed connection', async function () {
      const onConnectionFailed = sinon.stub();
      connectionsManager.on(
        ConnectionsManagerEvents.ConnectionAttemptFailed,
        onConnectionFailed
      );

      try {
        await connectionsManager.connect(failedConnectionInfo);
      } catch (error) {
        expect(error.message).to.equal('Connection rejected');
        expect(onConnectionFailed).to.be.calledWithExactly(
          failedConnectionInfo.id,
          error
        );
      }
    });

    it('#statusOf should return ConnectionStatus.Failed', async function () {
      try {
        await connectionsManager.connect(failedConnectionInfo);
      } catch (error) {
        // nothing
      }
      expect(connectionsManager.statusOf(failedConnectionInfo.id)).to.equal(
        ConnectionStatus.Failed
      );
    });

    it('#getDataServiceForConnection should not return anything for failed connection', async function () {
      try {
        await connectionsManager.connect(failedConnectionInfo);
      } catch (error) {
        // nothing
      }
      expect(
        connectionsManager.getDataServiceForConnection(failedConnectionInfo.id)
      ).to.be.undefined;
    });
  });

  context('when an active connection is disconnected', function () {
    const activeConnectionInfo = {
      id: '4',
      connectionOptions: {
        connectionString: 'mongodb://localhost:27019',
      },
    };
    const activeDataService = {
      id: '4',
      disconnect() {},
      addReauthenticationHandler() {},
    } as unknown as DataService;
    beforeEach(function () {
      mockConnectFn = () => Promise.resolve(activeDataService);
      connectionsManager = getConnectionsManager(mockConnectFn);
    });

    it('should emit connection disconnected event', async function () {
      const onConnectionDisconnected = sinon.stub();
      connectionsManager.on(
        ConnectionsManagerEvents.ConnectionDisconnected,
        onConnectionDisconnected
      );

      await connectionsManager.connect(activeConnectionInfo);
      expect(connectionsManager.statusOf(activeConnectionInfo.id)).to.equal(
        ConnectionStatus.Connected
      );

      await connectionsManager.closeConnection(activeConnectionInfo.id);
      expect(onConnectionDisconnected).to.be.calledWithExactly(
        activeConnectionInfo.id
      );
    });

    it('#statusOf should return ConnectionStatus.Disconnected', async function () {
      await connectionsManager.connect(activeConnectionInfo);
      expect(connectionsManager.statusOf(activeConnectionInfo.id)).to.equal(
        ConnectionStatus.Connected
      );

      await connectionsManager.closeConnection(activeConnectionInfo.id);
      expect(connectionsManager.statusOf(activeConnectionInfo.id)).to.equal(
        ConnectionStatus.Disconnected
      );
    });

    it('#getDataServiceForConnection should not return anything for disconnected connection', async function () {
      await connectionsManager.connect(activeConnectionInfo);
      await connectionsManager.closeConnection(activeConnectionInfo.id);
      expect(
        connectionsManager.getDataServiceForConnection(activeConnectionInfo.id)
      ).to.be.undefined;
    });
  });
});
