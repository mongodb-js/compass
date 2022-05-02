// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongodbNotaryServiceClient = require('@mongodb-js/mongodb-notary-service-client');

import createDebug from 'debug';
const debug = createDebug('mongodb-compass:compass-build:sign-package');

export async function signLinuxPackage(src: string): Promise<void> {
  debug('Signing ... %s', src);
  await mongodbNotaryServiceClient(src);
  debug('Successfully signed %s', src);
}
