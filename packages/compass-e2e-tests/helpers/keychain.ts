import { execSync } from 'child_process';
import Debug from 'debug';

const debug = Debug('compass-e2e-tests').extend('keychain');

function getDefaultKeychain(): string {
  return JSON.parse(
    execSync('security default-keychain', { encoding: 'utf8' }).trim()
  );
}

export function tryUnlockKeychain() {
  switch (process.platform) {
    case 'darwin':
      execSync(`security unlock-keychain -p "" "${getDefaultKeychain()}"`, {
        stdio: 'ignore',
      });
      debug('Current default keychain is unlocked.');
      break;
    default:
      debug('Not on macOS, doing nothing');
  }
}
