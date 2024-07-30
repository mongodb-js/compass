import { EventEmitter } from 'events';
import { createConnectionAttempt } from 'mongodb-data-service';
import type { Logger } from '@mongodb-js/compass-logging';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { ConnectionOptions } from 'mongodb-data-service';
import type {
  ConnectionAttempt,
  DataService,
  ReauthenticationHandler,
  connect,
} from 'mongodb-data-service';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import { cloneDeep, merge } from 'lodash';
import { adjustConnectionOptionsBeforeConnect } from '@mongodb-js/connection-form';
import mongodbBuildInfo from 'mongodb-build-info';
import { openToast } from '@mongodb-js/compass-components';
import { createCancelError, isCancelError } from '@mongodb-js/compass-utils';

type ConnectFn = typeof connect;
type ConnectionInfoId = ConnectionInfo['id'];

export enum ConnectionsManagerEvents {
  ConnectionAttemptStarted = 'connection-attempt-started',
  ConnectionAttemptCancelled = 'connection-attempt-cancelled',
  ConnectionAttemptSuccessful = 'connection-attempt-successful',
  ConnectionAttemptFailed = 'connection-attempt-failed',
  ConnectionDisconnected = 'connection-disconnected',
}

export type ConnectionManagerEventListeners = {
  [ConnectionsManagerEvents.ConnectionAttemptStarted]: (
    connectionInfoId: ConnectionInfoId
  ) => void;
  [ConnectionsManagerEvents.ConnectionAttemptCancelled]: (
    connectionInfoId: ConnectionInfoId
  ) => void;
  [ConnectionsManagerEvents.ConnectionAttemptSuccessful]: (
    connectionInfoId: ConnectionInfoId,
    dataService: DataService
  ) => void;
  [ConnectionsManagerEvents.ConnectionAttemptFailed]: (
    connectionInfoId: ConnectionInfoId,
    error: any
  ) => void;
  [ConnectionsManagerEvents.ConnectionDisconnected]: (
    connectionInfoId: ConnectionInfoId
  ) => void;
};

export enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Failed = 'failed',
}

type ConnectionStatusTransitions = {
  [event in ConnectionsManagerEvents]?: {
    [status in ConnectionStatus]?: ConnectionStatus;
  };
};

type ConnectionConfiguration = {
  /**
   * Overwrites user-provided connection options with the ones provided here.
   */
  forceConnectionOptions?: [key: string, value: string][];
  /**
   * Command to open the browser for OIDC Auth.
   */
  browserCommandForOIDCAuth?: string;
  /**
   * Function to be called to notify the user that it should check the OIDC device for confirmation.
   * Tipically, the browser.
   */
  onNotifyOIDCDeviceFlow?: OnNotifyOIDCDeviceFlow;
  /**
   * Function to be called every time the secrets change on a connection dataservice. It's only
   * used for OIDC now (like a refresh token) but can be used for any type of authentication that
   * is temporary, like AWS IAM.
   */
  onDatabaseSecretsChange?: OnDatabaseSecretsChangedCallback;
};

const connectionStatusTransitions: ConnectionStatusTransitions = {
  [ConnectionsManagerEvents.ConnectionAttemptStarted]: {
    [ConnectionStatus.Disconnected]: ConnectionStatus.Connecting,
    [ConnectionStatus.Failed]: ConnectionStatus.Connecting,
  },
  [ConnectionsManagerEvents.ConnectionAttemptCancelled]: {
    [ConnectionStatus.Connecting]: ConnectionStatus.Disconnected,
  },
  [ConnectionsManagerEvents.ConnectionAttemptFailed]: {
    [ConnectionStatus.Connecting]: ConnectionStatus.Failed,
  },
  [ConnectionsManagerEvents.ConnectionAttemptSuccessful]: {
    [ConnectionStatus.Connecting]: ConnectionStatus.Connected,
  },
  [ConnectionsManagerEvents.ConnectionDisconnected]: {
    [ConnectionStatus.Connected]: ConnectionStatus.Disconnected,
  },
};

type OnNotifyOIDCDeviceFlow = (deviceFlowInformation: {
  verificationUrl: string;
  userCode: string;
}) => void;

type OnDatabaseSecretsChangedCallback = (
  connectionInfo: ConnectionInfo,
  dataService: DataService
) => void;

export const CONNECTION_CANCELED_ERR = 'Connection attempt was canceled';

export class ConnectionsManager extends EventEmitter {
  private readonly logger: Logger['log']['unbound'];
  private readonly reAuthenticationHandler?: ReauthenticationHandler;
  private readonly __TEST_CONNECT_FN?: ConnectFn;
  private appName: string | undefined;
  private connectionAttempts = new Map<ConnectionInfoId, ConnectionAttempt>();
  private connectionStatuses = new Map<ConnectionInfoId, ConnectionStatus>();
  private dataServices = new Map<ConnectionInfoId, DataService>();
  private oidcState = new Map<ConnectionInfoId, Partial<ConnectionOptions>>();

  constructor({
    appName,
    logger,
    reAuthenticationHandler,
    __TEST_CONNECT_FN,
  }: {
    appName?: string;
    logger: Logger['log']['unbound'];
    reAuthenticationHandler?: ReauthenticationHandler;
    __TEST_CONNECT_FN?: ConnectFn;
  }) {
    super();
    this.appName = appName;
    this.logger = logger;
    this.reAuthenticationHandler = reAuthenticationHandler;
    this.__TEST_CONNECT_FN = __TEST_CONNECT_FN;
  }

  getDataServiceForConnection(connectionInfoId: ConnectionInfoId): DataService {
    const dataService = this.dataServices.get(connectionInfoId);
    if (!dataService) {
      throw new Error(
        `DataService for connectionId - ${connectionInfoId} not present in ConnectionsManager.`
      );
    }
    return dataService;
  }

  statusOf(connectionInfoId: ConnectionInfoId): ConnectionStatus {
    return (
      this.connectionStatuses.get(connectionInfoId) ??
      ConnectionStatus.Disconnected
    );
  }

  getConnectionIdsByStatus(status: ConnectionStatus): ConnectionInfoId[] {
    return [...this.connectionStatuses.entries()]
      .filter(([, connectionStatus]) => connectionStatus === status)
      .map(([connectionId]) => connectionId);
  }

  cancelAllConnectionAttempts(): void {
    for (const connectionInfoId of this.connectionAttempts.keys()) {
      this.cancelConnectionAttempt(connectionInfoId);
    }
  }

  /**
   * @param connectionInfo The adjusted ConnectionInfo object that already has
   * parameters such as appName.
   */
  async connect(
    { id: connectionId, ...originalConnectionInfo }: ConnectionInfo,
    {
      forceConnectionOptions,
      browserCommandForOIDCAuth,
      onNotifyOIDCDeviceFlow,
      onDatabaseSecretsChange,
    }: ConnectionConfiguration = {}
  ): Promise<DataService> {
    try {
      const existingDataService = this.dataServices.get(connectionId);

      if (
        existingDataService &&
        this.statusOf(connectionId) === ConnectionStatus.Connected
      ) {
        return existingDataService;
      }

      this.updateAndNotifyConnectionStatus(
        connectionId,
        ConnectionsManagerEvents.ConnectionAttemptStarted,
        [connectionId]
      );

      const adjustedConnectionInfoForConnection: ConnectionInfo = merge(
        cloneDeep({ id: connectionId, ...originalConnectionInfo }),
        {
          connectionOptions: adjustConnectionOptionsBeforeConnect({
            connectionOptions: merge(
              cloneDeep(originalConnectionInfo.connectionOptions),
              this.oidcState.get(connectionId) ?? {}
            ),
            defaultAppName: this.appName,
            preferences: {
              forceConnectionOptions: forceConnectionOptions ?? [],
              browserCommandForOIDCAuth,
            },
            notifyDeviceFlow: onNotifyOIDCDeviceFlow,
          }),
        }
      );

      const connectionAttempt = createConnectionAttempt({
        logger: this.logger,
        connectFn: this.__TEST_CONNECT_FN,
      });

      this.connectionAttempts.set(connectionId, connectionAttempt);

      // Temporarily disable Atlas Streams connections until https://jira.mongodb.org/browse/STREAMS-862
      // is done.
      if (isAtlasStreamsInstance(adjustedConnectionInfoForConnection)) {
        throw new Error(
          'Atlas Stream Processing is not yet supported on MongoDB Compass. To work with your Stream Processing Instance, connect with mongosh or MongoDB for VS Code.'
        );
      }

      const dataService = await connectionAttempt.connect(
        adjustedConnectionInfoForConnection.connectionOptions
      );

      if (!dataService || connectionAttempt.isClosed()) {
        throw createCancelError(CONNECTION_CANCELED_ERR);
      }

      dataService.on?.('connectionInfoSecretsChanged', () => {
        void dataService.getUpdatedSecrets().then((secrets) => {
          this.oidcState.set(connectionId, secrets);
        });

        onDatabaseSecretsChange?.(
          adjustedConnectionInfoForConnection,
          dataService
        );
      });

      dataService.on?.('oidcAuthFailed', (error) => {
        openToast('oidc-auth-failed', {
          title: 'Failed to authenticate',
          description: error,
          variant: 'important',
        });
      });

      if (this.reAuthenticationHandler) {
        dataService.addReauthenticationHandler(this.reAuthenticationHandler);
      }

      this.dataServices.set(connectionId, dataService);

      this.updateAndNotifyConnectionStatus(
        connectionId,
        ConnectionsManagerEvents.ConnectionAttemptSuccessful,
        [connectionId, dataService]
      );

      return dataService;
    } catch (error) {
      if (isCancelError(error)) {
        this.updateAndNotifyConnectionStatus(
          connectionId,
          ConnectionsManagerEvents.ConnectionAttemptCancelled,
          [connectionId]
        );
      } else {
        this.updateAndNotifyConnectionStatus(
          connectionId,
          ConnectionsManagerEvents.ConnectionAttemptFailed,
          [connectionId, error]
        );
      }
      throw error;
    } finally {
      this.connectionAttempts.delete(connectionId);
    }
  }

  async closeConnection(connectionInfoId: ConnectionInfoId): Promise<void> {
    const currentStatus = this.statusOf(connectionInfoId);
    if (currentStatus === ConnectionStatus.Connecting) {
      this.cancelConnectionAttempt(connectionInfoId);
    } else if (currentStatus === ConnectionStatus.Connected) {
      const dataService = this.dataServices.get(connectionInfoId);
      if (dataService) {
        await dataService.disconnect();
        this.dataServices.delete(connectionInfoId);
      } else {
        this.logger.warn(
          'ConnectionsManager',
          mongoLogId(1_001_000_305),
          'closeConnection',
          `Started closing connection but found no DataService to disconnect`
        );
      }
      this.updateAndNotifyConnectionStatus(
        connectionInfoId,
        ConnectionsManagerEvents.ConnectionDisconnected,
        [connectionInfoId]
      );
      this.oidcState.delete(connectionInfoId);
      this.connectionAttempts.delete(connectionInfoId);
    } else {
      this.logger.warn(
        'ConnectionsManager',
        mongoLogId(1_001_000_304),
        'closeConnection',
        `Attempting to close a connection that is neither being connected to, nor connected but the status is ${currentStatus}`
      );
    }
  }

  /**
   * Try to close all currently existing connections and ignore all errors if
   * they happen during that process. This is a clean-up method that is supposed
   * to be used in cases where there is probably no way for us to react to those
   * errors anyway and all the errors will be already logged elsewhere
   */
  async closeAllConnections(): Promise<void> {
    await Promise.allSettled(
      Array.from(this.connectionStatuses.keys()).map((connectionId) => {
        return this.closeConnection(connectionId);
      })
    );
  }

  /**
   * Returns the number of active connections. We count in-progress connections
   * as "active" to make sure that the maximum connection allowed check takes
   * those into account and doesn't allow to open more connections than allowed
   * by starting too many connections in parallel
   */
  getActiveConnectionsCount(): number {
    return Array.from(this.connectionStatuses.values()).filter((status) => {
      return [ConnectionStatus.Connected, ConnectionStatus.Connecting].includes(
        status
      );
    }).length;
  }

  on<T extends ConnectionsManagerEvents>(
    eventName: T,
    listener: ConnectionManagerEventListeners[T]
  ): this {
    return super.on(eventName, listener);
  }

  off<T extends ConnectionsManagerEvents>(
    eventName: T,
    listener: ConnectionManagerEventListeners[T]
  ): this {
    return super.off(eventName, listener);
  }

  once<T extends ConnectionsManagerEvents>(
    eventName: T,
    listener: ConnectionManagerEventListeners[T]
  ): this {
    return super.once(eventName, listener);
  }

  removeListener<T extends ConnectionsManagerEvents>(
    eventName: T,
    listener: ConnectionManagerEventListeners[T]
  ): this {
    return super.removeListener(eventName, listener);
  }

  emit<T extends ConnectionsManagerEvents>(
    eventName: T,
    ...args: Parameters<ConnectionManagerEventListeners[T]>
  ): boolean {
    return super.emit(eventName, ...args);
  }

  private cancelConnectionAttempt(connectionInfoId: ConnectionInfoId): void {
    const connectionAttempt = this.connectionAttempts.get(connectionInfoId);
    if (connectionAttempt) {
      connectionAttempt.cancelConnectionAttempt();
      this.connectionAttempts.delete(connectionInfoId);
    }
  }

  private updateAndNotifyConnectionStatus<T extends ConnectionsManagerEvents>(
    connectionInfoId: ConnectionInfoId,
    connectionEvent: T,
    connectionEventParams: Parameters<ConnectionManagerEventListeners[T]>
  ) {
    const currentStatus = this.statusOf(connectionInfoId);
    const nextStatus =
      connectionStatusTransitions[connectionEvent]?.[currentStatus];
    if (nextStatus === undefined) {
      throw new Error(
        `Unexpected state for ConnectionInfoId ${connectionInfoId}. Encountered ${connectionEvent} with currentStatus=${currentStatus}`
      );
    }
    this.connectionStatuses.set(connectionInfoId, nextStatus);
    this.emit(connectionEvent, ...connectionEventParams);
  }
}

function isAtlasStreamsInstance(
  adjustedConnectionInfoForConnection: ConnectionInfo
) {
  try {
    return mongodbBuildInfo.isAtlasStream(
      adjustedConnectionInfoForConnection.connectionOptions.connectionString
    );
  } catch {
    // This catch-all is not ideal, but it safe-guards regular connections
    // instead of making assumptions on the fact that the implementation
    // of `mongodbBuildInfo.isAtlasStream` would never throw.
    return false;
  }
}
