import { promises as fs } from 'fs';
import type { ExportConnectionOptions, ImportConnectionOptions } from 'mongodb-data-service';

export async function doExportConnections(filename: string, options: ExportConnectionOptions = {}): Promise<void> {
  console.log(`Exporting connections to "${filename}" (${options.passphrase ? 'with' : 'without'} passphrase)`);
  // For now, we're importing mongodb-data-service dynamically here instead of adding it
  // and its dependencies to the main process startup sequence, since 99 % of the time
  // it is not going to be used.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { exportConnections } = await import('mongodb-data-service');
  const json = await exportConnections(options);
  await fs.writeFile(filename, json);
}

export async function doImportConnections(filename: string, options: ImportConnectionOptions = {}): Promise<void> {
  console.log(`Importing connections from "${filename}" (${options.passphrase ? 'with' : 'without'} passphrase)`);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { importConnections } = await import('mongodb-data-service');
  const json = await fs.readFile(filename, 'utf8');
  await importConnections(json, options);
}
