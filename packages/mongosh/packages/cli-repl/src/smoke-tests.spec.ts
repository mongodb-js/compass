import { runSmokeTests } from './';
import path from 'path';
import { startTestServer, useBinaryPath } from '../../../testing/integration-testing-hooks';

describe('smoke tests', () => {
  const testServer = startTestServer('shared');
  useBinaryPath(testServer); // Get mongocryptd in the PATH for this test

  it('self-test passes', async() => {
    // Use ts-node to run the .ts files directly so nyc can pick them up for
    // coverage.
    await runSmokeTests(
      await testServer.connectionString(),
      process.execPath, '-r', 'ts-node/register', path.resolve(__dirname, 'run.ts')
    );
  });
});
