import { EventEmitter } from 'events';
import ensureError from 'ensure-error';
import { createConnectionAttempt } from 'mongodb-data-service';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

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
    error: Error
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

const { log } = createLoggerAndTelemetry('CONNECTIONS-MANAGER');

export class ConnectionsManager extends EventEmitter {
  private connectionAttempts = new Map<ConnectionInfoId, ConnectionAttempt>();
  private connectionStatuses = new Map<ConnectionInfoId, ConnectionStatus>();
  private dataServices = new Map<ConnectionInfoId, DataService>();

  constructor(private readonly __TEST_CONNECT_FN?: ConnectFn) {
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

  cancelAllConnectionAttempt(): void {
    for (const connectionInfoId of this.connectionAttempts.keys()) {
      this.cancelConnectionAttempt(connectionInfoId);
    }
  }

  cancelConnectionAttempt(connectionInfoId: ConnectionInfoId): void {
    const connectionAttempt = this.connectionAttempts.get(connectionInfoId);
    connectionAttempt?.cancelConnectionAttempt();
    this.connectionAttempts.delete(connectionInfoId);
    this.notifyConnectionAttemptCancelled(connectionInfoId);
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

      const connectionAttempt = createConnectionAttempt({
        logger: log.unbound,
        connectFn: this.__TEST_CONNECT_FN,
      });
      this.connectionAttempts.set(connectionInfo.id, connectionAttempt);

      this.notifyConnectionAttemptStarted(connectionInfo.id);
      const dataService = await connectionAttempt.connect(
        connectionInfo.connectionOptions
      );

      if (!dataService || connectionAttempt.isClosed()) {
        return;
      }

      this.connectionAttempts.delete(connectionInfo.id);
      this.dataServices.set(connectionInfo.id, dataService);
      this.notifyConnectionAttemptSuccessful(connectionInfo.id, dataService);
    } catch (error) {
      this.notifyConnectionAttemptFailed(connectionInfo.id, ensureError(error));
      throw error;
    }
  }

  async closeConnection(connectionInfoId: ConnectionInfoId): Promise<void> {
    const dataService = this.dataServices.get(connectionInfoId);
    this.dataServices.delete(connectionInfoId);
    if (dataService) {
      await dataService.disconnect();
      this.notifyConnectionDisconnected(connectionInfoId);
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

  private notifyConnectionAttemptStarted(connectionInfoId: ConnectionInfoId) {
    this.connectionStatuses.set(connectionInfoId, ConnectionStatus.Connecting);
    this.emit(
      ConnectionsManagerEvents.ConnectionAttemptStarted,
      connectionInfoId
    );
  }

  private notifyConnectionAttemptSuccessful(
    connectionInfoId: ConnectionInfoId,
    dataService: DataService
  ) {
    this.connectionStatuses.set(connectionInfoId, ConnectionStatus.Connected);
    this.emit(
      ConnectionsManagerEvents.ConnectionAttemptSuccessful,
      connectionInfoId,
      dataService
    );
  }

  private notifyConnectionAttemptCancelled(connectionInfoId: ConnectionInfoId) {
    this.connectionStatuses.set(
      connectionInfoId,
      ConnectionStatus.Disconnected
    );
    this.emit(
      ConnectionsManagerEvents.ConnectionAttemptCancelled,
      connectionInfoId
    );
  }

  private notifyConnectionAttemptFailed(
    connectionInfoId: ConnectionInfoId,
    error: Error
  ) {
    this.connectionStatuses.set(connectionInfoId, ConnectionStatus.Failed);
    this.emit(
      ConnectionsManagerEvents.ConnectionAttemptFailed,
      connectionInfoId,
      error
    );
  }

  private notifyConnectionDisconnected(connectionInfoId: ConnectionInfoId) {
    this.connectionStatuses.set(
      connectionInfoId,
      ConnectionStatus.Disconnected
    );
    this.emit(
      ConnectionsManagerEvents.ConnectionDisconnected,
      connectionInfoId
    );
  }
}
