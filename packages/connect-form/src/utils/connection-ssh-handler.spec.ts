import { expect } from 'chai';

import { handleUpdateSshOptions } from './connection-ssh-handler';

const connectionString = 'mongodb://a:b@outerspace:123/?ssl=false';

describe('#handleUpdateSshOptions', function () {
  it('should handle tab update with no initial options', function () {
    const response = handleUpdateSshOptions({
      action: {
        type: 'update-ssh-options',
        key: 'host',
        value: 'localhost',
      },
      connectionOptions: {
        connectionString,
      },
    });

    expect(response.connectionOptions.connectionString).to.equal(
      connectionString
    );
    expect(response.connectionOptions.sshTunnel.host).to.equal('localhost');
    expect(response.connectionOptions.sshTunnel.port).to.equal(22);
    expect(response.connectionOptions.sshTunnel.username).to.equal('');
    expect(response.connectionOptions.sshTunnel.password).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.identityKeyFile).to.equal(
      undefined
    );
    expect(response.connectionOptions.sshTunnel.identityKeyPassphrase).to.equal(
      undefined
    );
  });

  it('should handle tab update with initial options', function () {
    const response = handleUpdateSshOptions({
      action: {
        type: 'update-ssh-options',
        key: 'host',
        value: 'localhosted',
      },
      connectionOptions: {
        connectionString,
        sshTunnel: {
          host: 'locahost',
          port: 22,
          username: 'root',
        },
      },
    });

    expect(response.connectionOptions.connectionString).to.equal(
      connectionString
    );
    expect(response.connectionOptions.sshTunnel.host).to.equal('localhosted');
    expect(response.connectionOptions.sshTunnel.port).to.equal(22);
    expect(response.connectionOptions.sshTunnel.username).to.equal('root');
    expect(response.connectionOptions.sshTunnel.password).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.identityKeyFile).to.equal(
      undefined
    );
    expect(response.connectionOptions.sshTunnel.identityKeyPassphrase).to.equal(
      undefined
    );
  });
});
