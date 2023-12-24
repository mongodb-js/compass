import { SSHClient } from './ssh-client';
import { expect } from 'chai';

describe.skip('SSHClient', () => {
  let sshClient: SSHClient;

  beforeEach(() => {
    const sshClientOptions = {
      host: 'example.com',
      port: 22,
      username: 'testuser',
      privateKey: '/path/to/private/key',
    };
    sshClient = new SSHClient(sshClientOptions);
  });

  afterEach(() => {
    sshClient.disconnect();
  });

  it('should connect to SSH server', async function () {
    await sshClient.connect();
    expect(sshClient['sshConnection']).to.have.property('connected', true);
  });

  it('should disconnect from SSH server', async function () {
    await sshClient.connect();
    sshClient.disconnect();
    expect(sshClient['sshConnection']).to.have.property('connected', false);
  });

  it('should execute a command on the SSH server', async function () {});

  it('should get SFTP connection', async function () {});
});
