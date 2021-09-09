import createDebug from 'debug';
import createLogger from '@mongodb-js/compass-logging';
import { promisify } from 'util';

const { log, mongoLogId } = createLogger('COMPASS-CONNECT-UI');
const debug = createDebug('mongodb-compass:compass-connect:connection-attempt');

function isConnectionAttemptTerminatedError(err) {
  return err.name === 'MongoError' && err.message === 'Topology closed';
}

class ConnectionAttempt {
  constructor() {
    this._cancelled = new Promise((resolve) => {
      this._cancelConnectionAttempt = () => resolve(null);
    });
  }

  connect(dataService) {
    log.info(mongoLogId(1001000004), 'Connection UI', 'Initiating connection attempt');

    this._dataService = dataService;

    return Promise.race([
      this._cancelled,
      this._connect()
    ]);
  }

  cancelConnectionAttempt() {
    log.info(mongoLogId(1001000005), 'Connection UI', 'Canceling connection attempt');

    this._cancelConnectionAttempt();
    this._close();
  }

  async _connect() {
    if (this._closed) {
      return;
    }

    try {
      const runConnect = promisify(
        this._dataService.connect.bind(this._dataService)
      );
      await runConnect();
      return this._dataService;
    } catch (err) {
      if (isConnectionAttemptTerminatedError(err)) {
        debug('caught connection attempt closed error', err);
        return null;
      }

      debug('connection attempt failed', err);
      throw err;
    }
  }

  async _close() {
    if (this._closed) {
      return;
    }

    this._closed = true;

    if (!this._dataService) {
      debug('cancelled connection attempt');
      return;
    }

    try {
      const runDisconnect = promisify(
        this._dataService.disconnect.bind(this._dataService )
      );

      await runDisconnect();
      debug('disconnected from connection attempt');
    } catch (err) {
      // When the disconnect fails, we free up the ui and we can
      // silently wait for the timeout if it's still attempting to connect.
      debug('error while disconnecting from connection attempt', err);
    }
  }
}

export function createConnectionAttempt() {
  return new ConnectionAttempt();
}
