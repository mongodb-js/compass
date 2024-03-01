import { handleError } from './handle-error';

async function handleUnhandledRejection(err: Error): Promise<void> {
  await handleError(err);
}

export { handleUnhandledRejection };
