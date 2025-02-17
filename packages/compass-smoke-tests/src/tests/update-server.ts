import { once } from 'node:events';
import type http from 'node:http';
import { promisify } from 'node:util';

import createDebug from 'debug';

const debug = createDebug('compass:smoketests:update-server');

async function importUpdateServer() {
  try {
    return (await import('compass-mongodb-com')).default;
  } catch (err: unknown) {
    debug('Remember to npm link compass-mongodb-com');
    throw err;
  }
}

export async function startAutoUpdateServer() {
  debug('Starting auto-update server');
  const { httpServer, updateChecker, start } = (await importUpdateServer())();
  start();
  await once(updateChecker, 'refreshed');

  return httpServer;
}

export async function stopAutoUpdateServer(server: http.Server) {
  await promisify(server.close.bind(server))();
}
