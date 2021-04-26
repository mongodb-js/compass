const { remote } = require('electron');
const path = require('path');

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
