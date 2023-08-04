import { promises as fs } from 'fs';
import type {
  ExportConnectionOptions,
  ImportConnectionOptions,
} from '@mongodb-js/connection-storage/main';
import {
  exportConnections,
  importConnections,
} from '@mongodb-js/connection-storage/main';

export async function doExportConnections(
  filename: string,
  options: ExportConnectionOptions = {}
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(
    `Exporting connections to "${filename}" (${
      options.passphrase ? 'with' : 'without'
    } passphrase)`
  );
  const json = await exportConnections(options);
  await fs.writeFile(filename, json);
}

export async function doImportConnections(
  filename: string,
  options: ImportConnectionOptions = {}
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(
    `Importing connections from "${filename}" (${
      options.passphrase ? 'with' : 'without'
    } passphrase)`
  );
  const json = await fs.readFile(filename, 'utf8');
  await importConnections(json, options);
}
