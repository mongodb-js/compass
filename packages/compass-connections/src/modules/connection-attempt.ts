import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { ConnectionOptions, DataService } from 'mongodb-data-service';
import { connect } from 'mongodb-data-service';

const { log, mongoLogId, debug } =
  createLoggerAndTelemetry('COMPASS-CONNECT-UI');

function isConnectionAttemptTerminatedError(err: Error) {
  return err?.name === 'MongoError' && err?.message === 'Topology closed';
}

export class ConnectionAttempt {
  _cancelled: Promise<void>;
  _cancelConnectionAttempt?: () => void;
  _closed = false;
  _connectFn: (connectionOptions: ConnectionOptions) => Promise<DataService>;
  _dataService: DataService | null = null;

  constructor(
    connectFn: (connectionOptions: ConnectionOptions) => Promise<DataService>
  ) {
    this._connectFn = connectFn;
    this._cancelled = new Promise((resolve) => {
      this._cancelConnectionAttempt = () => resolve();
    });
  }

  connect(connectionOptions: ConnectionOptions): Promise<DataService | void> {
    log.info(
      mongoLogId(1001000004),
      'Connection UI',
      'Initiating connection attempt'
    );

    return Promise.race([this._cancelled, this._connect(connectionOptions)]);
  }

  cancelConnectionAttempt(): void {
    log.info(
      mongoLogId(1001000005),
      'Connection UI',
      'Canceling connection attempt'
    );

    this._cancelConnectionAttempt?.();
    void this._close();
  }

  isClosed(): boolean {
    return this._closed;
  }

  async _connect(
    connectionOptions: ConnectionOptions
  ): Promise<DataService | void> {
    if (this._closed) {
      return;
    }

    try {
      this._dataService = await this._connectFn(connectionOptions);
      return this._dataService;
    } catch (err) {
      if (isConnectionAttemptTerminatedError(err as Error)) {
        debug('caught connection attempt closed error', err);
        return;
      }

      debug('connection attempt failed', err);
      throw err;
    }
  }

  async _close(): Promise<void> {
    if (this._closed) {
      return;
    }

    this._closed = true;

    if (!this._dataService) {
      debug('cancelled connection attempt');
      return;
    }

    try {
      await this._dataService.disconnect();
      debug('disconnected from connection attempt');
    } catch (err) {
      // When the disconnect fails, we free up the ui and we can
      // silently wait for the timeout if it's still attempting to connect.
      debug('error while disconnecting from connection attempt', err);
    }
  }
}

export function createConnectionAttempt(
  connectFn = connect
): ConnectionAttempt {
  return new ConnectionAttempt(connectFn);
}
