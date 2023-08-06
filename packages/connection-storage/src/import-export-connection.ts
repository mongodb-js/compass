import { EJSON } from 'bson';
import type { ConnectionInfo } from './connection-info';
import type { ConnectionSecrets } from './connection-secrets';
import { extractSecrets, mergeSecrets } from './connection-secrets';
import { ConnectionStorageMain } from './connection-storage';
import { Decrypter, Encrypter } from './encrypt';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { throwIfAborted } from './utils';
import { ipcExpose, ipcInvoke } from '@mongodb-js/compass-utils';

const { log, mongoLogId, track } = createLoggerAndTelemetry(
  'COMPASS-CONNECTION-IMPORT-EXPORT'
);

const kCurrentVersion = 1;
const kFileTypeDescription = 'Compass Connections';

interface ExportImportConnectionOptions {
  passphrase?: string;
  connectionIds?: string[];
  trackingProps?: Record<string, unknown> | undefined;
}

export interface ExportConnectionOptions extends ExportImportConnectionOptions {
  removeSecrets?: boolean;
}

export interface ImportConnectionOptions
  extends ExportImportConnectionOptions {}

class CompassImportError extends Error {
  constructor(message: string, extraProperties?: Record<string, unknown>) {
    super(message);
    Object.assign(this, extraProperties);
  }
}

export class ImportExportConnectionsMain {
  private static calledOnce: boolean;
  private static connectionStorage: ConnectionStorageMain;
  private constructor() {
    // static and singleton
  }
  static init() {
    if (this.calledOnce) {
      return;
    }
    ipcExpose('ImportExportConnections', this, [
      'import',
      'export',
      'deserializeConnections',
    ]);
    this.calledOnce = true;
    this.connectionStorage = new ConnectionStorageMain();
  }

  static async deserializeConnections({
    connectionList,
    options,
    signal,
  }: {
    connectionList: string;
    options: Pick<ImportConnectionOptions, 'passphrase' | 'trackingProps'>;
    signal?: AbortSignal;
  }) {
    throwIfAborted(signal);
    const { trackingProps, passphrase = '' } = options;

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

  static async import({
    connectionList,
    options,
    signal,
  }: {
    connectionList: string;
    options: ImportConnectionOptions;
    signal?: AbortSignal;
  }) {
    throwIfAborted(signal);

    const { passphrase, trackingProps, connectionIds } = options;

    const allConnections = await this.deserializeConnections({
      connectionList,
      options: { passphrase, trackingProps },
      signal,
    });

    const connections = connectionIds
      ? allConnections.filter((x) => connectionIds.includes(x.id))
      : allConnections;

    log.info(
      mongoLogId(1_001_000_149),
      'Connection Import',
      'Starting connection import',
      {
        count: connections.length,
      }
    );

    await Promise.all(
      connections.map((connectionInfo) =>
        this.connectionStorage.save({ connectionInfo, signal })
      )
    );

    log.info(
      mongoLogId(1_001_000_150),
      'Connection Import',
      'Connection import complete',
      {
        count: connections.length,
      }
    );
  }

  static async export({
    options,
    signal,
  }: {
    options: ExportConnectionOptions;
    signal?: AbortSignal;
  }) {
    throwIfAborted(signal);
    const {
      connectionIds,
      passphrase = '',
      removeSecrets = false,
      trackingProps = undefined,
    } = options;

    if (passphrase && removeSecrets) {
      throw new Error(
        'Cannot both specify to remove secrets and provide a passphrase for encrypting secrets'
      );
    }

    const allConnections = await this.connectionStorage.loadAll();

    let exportConnections = connectionIds
      ? allConnections.filter((x) => connectionIds.includes(x.id))
      : allConnections.filter((x) => x.favorite?.name);

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
}

export class ImportExportConnectionsRenderer {
  private static ipc = ipcInvoke<
    typeof ImportExportConnectionsMain,
    'import' | 'export' | 'deserializeConnections'
  >('ImportExportConnections', ['import', 'export', 'deserializeConnections']);

  static import = this.ipc.import;
  static export = this.ipc.export;
  static deserializeConnections = this.ipc.deserializeConnections;
}
