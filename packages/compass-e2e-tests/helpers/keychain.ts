import { execSync } from 'child_process';
import chalk from 'chalk';
import Debug from 'debug';

const debug = Debug('compass-e2e-tests').extend('keychain');

export function getDefaultKeychain(): string {
  return JSON.parse(
    execSync('security default-keychain', { encoding: 'utf8' }).trim()
  );
}

function wait(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type Keychain = {
  name?: string;
  activate: () => Promise<void>;
  reset: () => void;
};

/**
 * Compass uses user keychain through the keytar module. If the keychain is not
 * unlocked, macOS will show a prompt that is asking for password and this will
 * block the tests if there is no user input provided. Usually when running
 * tests with Chromiun the keychain can be switched to the mocked implementation
 * by using --use-mock-keychian flag, but Electron doesn't seem to support this
 * feature[1][2]. For that reason when running e2e tests we will try to do work
 * around this issue by first checking if the current user default keychain (the
 * one keytar will try to use to store secrets) is unlocked and switch default
 * keychain to a temporary one that we will clean-up after the tests if the
 * current default one is not unlocked.
 *
 * [1]: https://github.com/electron/electron/pull/30020#discussion_r664153197
 * [2]: https://www.electronjs.org/docs/latest/api/command-line-switches
 */
export function createUnlockedKeychain(): Keychain {
  if (process.platform === 'darwin') {
    const tempKeychainName = `temp${Date.now().toString(32)}.keychain`;
    const origDefaultKeychain = getDefaultKeychain();

    return {
      name: tempKeychainName,
      async activate() {
        try {
          execSync(`security unlock-keychain -p "" "${origDefaultKeychain}"`, {
            stdio: 'ignore',
          });
          debug('Current default keychain is unlocked, doing nothing');
        } catch (e) {
          if (!process.env.CI && !process.env.ci) {
            console.warn();
            console.warn(
              chalk.yellow(
                `${chalk.bold(
                  '⚠️ Warning'
                )}: Default keychain is locked, switching to the temporary ` +
                  'one. This can potentially cause any running applications to store ' +
                  'new secrets in the new temporary keychain that will be removed after ' +
                  'the tests. If you want to stop any running applications before running ' +
                  'tests, use Ctrl+C and restart the tests after you are ready.'
              )
            );
            console.warn();
            // Give some time to read and interrupt
            await wait(15000);
          }
          debug(
            `Default keychain is locked, switching to the temporary keychain ${tempKeychainName}`
          );
          execSync(`security create-keychain -p "" "${tempKeychainName}"`);
          execSync(`security default-keychain -s "${tempKeychainName}"`);
          execSync(`security unlock-keychain -p "" "${tempKeychainName}"`);
        }
      },
      reset() {
        // If they don't match, we switched the keychain with `activate`
        if (origDefaultKeychain !== getDefaultKeychain()) {
          debug(
            `Switching back to the original default keychain ${origDefaultKeychain}`
          );
          execSync(`security default-keychain -s "${origDefaultKeychain}"`);
        }
        try {
          execSync(`security delete-keychain "${tempKeychainName}"`, {
            stdio: 'ignore',
          });
        } catch (e) {
          // no-op, it might've not been created
        }
      },
    };
  }

  return {
    async activate() {
      return Promise.resolve();
    },
    reset() {
      return;
    },
  };
}
