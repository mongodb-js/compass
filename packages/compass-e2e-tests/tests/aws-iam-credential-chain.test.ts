import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  getDefaultConnectionStrings,
} from '../helpers/compass.ts';
import * as Selectors from '../helpers/selectors.ts';
import type { Compass } from '../helpers/compass.ts';

// Provide fake AWS credentials through the shared credentials/config *files*
// (as if written to ~/.aws/credentials) rather than AWS_ACCESS_KEY_ID /
// AWS_SECRET_ACCESS_KEY env vars. The SDK credential chain's fromEnv provider
// would short-circuit on env vars and never touch the file-loading code path
// that regressed in COMPASS-11097 (parseKnownFiles from @smithy/core/config).
// Pointing the chain at these files forces it to resolve credentials via the
// shared-ini-file loader.
//
// These env vars must be set before Compass is spawned (init), because the
// spawned process inherits process.env.
const fakeAwsDir = path.join(
  os.tmpdir(),
  `compass-e2e-fake-aws-${process.pid}`
);
process.env.AWS_SHARED_CREDENTIALS_FILE = path.join(fakeAwsDir, 'credentials');
process.env.AWS_CONFIG_FILE = path.join(fakeAwsDir, 'config');
process.env.AWS_PROFILE = 'default';
delete process.env.AWS_ACCESS_KEY_ID;
delete process.env.AWS_SECRET_ACCESS_KEY;
delete process.env.AWS_SESSION_TOKEN;

describe('AWS IAM credential chain', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(this, 'the AWS credential chain is stubbed out in compass-web');

    await fs.mkdir(fakeAwsDir, { recursive: true });
    await fs.writeFile(
      path.join(fakeAwsDir, 'credentials'),
      '[default]\naws_access_key_id = FAKE_ACCESS_KEY_ID\n' +
        'aws_secret_access_key = FAKE_SECRET_ACCESS_KEY\n'
    );
    await fs.writeFile(
      path.join(fakeAwsDir, 'config'),
      '[default]\nregion = us-east-1\n'
    );

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cleanup(compass);
    await fs.rm(fakeAwsDir, { recursive: true, force: true }).catch(() => {});
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('resolves MONGODB-AWS credentials through the credential chain', async function () {
    const connectionString = getDefaultConnectionStrings(0).replace(
      '/test',
      '/?authMechanism=MONGODB-AWS&authSource=$external'
    );

    // With no explicit access key/secret in the connection, the driver must go
    // through the AWS SDK credential chain, which reads the fake credentials
    // file above via parseKnownFiles and then attempts auth against the server.
    // The server is not configured for MONGODB-AWS, so it rejects the mechanism
    // after the client has already resolved credentials.
    await browser.connectWithConnectionString(connectionString, {
      connectionStatus: 'failure',
    });

    // `connectWithConnectionString` does not surface the error message, so read
    // it from the connection error toast.
    const error = await browser.$(Selectors.ConnectionToastErrorText).getText();

    // COMPASS-11097 regression guard: without the fix the credential chain
    // crashes in the renderer bundle (browser variant of @smithy/core/config)
    // before any credential lookup, failing with an "is not a function" error.
    expect(error).to.not.match(/is not a function/);
    expect(error).to.not.include('parseKnownFiles');
    expect(error).to.not.include('node-only');

    // The chain must have resolved the fake credentials (otherwise we'd get
    // "Could not load credentials from any providers") and reached the server,
    // which rejects the MONGODB-AWS mechanism.
    expect(error).to.not.include(
      'Could not load credentials from any providers'
    );
    expect(error).to.include('MONGODB-AWS');
  });
});
