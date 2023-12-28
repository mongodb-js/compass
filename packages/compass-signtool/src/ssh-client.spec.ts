import sinon from 'sinon';
import { SSHClient } from './ssh-client';
import { expect } from 'chai';

describe('SSHClient', () => {
  let sshClient: SSHClient;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    const sshClientOptions = {
      host: 'example.com',
      port: 22,
      username: 'admin',
      privateKey: '~/root/key',
    };
    sshClient = new SSHClient(sshClientOptions);
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('connects successfully on ready', async function () {
    const connectStub = sandbox
      .stub(sshClient['sshConnection'], 'connect')
      .resolves(sshClient['sshConnection']);
    await Promise.all([
      sshClient.connect(),
      sshClient['sshConnection'].emit('ready'),
    ]);
    expect(connectStub.calledOnce).to.be.true;
    expect(connectStub.firstCall.firstArg).to.deep.equal({
      host: 'example.com',
      port: 22,
      username: 'admin',
      privateKey: '~/root/key',
    });
    expect(sshClient).to.have.property('connected', true);
  });

  it('does not called client.connect when connected', async function () {
    const connectStub = sandbox
      .stub(sshClient['sshConnection'], 'connect')
      .resolves(sshClient['sshConnection']);
    // Its connected here
    sshClient['sshConnection'].emit('ready');
    await Promise.all([
      sshClient.connect(),
      sshClient['sshConnection'].emit('ready'),
    ]);

    expect(connectStub.calledOnce).to.be.false;
    expect(sshClient).to.have.property('connected', true);
  });

  it('throws when connecting on error', async function () {
    const connectStub = sandbox
      .stub(sshClient['sshConnection'], 'connect')
      .resolves(sshClient['sshConnection']);
    try {
      await Promise.all([
        sshClient.connect(),
        sshClient['sshConnection'].emit('error', new Error('Connection error')),
      ]);
      expect.fail('Expected SSH Client to throw');
    } catch (err) {
      expect(err).to.have.property('message', 'Connection error');
      expect(connectStub.calledOnce).to.be.true;
      expect(connectStub.firstCall.firstArg).to.deep.equal({
        host: 'example.com',
        port: 22,
        username: 'admin',
        privateKey: '~/root/key',
      });
      expect(sshClient).to.have.property('connected', false);
    }
  });

  it('should disconnect from SSH server', function () {
    const endStub = sandbox.stub(sshClient['sshConnection'], 'end').resolves();
    sshClient['sshConnection'].emit('ready');

    sshClient.disconnect();
    expect(endStub.calledOnce).to.be.true;
  });

  context('exec', function () {
    const COMMAND = 'echo "Hello World"';
    type ExecCallback = (err: Error | undefined, channel: any) => any;
    it('should throw when exec fails', async function () {
      const execStub = sandbox
        .stub(sshClient['sshConnection'], 'exec')
        .callsFake((_command: string, cb: ExecCallback) => {
          return cb(new Error('Callback Error'), null);
        });
      sshClient['sshConnection'].emit('ready');

      try {
        await sshClient.exec(COMMAND);
        expect.fail('Expected SSH Client to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'Callback Error');
        expect(execStub.calledOnce).to.be.true;
        expect(execStub.firstCall.firstArg).to.equal(COMMAND);
      }
    });

    it('should throw when exec returns an error - code > 0', async function () {
      const execStub = sandbox
        .stub(sshClient['sshConnection'], 'exec')
        .callsFake((_command: string, cb: ExecCallback) => {
          return cb(undefined, {
            stderr: {
              on: (event: string, cb: (data: string) => void) => {
                if (event === 'data') {
                  cb('Some Error');
                }
              },
            },
            on: (event: string, cb: (code: number | string) => void) => {
              if (event === 'close') {
                cb(10);
              }
            },
          });
        });
      sshClient['sshConnection'].emit('ready');

      try {
        await sshClient.exec(COMMAND);
        expect.fail('Expected SSH Client to throw');
      } catch (err) {
        expect(err).to.have.a.property(
          'message',
          'Command failed with code 10. Error: Some Error'
        );
        expect(execStub.calledOnce).to.be.true;
        expect(execStub.firstCall.firstArg).to.equal(COMMAND);
      }
    });

    it('should return stdout when exec succeeds', async function () {
      const execStub = sandbox
        .stub(sshClient['sshConnection'], 'exec')
        .callsFake((_command: string, cb: ExecCallback) => {
          return cb(undefined, {
            stderr: {
              on: () => {},
            },
            on: (event: string, cb: (code: number | string) => void) => {
              if (event === 'data') {
                cb('Hello World');
              }
              if (event === 'close') {
                cb(0);
              }
            },
          });
        });
      sshClient['sshConnection'].emit('ready');

      const result = await sshClient.exec(COMMAND);
      expect(result).to.equal('Hello World');
      expect(execStub.calledOnce).to.be.true;
      expect(execStub.firstCall.firstArg).to.equal(COMMAND);
    });
  });

  it('should get SFTP connection', async function () {
    const sftpStub = sandbox
      .stub(sshClient['sshConnection'], 'sftp')
      .callsFake((cb: (err: Error | undefined, sftp: any) => any) => {
        return cb(undefined, 'mockedSFTP');
      });

    sshClient['sshConnection'].emit('ready');

    const result = await sshClient.getSftpConnection();
    expect(result).to.equal('mockedSFTP');
    expect(sftpStub.calledOnce).to.be.true;
  });
});
