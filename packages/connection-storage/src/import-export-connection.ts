import { EJSON } from 'bson';
import { cloneDeep } from 'lodash';
import type { ConnectionInfo } from './connection-info';
import type { ConnectionSecrets } from './connection-secrets';
import { extractSecrets, mergeSecrets } from './connection-secrets';
import { Decrypter, Encrypter } from './encrypt';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { log, mongoLogId, track } = createLoggerAndTelemetry(
  'COMPASS-CONNECTION-IMPORT-EXPORT'
);

const kCurrentVersion = 1;
const kFileTypeDescription = 'Compass Connections';

export interface ImportConnectionOptions {
  passphrase?: string;
  filterConnectionIds?: string[];
  trackingProps?: Record<string, unknown> | undefined;
}

export interface ExportConnectionOptions extends ImportConnectionOptions {
  removeSecrets?: boolean;
}

export async function serializeConnections(
  connections: ConnectionInfo[],
  options: Omit<ExportConnectionOptions, 'filterConnectionIds'> = {}
): Promise<string> {
  const {
    passphrase = '',
    removeSecrets = false,
    trackingProps = undefined,
  } = options;

  if (passphrase && removeSecrets) {
    throw new Error(
      'Cannot both specify to remove secrets and provide a passphrase for encrypting secrets'
    );
  }

  let exportConnections = cloneDeep(connections);

  log.info(
    mongoLogId(1_001_000_151),
    'Connection Export',
    'Exporting connections',
    {
      hasPassphrase: !!passphrase,
      removeSecrets,
      count: exportConnections.length,
    }
  );
  if (trackingProps !== undefined) {
    track('Connection Exported', {
      ...trackingProps,
      count: exportConnections.length,
    });
  }

  if (passphrase || removeSecrets) {
    const encrypter = new Encrypter(passphrase);
    exportConnections = await Promise.all(
      exportConnections.map(async (originalInfo: ConnectionInfo) => {
        const { connectionInfo, secrets } = extractSecrets(originalInfo);
        if (removeSecrets) {
          return connectionInfo;
        }
        const encrypted = await encrypter.encrypt(
          EJSON.stringify({ secrets }, { relaxed: false })
        );
        return { ...connectionInfo, connectionSecrets: encrypted };
      })
    );
  }

  const exportResult = {
    type: kFileTypeDescription,
    version: kCurrentVersion,
    connections: exportConnections,
  };

  return EJSON.stringify(exportResult, undefined, 2, { relaxed: false });
}

class CompassImportError extends Error {
  constructor(message: string, extraProperties?: Record<string, unknown>) {
    super(message);
    Object.assign(this, extraProperties);
  }
}

export async function deserializeConnections(
  connectionList: string,
  options: Omit<ImportConnectionOptions, 'filterConnectionIds'> = {}
): Promise<ConnectionInfo[]> {
  const { passphrase = '', trackingProps = undefined } = options;

  let connections: ConnectionInfo[];
  try {
    const parsed = EJSON.parse(connectionList);
    if (
      typeof parsed !== 'object' ||
      !parsed ||
      parsed.type !== kFileTypeDescription
    ) {
      throw new CompassImportError(
        'Input is in unrecognized format (expected Compass import file)'
      );
    }
    const { version } = parsed;
    if (!version || version !== kCurrentVersion) {
      throw new CompassImportError(
        `Input is in unrecognized format (expected version ${kCurrentVersion}, got ${String(
          version
        )})`
      );
    }

    log.info(
      mongoLogId(1_001_000_152),
      'Connection Import',
      'Reading import file',
      {
        hasPassphrase: !!passphrase,
        count: parsed.connections.length,
      }
    );
    if (trackingProps !== undefined) {
      track('Connection Imported', {
        ...trackingProps,
        count: parsed.connections.length,
      });
    }

    let decrypter: Decrypter;
    connections = await Promise.all(
      (parsed.connections as any[]).map(async (originalEntry) => {
        const { connectionSecrets, ...entry } = originalEntry ?? {};
        if (connectionSecrets) {
          if (!passphrase) {
            throw new CompassImportError(
              'Input file contains encrypted secrets but no passphrase was provided',
              { passphraseRequired: true }
            );
          }
          decrypter ??= new Decrypter(passphrase);
          const { secrets } =
            EJSON.parse(await decrypter.decrypt(connectionSecrets)) ?? {};
          if (!secrets) {
            throw new CompassImportError(
              'Input file contained invalid encrypted data'
            );
          }
          return mergeSecrets(entry, secrets as ConnectionSecrets);
        }
        return entry as ConnectionInfo;
      })
    );
  } catch (err: any) {
    if (err instanceof CompassImportError) {
      throw err;
    }
    const newErr = new CompassImportError(
      `Could not parse connections list: ${String(err.message)}`
    );
    newErr.stack = err.stack;
    throw newErr;
  }

  return connections;
}
