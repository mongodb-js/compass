import sinon from 'sinon';
import { expect } from 'chai';
import type { DataService, connect } from 'mongodb-data-service';
import EventEmitter from 'events';

import {
  ConnectionStatus,
  ConnectionsManager,
  ConnectionsManagerEvents,
} from './connections-manager';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

function getConnectionsManager(mockTestConnectFn?: typeof connect) {
  const { log } = createNoopLogger();
  return new ConnectionsManager({
    logger: log.unbound,
    __TEST_CONNECT_FN: mockTestConnectFn,
  });
}

function canceledPromiseSetup(
  connectionsToBeConnected: ConnectionInfo[],
  mockTestConnectFn: typeof connect
) {
  let resolveCanceledPromise;
  const canceledPromise = new Promise((resolve) => {
    resolveCanceledPromise = resolve;
  });

  const connectionsManager = getConnectionsManager(mockTestConnectFn);

  const originalConnectFn: typeof connectionsManager.connect =
    connectionsManager.connect.bind(connectionsManager);
  let failures = 0;
  sinon.stub(connectionsManager, 'connect').callsFake((info, options) => {
    return originalConnectFn(info, options).finally(() => {
      if (++failures === connectionsToBeConnected.length) {
        resolveCanceledPromise();
      }
    });
  });

  return {
    canceledPromise,
    connectionsManager,
  };
}

describe('ConnectionsManager', function () {
  const mockDataService = (id: number) => {
    const eventEmitter = new EventEmitter();
    return {
      id,
      disconnect() {},
      addReauthenticationHandler() {},
      getUpdatedSecrets() {
        return Promise.resolve(id);
      },
      emit: eventEmitter.emit.bind(eventEmitter),
      on: eventEmitter.on.bind(eventEmitter),
    } as unknown as DataService;
  };

  const connectedDataService1 = mockDataService(1);
  const connectedConnectionInfo1 = {
    id: '1',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };

  const connectedDataService2 = mockDataService(2);
  const connectedConnectionInfo2 = {
    id: '2',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27018',
    },
  };
  let connectionsManager: ConnectionsManager;
  let mockConnectFn: typeof connect;

  const forceConnectionOptions = [];
  const browserCommandForOIDCAuth = undefined;
  let onDatabaseSecretsChangeSpy = sinon.spy();

  function getConnectionConfigurationOptions({
    onNotifyOIDCDeviceFlow,
    onDatabaseSecretsChange,
  }: {
    onNotifyOIDCDeviceFlow?: ReturnType<typeof sinon.spy>;
    onDatabaseSecretsChange?: ReturnType<typeof sinon.spy>;
  } = {}) {
    return {
      forceConnectionOptions,
      browserCommandForOIDCAuth,
      onNotifyOIDCDeviceFlow,
      onDatabaseSecretsChange,
    };
  }

  beforeEach(function () {
    onDatabaseSecretsChangeSpy = sinon.spy();

    mockConnectFn = sinon.stub().callsFake(({ connectionOptions }) => {
      if (
        connectionOptions.connectionString.startsWith(
          connectedConnectionInfo1.connectionOptions.connectionString
        )
      ) {
        return Promise.resolve(connectedDataService1);
      } else {
        return Promise.resolve(connectedDataService2);
      }
    });
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
          connectionsManager.connect(
            connectedConnectionInfo1,
            getConnectionConfigurationOptions()
          ),
          connectionsManager.connect(
            connectedConnectionInfo2,
            getConnectionConfigurationOptions()
          ),
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
          connectionsManager.connect(
            connectedConnectionInfo1,
            getConnectionConfigurationOptions()
          ),
          connectionsManager.connect(
            connectedConnectionInfo2,
            getConnectionConfigurationOptions()
          ),
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
          connectionsManager.connect(
            connectedConnectionInfo1,
            getConnectionConfigurationOptions()
          ),
          connectionsManager.connect(
            connectedConnectionInfo2,
            getConnectionConfigurationOptions()
          ),
        ]);
        expect(() =>
          connectionsManager.getDataServiceForConnection(
            connectedConnectionInfo1.id
          )
        ).to.throw;
        expect(() =>
          connectionsManager.getDataServiceForConnection(
            connectedConnectionInfo2.id
          )
        ).to.throw;
      });

      context('when all connection attempts are cancelled', function () {
        let canceledPromise;
        beforeEach(function () {
          const connectionsToBeConnected = [
            connectedConnectionInfo1,
            connectedConnectionInfo2,
          ];
          const {
            canceledPromise: setupCanceledPromise,
            connectionsManager: setupConnectionsManager,
          } = canceledPromiseSetup(connectionsToBeConnected, mockConnectFn);
          canceledPromise = setupCanceledPromise;
          connectionsManager = setupConnectionsManager;
        });

        it('should emit connection-attempt-cancelled for all attempted connections', async function () {
          const onConnectionAttemptCancelled = sinon.stub();
          connectionsManager.on(
            ConnectionsManagerEvents.ConnectionAttemptCancelled,
            onConnectionAttemptCancelled
          );
          void Promise.all([
            connectionsManager.connect(
              connectedConnectionInfo1,
              getConnectionConfigurationOptions()
            ),
            connectionsManager.connect(
              connectedConnectionInfo2,
              getConnectionConfigurationOptions()
            ),
          ]).catch(() => {
            // noop
          });
          connectionsManager.cancelAllConnectionAttempts();
          await canceledPromise;
          expect(onConnectionAttemptCancelled).to.be.calledTwice;
          expect(onConnectionAttemptCancelled.getCall(0).args).to.deep.equal([
            connectedConnectionInfo1.id,
          ]);
          expect(onConnectionAttemptCancelled.getCall(1).args).to.deep.equal([
            connectedConnectionInfo2.id,
          ]);
        });

        it('#statusOf should return disconnected', async function () {
          void Promise.all([
            connectionsManager.connect(
              connectedConnectionInfo1,
              getConnectionConfigurationOptions()
            ),
            connectionsManager.connect(
              connectedConnectionInfo2,
              getConnectionConfigurationOptions()
            ),
          ]).catch(() => {
            // noop
          });
          connectionsManager.cancelAllConnectionAttempts();
          await canceledPromise;
          expect(
            connectionsManager.statusOf(connectedConnectionInfo1.id)
          ).to.equal(ConnectionStatus.Disconnected);
          expect(
            connectionsManager.statusOf(connectedConnectionInfo2.id)
          ).to.equal(ConnectionStatus.Disconnected);
        });

        it('#getDataServiceForConnection should not return anything for canceled connections', async function () {
          void Promise.all([
            connectionsManager.connect(
              connectedConnectionInfo1,
              getConnectionConfigurationOptions()
            ),
            connectionsManager.connect(
              connectedConnectionInfo2,
              getConnectionConfigurationOptions()
            ),
          ]).catch(() => {
            // noop
          });
          connectionsManager.cancelAllConnectionAttempts();
          await canceledPromise;
          expect(() =>
            connectionsManager.getDataServiceForConnection(
              connectedConnectionInfo1.id
            )
          ).to.throw;
          expect(() =>
            connectionsManager.getDataServiceForConnection(
              connectedConnectionInfo2.id
            )
          ).to.throw;
        });
      });
    }
  );

  context('when connecting to Atlas Streams', function () {
    beforeEach(function () {
      connectionsManager = getConnectionsManager(mockConnectFn);
    });

    it('should throw an error', async function () {
      const maybeError = await connectionsManager
        .connect(
          {
            id: '1',
            connectionOptions: {
              connectionString:
                'mongodb://atlas-stream-example.mongodb.net/?tls=true',
            },
          },
          getConnectionConfigurationOptions()
        )
        .catch((error) => error);

      expect(maybeError.message).to.equal(
        'Atlas Stream Processing is not yet supported on MongoDB Compass. To work with your Stream Processing Instance, connect with mongosh or MongoDB for VS Code.'
      );
    });
  });

  context('when a connection attempt is cancelled', function () {
    let canceledPromise;
    beforeEach(function () {
      const connectionsToBeConnected = [connectedConnectionInfo1];
      const {
        canceledPromise: setupCanceledPromise,
        connectionsManager: setupConnectionsManager,
      } = canceledPromiseSetup(connectionsToBeConnected, mockConnectFn);
      canceledPromise = setupCanceledPromise;
      connectionsManager = setupConnectionsManager;
    });
    it('should emit connection attempt cancelled event', async function () {
      const onConnectionCancelled = sinon.stub();
      connectionsManager.on(
        ConnectionsManagerEvents.ConnectionAttemptCancelled,
        onConnectionCancelled
      );

      void connectionsManager
        .connect(connectedConnectionInfo1, getConnectionConfigurationOptions())
        .catch(() => {
          //
        });
      void connectionsManager.closeConnection(connectedConnectionInfo1.id);
      await canceledPromise;
      expect(onConnectionCancelled).to.be.calledWithExactly(
        connectedConnectionInfo1.id
      );
    });

    it('#statusOf should return ConnectionStatus.Disconnected', async function () {
      void connectionsManager
        .connect(connectedConnectionInfo1, getConnectionConfigurationOptions())
        .catch(() => {
          //
        });
      void connectionsManager.closeConnection(connectedConnectionInfo1.id);
      await canceledPromise;
      expect(connectionsManager.statusOf(connectedConnectionInfo1.id)).to.equal(
        ConnectionStatus.Disconnected
      );
    });

    it('#getDataServiceForConnection should not return anything for cancelled connection attempt', async function () {
      void connectionsManager
        .connect(connectedConnectionInfo1, getConnectionConfigurationOptions())
        .catch(() => {
          //
        });
      void connectionsManager.closeConnection(connectedConnectionInfo1.id);
      await canceledPromise;
      expect(() =>
        connectionsManager.getDataServiceForConnection(
          connectedConnectionInfo1.id
        )
      ).to.throw;
    });

    context(
      'when attempting to connect to a cancelled connection',
      function () {
        let canceledPromise;
        beforeEach(function () {
          const connectionsToBeConnected = [connectedConnectionInfo1];
          const {
            canceledPromise: setupCanceledPromise,
            connectionsManager: setupConnectionsManager,
          } = canceledPromiseSetup(connectionsToBeConnected, () =>
            Promise.resolve(connectedDataService1)
          );
          canceledPromise = setupCanceledPromise;
          connectionsManager = setupConnectionsManager;
        });

        it('should be able to connect', async function () {
          const onConnectionCancelled = sinon.stub();
          connectionsManager.on(
            ConnectionsManagerEvents.ConnectionAttemptCancelled,
            onConnectionCancelled
          );

          void connectionsManager
            .connect(
              connectedConnectionInfo1,
              getConnectionConfigurationOptions()
            )
            .catch(() => {
              //
            });
          await connectionsManager.closeConnection(connectedConnectionInfo1.id);
          await canceledPromise;
          expect(onConnectionCancelled).to.be.calledWithExactly(
            connectedConnectionInfo1.id
          );
          expect(
            connectionsManager.statusOf(connectedConnectionInfo1.id)
          ).to.equal(ConnectionStatus.Disconnected);

          await connectionsManager.connect(
            connectedConnectionInfo1,
            getConnectionConfigurationOptions()
          );
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
          connectionsManager.connect(
            connectedConnectionInfo1,
            getConnectionConfigurationOptions()
          ),
          connectionsManager.connect(
            connectedConnectionInfo2,
            getConnectionConfigurationOptions()
          ),
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
          connectionsManager.connect(
            connectedConnectionInfo1,
            getConnectionConfigurationOptions()
          ),
          connectionsManager.connect(
            connectedConnectionInfo2,
            getConnectionConfigurationOptions()
          ),
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
          connectionsManager.connect(
            connectedConnectionInfo1,
            getConnectionConfigurationOptions()
          ),
          connectionsManager.connect(
            connectedConnectionInfo2,
            getConnectionConfigurationOptions()
          ),
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

      it('should return the connected DataService for an already connected connection', async function () {
        await connectionsManager.connect(
          connectedConnectionInfo1,
          getConnectionConfigurationOptions()
        );
        await connectionsManager.connect(
          connectedConnectionInfo1,
          getConnectionConfigurationOptions()
        );
        expect(mockConnectFn).to.be.calledOnce;
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
        await connectionsManager.connect(
          failedConnectionInfo,
          getConnectionConfigurationOptions()
        );
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
        await connectionsManager.connect(
          failedConnectionInfo,
          getConnectionConfigurationOptions()
        );
      } catch (error) {
        // nothing
      }
      expect(connectionsManager.statusOf(failedConnectionInfo.id)).to.equal(
        ConnectionStatus.Failed
      );
    });

    it('#getDataServiceForConnection should not return anything for failed connection', async function () {
      try {
        await connectionsManager.connect(
          failedConnectionInfo,
          getConnectionConfigurationOptions()
        );
      } catch (error) {
        // nothing
      }
      expect(() =>
        connectionsManager.getDataServiceForConnection(failedConnectionInfo.id)
      ).to.throw;
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

      await connectionsManager.connect(
        activeConnectionInfo,
        getConnectionConfigurationOptions()
      );
      expect(connectionsManager.statusOf(activeConnectionInfo.id)).to.equal(
        ConnectionStatus.Connected
      );

      await connectionsManager.closeConnection(activeConnectionInfo.id);
      expect(onConnectionDisconnected).to.be.calledWithExactly(
        activeConnectionInfo.id
      );
    });

    it('#statusOf should return ConnectionStatus.Disconnected', async function () {
      await connectionsManager.connect(
        activeConnectionInfo,
        getConnectionConfigurationOptions()
      );
      expect(connectionsManager.statusOf(activeConnectionInfo.id)).to.equal(
        ConnectionStatus.Connected
      );

      await connectionsManager.closeConnection(activeConnectionInfo.id);
      expect(connectionsManager.statusOf(activeConnectionInfo.id)).to.equal(
        ConnectionStatus.Disconnected
      );
    });

    it('#getDataServiceForConnection should not return anything for disconnected connection', async function () {
      await connectionsManager.connect(
        activeConnectionInfo,
        getConnectionConfigurationOptions()
      );
      await connectionsManager.closeConnection(activeConnectionInfo.id);
      expect(() =>
        connectionsManager.getDataServiceForConnection(activeConnectionInfo.id)
      ).to.throw;
    });
  });

  context('oidc connection', function () {
    it('should notify the onDatabaseSecretsChange when dataservice secrets change', async function () {
      const oidcConnectionInfo = {
        connectionOptions: {
          connectionString: `${connectedConnectionInfo1.connectionOptions.connectionString}&authMechanism=MONGODB-OIDC`,
          oidc: {},
        },
        ...connectedConnectionInfo1,
      };

      await connectionsManager.connect(
        oidcConnectionInfo,
        getConnectionConfigurationOptions({
          onDatabaseSecretsChange: onDatabaseSecretsChangeSpy,
        })
      );

      connectedDataService1.emit('connectionInfoSecretsChanged');

      expect(onDatabaseSecretsChangeSpy).to.have.been.calledWith(
        {
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017/',
            oidc: {},
          },
          id: '1',
        },
        connectedDataService1
      );
    });

    it('should merge any oidc state from previous connections', async function () {
      const previousOidcState = {
        oidc: {
          mockState: true,
        },
      };

      const inspectableConnectionsManager = connectionsManager as any;
      inspectableConnectionsManager.oidcState.set(
        connectedConnectionInfo1.id,
        previousOidcState
      );

      const oidcConnectionInfo = {
        connectionOptions: {
          connectionString: `${connectedConnectionInfo1.connectionOptions.connectionString}&authMechanism=MONGODB-OIDC`,
        },
        ...connectedConnectionInfo1,
      };

      await connectionsManager.connect(
        oidcConnectionInfo,
        getConnectionConfigurationOptions()
      );

      const connectionInfo = mockConnectFn.getCall(0).args[0];
      expect(connectionInfo.connectionOptions).to.deep.equal({
        connectionString: 'mongodb://localhost:27017/',
        oidc: {
          mockState: true,
        },
      });
    });
  });
});
