// @ts-check
const { execSync } = require('child_process');

function getDefaultKeychain() {
  return execSync('security default-keychain', { encoding: 'utf8' }).trim();
}

// This should ensure that the tests that we are running against secure backend
// will be executed against unlocked keychain on macos
function createUnlockedKeychain() {
  if (process.platform === 'darwin') {
    const tempKeychainName = `temp${Date.now().toString(32)}.keychain`;
    const origDefaultKeychain = JSON.parse(getDefaultKeychain());

    return {
      name: tempKeychainName,
      activate() {
        execSync(`security create-keychain -p "" "${tempKeychainName}"`);
        execSync(`security default-keychain -s "${tempKeychainName}"`);
        execSync(`security unlock-keychain -p "" "${tempKeychainName}"`);
      },
      reset() {
        execSync(`security default-keychain -s "${origDefaultKeychain}"`);
        execSync(`security delete-keychain "${tempKeychainName}"`);
      },
    };
  }

  return { name: null, activate() {}, reset() {} };
}

module.exports = { getDefaultKeychain, createUnlockedKeychain };
