import { handleError } from './handle-error';

async function handleUncaughtException(err: Error): Promise<void> {
  // eslint-disable-next-line no-console
  console.error('handling uncaughtException', err);
  await handleError(err);
}

export { handleUncaughtException };
