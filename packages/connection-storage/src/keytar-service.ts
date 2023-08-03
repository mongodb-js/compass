import { ipcExpose } from '@mongodb-js/compass-utils';
import keytar from 'keytar';
import { getKeytarServiceName } from './utils';
import type { ConnectionSecrets } from './connection-secrets';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { log, debug, mongoLogId } =
  createLoggerAndTelemetry('CONNECTION-STORAGE');

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    const err = signal.reason ?? new Error('This operation was aborted.');
    throw err;
  }
};

const parseStoredPassword = (
  password: string
): ConnectionSecrets | undefined => {
  try {
    return JSON.parse(password).secrets;
  } catch (e) {
    debug('Failed to parse stored password');
    return undefined;
  }
};

export class KeytarService {
  private static calledOnce = false;

  private constructor() {
    // singleton
  }

  static init() {
    if (this.calledOnce) {
      return;
    }
    this.calledOnce = true;
    ipcExpose('KeytarService', this, [
      'findPasswords',
      'setPassword',
      'deletePassword',
    ]);
  }

  static async findPasswords({ signal }: { signal?: AbortSignal } = {}) {
    throwIfAborted(signal);
    if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
      return {};
    }

    try {
      const credentials = await keytar.findCredentials(getKeytarServiceName());
      return Object.fromEntries(
        credentials.map(({ account, password }) => [
          account,
          parseStoredPassword(password),
        ])
      );
    } catch (e) {
      log.error(
        mongoLogId(1_001_000_201),
        'Keytar Service',
        'Failed to load secrets',
        { message: (e as Error).message }
      );
      return {};
    }
  }

  static async setPassword({
    password,
    accountId,
    signal,
  }: {
    accountId: string;
    password: string;
    signal?: AbortSignal;
  }) {
    throwIfAborted(signal);
    if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
      return;
    }

    try {
      await keytar.setPassword(getKeytarServiceName(), accountId, password);
    } catch (e) {
      log.error(
        mongoLogId(1_001_000_202),
        'Keytar Service',
        'Failed to save secrets',
        { message: (e as Error).message }
      );
    }
  }

  static async deletePassword({
    accountId,
    signal,
  }: {
    accountId: string;
    signal?: AbortSignal;
  }) {
    throwIfAborted(signal);
    if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
      return;
    }

    try {
      await keytar.deletePassword(getKeytarServiceName(), accountId);
    } catch (e) {
      log.error(
        mongoLogId(1_001_000_203),
        'Keytar Service',
        'Failed to delete secrets',
        { message: (e as Error).message }
      );
    }
  }
}
