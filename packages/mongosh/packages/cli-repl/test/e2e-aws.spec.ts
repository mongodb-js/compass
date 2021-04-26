import { expect } from 'chai';
import { spawnSync } from 'child_process';
import { TestShell } from './test-shell';

function assertEnvVariable(variableName: string): string {
  const value = process.env[variableName];
  if (!value) {
    if (process.env.IS_CI) {
      throw new Error(`Expected environment variable but was not set: ${variableName}`);
    } else {
      console.error(`Expected environment variable but was not set: ${variableName}`);
      return undefined;
    }
  }
  return value;
}

const ATLAS_CLUSTER_HOST = assertEnvVariable('AWS_AUTH_ATLAS_CLUSTER_HOST');
const AWS_IAM_USER_ARN = assertEnvVariable('AWS_AUTH_IAM_USER_ARN');
const AWS_ACCESS_KEY_ID = assertEnvVariable('AWS_AUTH_IAM_ACCESS_KEY_ID');
const AWS_SECRET_ACCESS_KEY = assertEnvVariable('AWS_AUTH_IAM_SECRET_ACCESS_KEY');
const AWS_IAM_TEMP_ROLE_ARN = assertEnvVariable('AWS_AUTH_IAM_TEMP_ROLE_ARN');

function generateIamSessionToken(): { key: string; secret: string; token: string } {
  const result = spawnSync('aws', [
    'sts', 'assume-role', '--role-arn', AWS_IAM_TEMP_ROLE_ARN, '--role-session-name', 'MONGODB-AWS-AUTH-TEST'
  ], {
    encoding: 'utf8',
    env: {
      ...process.env,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY
    }
  });
  if (result.status !== 0) {
    console.error('Failed to run aws sts assume-role', result);
    throw new Error('Failed to run aws sts assume-role');
  }

  const parsedToken = JSON.parse(result.stdout);
  const key = parsedToken?.Credentials?.AccessKeyId;
  const secret = parsedToken?.Credentials?.SecretAccessKey;
  const token = parsedToken?.Credentials?.SessionToken;
  if (!key || !secret || !token) {
    throw new Error('Could not determine key, token, or secret from sts assume-role output');
  }
  return {
    key,
    secret,
    token
  };
}

function getConnectionString(username?: string, password?: string): string {
  let auth = '';
  if (username && password) {
    auth = `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
  }
  return `mongodb+srv://${auth}${ATLAS_CLUSTER_HOST}/?authSource=%24external&authMechanism=MONGODB-AWS`;
}

describe('e2e AWS AUTH', () => {
  let expectedAssumedRole: string;

  before(function() {
    let awsCliFound = false;
    try {
      const result = spawnSync('aws', ['--version'], {
        encoding: 'utf8'
      });
      if (result.status === 0) {
        awsCliFound = true;
      }
    } catch (e) {
      // pass
    }
    if (!awsCliFound) {
      console.error('AWS CLI is not available - skipping AWS AUTH tests...');
      return this.skip();
    }

    if (!ATLAS_CLUSTER_HOST) {
      console.error('Could not get ATLAS_CLUSTER_HOST - skipping AWS AUTH tests...');
      return this.skip();
    }

    expectedAssumedRole = `${AWS_IAM_TEMP_ROLE_ARN
      .replace(':role/', ':assumed-role/')
      .replace('arn:aws:iam::', 'arn:aws:sts::')}/*`;
  });

  afterEach(TestShell.cleanup);

  context('without environment variables being present', () => {
    context('specifying explicit parameters', () => {
      it('connects with access key and secret', async() => {
        const shell = TestShell.start({
          args: [
            getConnectionString(),
            '--username', AWS_ACCESS_KEY_ID,
            '--password', AWS_SECRET_ACCESS_KEY
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');

        const connectionStatus = await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        expect(connectionStatus).to.contain(`user: '${AWS_IAM_USER_ARN}'`);
      });

      it('connects with access key, secret, and session token for IAM role', async() => {
        const tokenDetails = generateIamSessionToken();
        const shell = TestShell.start({
          args: [
            getConnectionString(),
            '--username', tokenDetails.key,
            '--password', tokenDetails.secret,
            '--awsIamSessionToken', tokenDetails.token
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');

        const connectionStatus = await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        expect(connectionStatus).to.contain(`user: '${expectedAssumedRole}'`);
      });
    });

    context('specifying connection string parameters', () => {
      it('connects with access key and secret', async() => {
        const shell = TestShell.start({
          args: [
            getConnectionString(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');

        const connectionStatus = await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        expect(connectionStatus).to.contain(`user: '${AWS_IAM_USER_ARN}'`);
      });

      it('connects with access key, secret, and session token for IAM role', async() => {
        const tokenDetails = generateIamSessionToken();
        const shell = TestShell.start({
          args: [
            `${getConnectionString(tokenDetails.key, tokenDetails.secret)}&authMechanismProperties=AWS_SESSION_TOKEN:${encodeURIComponent(tokenDetails.token)}`
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');

        const connectionStatus = await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        expect(connectionStatus).to.contain(`user: '${expectedAssumedRole}'`);
      });
    });
  });

  context('with AWS environment variables', () => {
    context('without any other parameters', () => {
      it('connects for the IAM user', async() => {
        const shell = TestShell.start({
          args: [ getConnectionString() ],
          env: {
            ...process.env,
            AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY
          }
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');

        const connectionStatus = await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        expect(connectionStatus).to.contain(`user: '${AWS_IAM_USER_ARN}'`);
      });

      it('connects for the IAM role session', async() => {
        const tokenDetails = generateIamSessionToken();
        const shell = TestShell.start({
          args: [ getConnectionString() ],
          env: {
            ...process.env,
            AWS_ACCESS_KEY_ID: tokenDetails.key,
            AWS_SECRET_ACCESS_KEY: tokenDetails.secret,
            AWS_SESSION_TOKEN: tokenDetails.token
          }
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');

        const connectionStatus = await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        expect(connectionStatus).to.contain(`user: '${expectedAssumedRole}'`);
      });
    });

    context('with invalid environment but valid parameters', () => {
      it('connects for the IAM user', async() => {
        const shell = TestShell.start({
          args: [
            getConnectionString(),
            '--username', AWS_ACCESS_KEY_ID,
            '--password', AWS_SECRET_ACCESS_KEY
          ],
          env: {
            ...process.env,
            AWS_ACCESS_KEY_ID: 'invalid',
            AWS_SECRET_ACCESS_KEY: 'invalid'
          }
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');

        const connectionStatus = await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        expect(connectionStatus).to.contain(`user: '${AWS_IAM_USER_ARN}'`);
      });

      it('connects for the IAM role session', async() => {
        const tokenDetails = generateIamSessionToken();
        const shell = TestShell.start({
          args: [
            getConnectionString(),
            '--username', tokenDetails.key,
            '--password', tokenDetails.secret,
            '--awsIamSessionToken', tokenDetails.token
          ],
          env: {
            ...process.env,
            AWS_ACCESS_KEY_ID: 'invalid',
            AWS_SECRET_ACCESS_KEY: 'invalid',
            AWS_SESSION_TOKEN: 'invalid'
          }
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');

        const connectionStatus = await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        expect(connectionStatus).to.contain(`user: '${expectedAssumedRole}'`);
      });
    });
  });
});
