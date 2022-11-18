/* eslint-disable @typescript-eslint/no-var-requires */
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import path from 'path';
import { promises as fs } from 'fs';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-MAIN');

function processPath(p: string): string {
  // path.resolve(__dirname, ...) is required for webpack to turn
  // this into a proper absolute path
  p = path.resolve(__dirname, p);
  // the .asar -> .asar.unpacked replacement is required so that
  // we actually get a file on the actual filesystem instead of something
  // that is only present in Electron's virtual filesystem
  if (!p.includes('.asar.unpacked')) {
    p = p.replace('.asar', '.asar.unpacked');
  }
  return p;
}

export async function setupCSFLELibrary(): Promise<void> {
  const errors: Error[] = [];
  let cryptSharedLibPath;
  if (!cryptSharedLibPath) {
    // This is not a loop so that the require() parts receive literal strings
    // in order for webpack to process them properly
    try {
      const candidate = processPath(
        require('../deps/csfle/bin/mongo_crypt_v1.dll')
      );
      await fs.access(candidate);
      cryptSharedLibPath = candidate;
    } catch (err: any) {
      errors.push(err);
    }
    try {
      const candidate = processPath(
        require('../deps/csfle/lib/mongo_crypt_v1.so')
      );
      await fs.access(candidate);
      cryptSharedLibPath = candidate;
    } catch (err: any) {
      errors.push(err);
    }
    try {
      const candidate = processPath(
        require('../deps/csfle/lib/mongo_crypt_v1.dylib')
      );
      await fs.access(candidate);
      cryptSharedLibPath = candidate;
    } catch (err: any) {
      errors.push(err);
    }
  }
  if (!cryptSharedLibPath) {
    log.error(
      mongoLogId(1_001_000_124),
      'AutoEncryption',
      'No MongoDB Crypt library available',
      {
        errors: errors.map((err) => err.message),
      }
    );
  } else {
    log.info(
      mongoLogId(1_001_000_125),
      'AutoEncryption',
      'Found MongoDB Crypt library',
      {
        cryptSharedLibPath,
        externalOverride: process.env.COMPASS_CRYPT_LIBRARY_PATH,
      }
    );
    process.env.COMPASS_CRYPT_LIBRARY_PATH ??= cryptSharedLibPath;
  }
}
