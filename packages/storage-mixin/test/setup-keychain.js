if (process.env.EVERGREEN && process.platform === 'darwin') {
  // TODO: https://jira.mongodb.org/browse/COMPASS-5216
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️ storage-mixin tests are skipped in Evergreen environment on macOS ' +
      'machines as running tests requires temporary changes to the default ' +
      'machine keychain and the machines are statefull which might cause issues ' +
      'for some processes.'
  );
} else {
  const { createUnlockedKeychain } = require('./helpers');
  const keychain = createUnlockedKeychain();
  before(keychain.before);
  after(keychain.after);
}
