import path from 'path';
import { runElectronBuilder } from './electron-builder/run-electron-builder';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const HadronBuildTarget = require('hadron-build/lib/target');

export async function packageCompass(): Promise<void> {
  const { bundleId, productName } = new HadronBuildTarget(
    path.resolve(__dirname, '..')
  );

  await runElectronBuilder({ bundleId, productName });
}

packageCompass().then(console.info, console.error);
