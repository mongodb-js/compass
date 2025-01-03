import electron from 'electron';
import fs from 'fs';
import path from 'path';

electron.app.once('ready', () => {
  // Signal that the app got ready by touching a file
  const appDataPath = electron.app.getAppPath();
  const p = path.resolve(appDataPath, '../../../../ready.signal');
  // eslint-disable-next-line no-console
  console.log('Writing signal to', p);
  fs.writeFileSync(p, 'Hello from a future Compass!', {
    encoding: 'utf8',
  });
  // Exit ...
  process.exit();
});
