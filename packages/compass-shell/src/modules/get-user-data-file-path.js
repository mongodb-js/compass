const path = require('path');

let remote;
try {
  remote = require('@electron/remote');
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Could not load @electron/remote', e.message);
}

export function getUserDataFilePath(filename) {
  if (!remote) {
    return;
  }

  const app = remote.app;

  if (!app) {
    return;
  }

  return path.join(
    app.getPath('userData'),
    app.getName(),
    filename
  );
}
