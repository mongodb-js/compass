import path from 'path';
import { runElectronBuilder } from './electron-builder/run-electron-builder';

const debug = console.info.bind(console, 'mongodb-compass:build');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const HadronBuildTarget = require('hadron-build/lib/target');

export async function packageCompass(): Promise<void> {
  const { bundleId, productName } = new HadronBuildTarget(
    path.resolve(__dirname, '..')
  );

  const projectDir = path.join(__dirname, '..', 'dist', 'project');

  await runElectronBuilder(projectDir, { bundleId, productName });
  debug('running electron-builder');
}
