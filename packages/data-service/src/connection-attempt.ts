import { isCancelError, raceWithAbort } from '@mongodb-js/compass-utils';
import { createLogger } from '@mongodb-js/compass-logging';

import type { UnboundDataServiceImplLogger } from './logger';
import connect from './connect';
import type { DataService } from './data-service';
import type { ConnectionOptions } from './connection-options';

const { mongoLogId } = createLogger('CONNECTION-ATTEMPT');

function isConnectionAttemptTerminatedError(err: Error) {
  return err?.name === 'MongoTopologyClosedError';
}

export class ConnectionAttempt {
  _abortController: AbortController;
  _closed = false;
  _connectFn: typeof connect;
  _dataService: DataService | null = null;
  _logger: UnboundDataServiceImplLogger;

  constructor({
    connectFn,
    logger,
  }: {
    connectFn: typeof connect;
    logger: UnboundDataServiceImplLogger;
  }) {
    this._logger = logger;
    this._connectFn = connectFn;
    this._abortController = new AbortController();
  }

  connect(connectionOptions: ConnectionOptions): Promise<DataService | void> {
    return raceWithAbort(
      this._connect(connectionOptions),
      this._abortController.signal
    ).catch((err) => {
      if (!isCancelError(err)) throw err;
    });
  }

  cancelConnectionAttempt(): void {
    this._abortController.abort();
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
      this._dataService = await this._connectFn({
        connectionOptions,
        signal: this._abortController.signal,
        logger: this._logger,
      });
      return this._dataService;
    } catch (err) {
      if (isConnectionAttemptTerminatedError(err as Error)) {
        this._logger.debug(
          'Connection Attempt',
          mongoLogId(1_001_000_282),
          'connect',
          'caught connection attempt closed error',
          err
        );
        return;
      }

      this._logger.debug(
        'Connection Attempt',
        mongoLogId(1_001_000_279),
        'connect',
        'connection attempt failed',
        err
      );
      throw err;
    }
  }

  async _close(): Promise<void> {
    if (this._closed) {
      return;
    }

    this._closed = true;

    if (!this._dataService) {
      this._logger.debug(
        'Connection Attempt',
        mongoLogId(1_001_000_280),
        'close requested',
        'cancelled connection attempt'
      );
      return;
    }

    try {
      await this._dataService.disconnect();
      this._logger.debug(
        'Connection Attempt',
        mongoLogId(1_001_000_281),
        'close requested',
        'disconnected from connection attempt'
      );
    } catch (err) {
      // When the disconnect fails, we free up the ui and we can
      // silently wait for the timeout if it's still attempting to connect.
      this._logger.debug(
        'Connection Attempt',
        mongoLogId(1_001_000_283),
        'close requested',
        'error while disconnecting from connection attempt',
        err
      );
    }
  }
}

export function createConnectionAttempt({
  logger,
  connectFn = connect,
}: {
  logger: UnboundDataServiceImplLogger;
  connectFn?: typeof connect;
}): ConnectionAttempt {
  return new ConnectionAttempt({
    logger,
    connectFn,
  });
}
