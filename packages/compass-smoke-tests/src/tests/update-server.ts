import { once } from 'node:events';

async function importUpdateServer() {
  try {
    return (await import('compass-mongodb-com')).default;
  } catch (err: unknown) {
    console.log('Remember to npm link compass-mongodb-com');
    throw err;
  }
}

export async function startAutoUpdateServer() {
  console.log('Starting auto-update server');
  const { httpServer, updateChecker, start } = (await importUpdateServer())();
  start();
  await once(updateChecker, 'refreshed');

  return httpServer;
}
