import { EventEmitter } from 'events';
import { createConnectionAttempt } from 'mongodb-data-service';

import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type {
  ConnectionAttempt,
  DataService,
  ReauthenticationHandler,
  connect,
} from 'mongodb-data-service';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';

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

export const CONNECTION_CANCELED_ERR = 'Connection attempt was canceled';

export class ConnectionsManager extends EventEmitter {
  private readonly logger: LoggerAndTelemetry['log']['unbound'];
  private readonly reAuthenticationHandler?: ReauthenticationHandler;
  private readonly __TEST_CONNECT_FN?: ConnectFn;
  private connectionAttempts = new Map<ConnectionInfoId, ConnectionAttempt>();
  private connectionStatuses = new Map<ConnectionInfoId, ConnectionStatus>();
  private dataServices = new Map<ConnectionInfoId, DataService>();

  constructor({
    logger,
    reAuthenticationHandler,
    __TEST_CONNECT_FN,
  }: {
    logger: LoggerAndTelemetry['log']['unbound'];
    reAuthenticationHandler?: ReauthenticationHandler;
    __TEST_CONNECT_FN?: ConnectFn;
  }) {
    super();
    this.logger = logger;
    this.reAuthenticationHandler = reAuthenticationHandler;
    this.__TEST_CONNECT_FN = __TEST_CONNECT_FN;
  }

  getDataServiceForConnection(
    connectionInfoId: ConnectionInfoId
  ): DataService | undefined {
    return this.dataServices.get(connectionInfoId);
  }

  statusOf(connectionInfoId: ConnectionInfoId): ConnectionStatus {
    return (
      this.connectionStatuses.get(connectionInfoId) ??
      ConnectionStatus.Disconnected
    );
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
  async connect(connectionInfo: ConnectionInfo): Promise<DataService> {
    try {
      const existingDataService = this.getDataServiceForConnection(
        connectionInfo.id
      );
      if (
        existingDataService &&
        this.statusOf(connectionInfo.id) === ConnectionStatus.Connected
      ) {
        return existingDataService;
      }

      this.updateAndNotifyConnectionStatus(
        connectionInfo.id,
        ConnectionsManagerEvents.ConnectionAttemptStarted,
        [connectionInfo.id]
      );
      const connectionAttempt = createConnectionAttempt({
        logger: this.logger,
        connectFn: this.__TEST_CONNECT_FN,
      });
      this.connectionAttempts.set(connectionInfo.id, connectionAttempt);

      const dataService = await connectionAttempt.connect(
        connectionInfo.connectionOptions
      );

      if (!dataService || connectionAttempt.isClosed()) {
        throw new Error(CONNECTION_CANCELED_ERR);
      }

      if (this.reAuthenticationHandler) {
        dataService.addReauthenticationHandler(this.reAuthenticationHandler);
      }

      this.connectionAttempts.delete(connectionInfo.id);
      this.dataServices.set(connectionInfo.id, dataService);
      this.updateAndNotifyConnectionStatus(
        connectionInfo.id,
        ConnectionsManagerEvents.ConnectionAttemptSuccessful,
        [connectionInfo.id, dataService]
      );
      return dataService;
    } catch (error) {
      if ((error as Error).message === CONNECTION_CANCELED_ERR) {
        this.updateAndNotifyConnectionStatus(
          connectionInfo.id,
          ConnectionsManagerEvents.ConnectionAttemptCancelled,
          [connectionInfo.id]
        );
      } else {
        this.updateAndNotifyConnectionStatus(
          connectionInfo.id,
          ConnectionsManagerEvents.ConnectionAttemptFailed,
          [connectionInfo.id, error]
        );
      }
      throw error;
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
    } else {
      this.logger.warn(
        'ConnectionsManager',
        mongoLogId(1_001_000_304),
        'closeConnection',
        `Attempting to close a connection that is neither being connected to, nor connected but the status is ${currentStatus}`
      );
    }
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
