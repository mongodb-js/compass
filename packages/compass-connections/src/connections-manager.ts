import { EventEmitter } from 'events';
import { createConnectionAttempt } from 'mongodb-data-service';

import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type {
  ConnectionAttempt,
  DataService,
  connect,
} from 'mongodb-data-service';

type ConnectFn = typeof connect;
type ConnectionInfoId = ConnectionInfo['id'];

export enum ConnectionsManagerEvents {
  ConnectionAttemptStarted = 'connection-attempt-started',
  ConnectionAttemptCancelled = 'connection-attempt-cancelled',
  ConnectionAttemptSuccessful = 'connection-attempt-successful',
  ConnectionAttemptFailed = 'connection-attempt-failed',
  ConnectionDisconnected = 'connection-disconnected',
}

type ConnectionManagerEventListeners = {
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

export class ConnectionsManager extends EventEmitter {
  private connectionAttempts = new Map<ConnectionInfoId, ConnectionAttempt>();
  private connectionStatuses = new Map<ConnectionInfoId, ConnectionStatus>();
  private dataServices = new Map<ConnectionInfoId, DataService>();

  constructor(
    private readonly __TEST_CONNECT_FN?: ConnectFn,
    private readonly logger?: LoggerAndTelemetry['log']['unbound']
  ) {
    super();
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
  async connect(connectionInfo: ConnectionInfo): Promise<void> {
    try {
      if (
        [ConnectionStatus.Connecting, ConnectionStatus.Connected].includes(
          this.statusOf(connectionInfo.id)
        )
      ) {
        return;
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
        return;
      }

      this.connectionAttempts.delete(connectionInfo.id);
      this.dataServices.set(connectionInfo.id, dataService);
      this.updateAndNotifyConnectionStatus(
        connectionInfo.id,
        ConnectionsManagerEvents.ConnectionAttemptSuccessful,
        [connectionInfo.id, dataService]
      );
    } catch (error) {
      this.updateAndNotifyConnectionStatus(
        connectionInfo.id,
        ConnectionsManagerEvents.ConnectionAttemptFailed,
        [connectionInfo.id, error]
      );
      throw error;
    }
  }

  async closeConnection(connectionInfoId: ConnectionInfoId): Promise<void> {
    if (this.statusOf(connectionInfoId) === ConnectionStatus.Connecting) {
      this.cancelConnectionAttempt(connectionInfoId);
    } else if (this.statusOf(connectionInfoId) === ConnectionStatus.Connected) {
      const dataService = this.dataServices.get(connectionInfoId);
      if (dataService) {
        await dataService.disconnect();
        this.dataServices.delete(connectionInfoId);
        this.updateAndNotifyConnectionStatus(
          connectionInfoId,
          ConnectionsManagerEvents.ConnectionDisconnected,
          [connectionInfoId]
        );
      }
    } else {
      throw new Error(
        'Attempting to close a connection that is neither being connected to, nor connected'
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
      this.updateAndNotifyConnectionStatus(
        connectionInfoId,
        ConnectionsManagerEvents.ConnectionAttemptCancelled,
        [connectionInfoId]
      );
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
