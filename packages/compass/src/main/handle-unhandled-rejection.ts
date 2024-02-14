import { handleError } from './handle-error';

async function handleUnhandledRejection(err: Error): Promise<void> {
  // eslint-disable-next-line no-console
  console.error('handling unhandledRejection', err);
  await handleError(err);
}

export { handleUnhandledRejection };
