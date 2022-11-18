import { expect } from 'chai';
import sinon from 'sinon';
import { loadAutoConnectInfo } from './auto-connect';
import { exportConnections } from 'mongodb-data-service';
import type { ConnectionInfo } from 'mongodb-data-service';
import { ipcRenderer } from 'hadron-ipc';

describe('auto connection argument parsing', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    sandbox.stub(ipcRenderer, 'call').resolves(true);
  })

  afterEach(function() {
    sandbox.restore();
  })

  it('skips nothing if no file and no positional arguments are provided', function() {
    const fn = loadAutoConnectInfo({});
    expect(fn).to.equal(undefined);
  });

  it('skips nothing if only webdriverio default positional arguments are provided', function() {
    const fn = loadAutoConnectInfo({ positionalArguments: ['about:blank'] });
    expect(fn).to.equal(undefined);
  });

  it('understands a connection string if one has been passed', async function() {
    const connectionString = 'mongodb://localhost/';
    const fn = loadAutoConnectInfo({ positionalArguments: [connectionString] });
    const info = await fn?.();
    expect(info?.id).to.be.a('string');
    expect(info?.connectionOptions).to.deep.equal({
      connectionString
    });
  });

  it('reads a single-connection file if one has been specified', async function() {
    const connectionInfo: ConnectionInfo = {
      id: 'e53a561c-142f-403e-9c2e-d591e58cf44b',
      connectionOptions: {
        connectionString: 'mongodb://localhost/'
      },
      favorite: { name: 'foo' }
    };
    const fileContents = await exportConnections({
      loadConnections(): ConnectionInfo[] {
        return [connectionInfo];
      }
    });
    const fakeFs = { readFile: sinon.stub().resolves(fileContents) };
    const fn = loadAutoConnectInfo({ file: 'filename' }, fakeFs);
    const info = await fn?.();
    expect(info).to.deep.equal(connectionInfo);
  });

  it('rejects a multi-conection file if one has been specified without an id', async function() {
    const connectionInfo: Omit<ConnectionInfo, 'id'> = {
      connectionOptions: {
        connectionString: 'mongodb://localhost/'
      },
      favorite: { name: 'foo' }
    };
    const fileContents = await exportConnections({
      loadConnections(): ConnectionInfo[] {
        return [
          { ...connectionInfo, id: 'b4148ca4-a8e2-42c8-a838-9890169f7e7d' },
          { ...connectionInfo, id: '9036dd5f-719b-46d1-b812-7e6348e1e9c9' }
        ];
      }
    });
    const fakeFs = { readFile: sinon.stub().resolves(fileContents) };
    const fn = loadAutoConnectInfo({ file: 'filename' }, fakeFs);
    try {
      await fn?.();
      expect.fail('missed exception');
    } catch (err: any) {
      expect(err.message).to.equal("No connection id specified and connection file 'filename' contained 2 entries");
    }
  });

  it('rejects a multi-conection file if one has been specified with an invalid id', async function() {
    const connectionInfo: Omit<ConnectionInfo, 'id'> = {
      connectionOptions: {
        connectionString: 'mongodb://localhost/'
      },
      favorite: { name: 'foo' }
    };
    const fileContents = await exportConnections({
      loadConnections(): ConnectionInfo[] {
        return [
          { ...connectionInfo, id: 'b4148ca4-a8e2-42c8-a838-9890169f7e7d' },
          { ...connectionInfo, id: '9036dd5f-719b-46d1-b812-7e6348e1e9c9' }
        ];
      }
    });
    const fakeFs = { readFile: sinon.stub().resolves(fileContents) };
    const fn = loadAutoConnectInfo({ file: 'filename', positionalArguments: ['0000000-0000-0000-0000-000000000000'] }, fakeFs);
    try {
      await fn?.();
      expect.fail('missed exception');
    } catch (err: any) {
      expect(err.message).to.equal("Could not find connection with id '0000000-0000-0000-0000-000000000000' in connection file 'filename'");
    }
  });

  it('accepts a multi-conection file if an id has been specified', async function() {
    const connectionInfo: Omit<ConnectionInfo, 'id'> = {
      connectionOptions: {
        connectionString: 'mongodb://localhost/'
      },
      favorite: { name: 'foo' }
    };
    const fileContents = await exportConnections({
      loadConnections(): ConnectionInfo[] {
        return [
          { ...connectionInfo, id: 'b4148ca4-a8e2-42c8-a838-9890169f7e7d' },
          { ...connectionInfo, id: '9036dd5f-719b-46d1-b812-7e6348e1e9c9' }
        ];
      }
    });
    const fakeFs = { readFile: sinon.stub().resolves(fileContents) };
    const fn = loadAutoConnectInfo({
      file: 'filename',
      positionalArguments: ['9036dd5f-719b-46d1-b812-7e6348e1e9c9']
    }, fakeFs);
    const info = await fn?.();
    expect(info).to.deep.equal({ ...connectionInfo, id: '9036dd5f-719b-46d1-b812-7e6348e1e9c9' });
  });

  it('rejects an empty file even if an id has been specified', async function() {
    const fileContents = await exportConnections({
      loadConnections(): ConnectionInfo[] {
        return [];
      }
    });
    const fakeFs = { readFile: sinon.stub().resolves(fileContents) };
    const fn = loadAutoConnectInfo({ file: 'filename' }, fakeFs);
    try {
      await fn?.();
      expect.fail('missed exception');
    } catch (err: any) {
      expect(err.message).to.equal("No connection id specified and connection file 'filename' contained 0 entries");
    }
  });

  it('rejects an encrypted input file if no passphrase has been specifeid', async function() {
    const connectionInfo: ConnectionInfo = {
      id: 'e53a561c-142f-403e-9c2e-d591e58cf44b',
      connectionOptions: {
        connectionString: 'mongodb://localhost/'
      },
      favorite: { name: 'foo' }
    };
    const fileContents = await exportConnections({
      loadConnections(): ConnectionInfo[] {
        return [connectionInfo];
      },
      passphrase: 'p4ssw0rd'
    });
    const fakeFs = { readFile: sinon.stub().resolves(fileContents) };
    const fn = loadAutoConnectInfo({ file: 'filename' }, fakeFs);
    try {
      await fn?.();
      expect.fail('missed exception');
    } catch (err: any) {
      expect(err.message).to.equal("Input file contains encrypted secrets but no passphrase was provided");
    }
  });

  it('accepts an encrypted input file if an passphrase has been specifeid', async function() {
    const connectionInfo: ConnectionInfo = {
      id: 'e53a561c-142f-403e-9c2e-d591e58cf44b',
      connectionOptions: {
        connectionString: 'mongodb://localhost/'
      },
      favorite: { name: 'foo' }
    };
    const fileContents = await exportConnections({
      loadConnections(): ConnectionInfo[] {
        return [connectionInfo];
      },
      passphrase: 'p4ssw0rd'
    });
    const fakeFs = { readFile: sinon.stub().resolves(fileContents) };
    const fn = loadAutoConnectInfo({ file: 'filename', passphrase: 'p4ssw0rd' }, fakeFs);
    const info = await fn?.();
    expect(info).to.deep.equal(connectionInfo);
  });

  it('applies username and password if requested', async function() {
    const connectionString = 'mongodb://localhost/';
    const fn = loadAutoConnectInfo({ positionalArguments: [connectionString], username: 'user', password: 's€cr!t' });
    const info = await fn?.();
    expect(info?.id).to.be.a('string');
    expect(info?.connectionOptions).to.deep.equal({
      connectionString: 'mongodb://user:s%E2%82%ACcr!t@localhost/'
    });
  });
});
