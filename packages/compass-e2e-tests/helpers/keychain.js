// @ts-check
const { execSync } = require('child_process');
const debug = require('debug')('compass-e2e-tests').extend('keychain');

function getDefaultKeychain() {
  return JSON.parse(
    execSync('security default-keychain', { encoding: 'utf8' }).trim()
  );
}

// This should ensure that the tests that we are running against secure backend
// will be executed against unlocked keychain on macos
function createUnlockedKeychain() {
  if (process.platform === 'darwin') {
    const tempKeychainName = `temp${Date.now().toString(32)}.keychain`;
    const origDefaultKeychain = getDefaultKeychain();

    return {
      name: tempKeychainName,
      activate() {
        try {
          execSync(`security unlock-keychain -p "" "${origDefaultKeychain}"`, {
            stdio: 'ignore',
          });
          debug('Current default keychain is unlocked, doing nothing');
        } catch (e) {
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

  return { name: null, activate() {}, reset() {} };
}

module.exports = { getDefaultKeychain, createUnlockedKeychain };
