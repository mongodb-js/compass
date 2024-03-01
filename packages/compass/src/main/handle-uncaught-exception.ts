import { handleError } from './handle-error';

async function handleUncaughtException(err: Error): Promise<void> {
  await handleError(err);
}

export { handleUncaughtException };
