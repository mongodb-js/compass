import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { handleUpdateSshOptions } from './connection-ssh-handler';

const connectionString = 'mongodb://a:b@outerspace:123/?ssl=false';

describe('#handleUpdateSshOptions', function () {
  it('should handle none tab update', function () {
    const response = handleUpdateSshOptions(
      {
        currentTab: 'none',
        type: 'update-ssh-options',
        key: undefined,
        value: undefined,
      },
      {
        connectionOptions: {
          connectionString,
        },
        connectionStringInvalidError: null,
        connectionStringUrl: new ConnectionStringUrl(connectionString),
        errors: [
          {
            fieldName: undefined,
            message: 'message',
          },
        ],
        warnings: [],
      }
    );

    expect(response.errors).to.deep.equal([
      {
        fieldName: undefined,
        message: 'message',
      },
    ]);
    expect(response.warnings).to.deep.equal([]);
    expect(response.connectionStringInvalidError).to.be.null;
    expect(response.connectionStringUrl.toString()).to.equal(
      new ConnectionStringUrl(connectionString).toString()
    );
    expect(response.connectionOptions.connectionString).to.equal(
      connectionString
    );
    expect(response.connectionOptions.sshTunnel).to.be.undefined;
  });

  it('should handle tab update with no initial options', function () {
    const response = handleUpdateSshOptions(
      {
        currentTab: 'password',
        type: 'update-ssh-options',
        key: 'host',
        value: 'localhost',
      },
      {
        connectionOptions: {
          connectionString,
        },
        connectionStringInvalidError: null,
        connectionStringUrl: new ConnectionStringUrl(connectionString),
        errors: [],
        warnings: [],
      }
    );

    expect(response.errors).to.deep.equal([]);
    expect(response.warnings).to.deep.equal([]);
    expect(response.connectionStringInvalidError).to.be.null;
    expect(response.connectionStringUrl.toString()).to.equal(
      new ConnectionStringUrl(connectionString).toString()
    );
    expect(response.connectionOptions.connectionString).to.equal(
      connectionString
    );
    expect(response.connectionOptions.sshTunnel.host).to.equal('localhost');
    expect(response.connectionOptions.sshTunnel.port).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.username).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.password).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.identityKeyFile).to.equal(
      undefined
    );
    expect(response.connectionOptions.sshTunnel.identityKeyPassphrase).to.equal(
      undefined
    );
  });

  it('should handle tab update with initial options', function () {
    const response = handleUpdateSshOptions(
      {
        currentTab: 'password',
        type: 'update-ssh-options',
        key: 'host',
        value: 'localhosted',
      },
      {
        connectionOptions: {
          connectionString,
          sshTunnel: {
            host: 'locahost',
            port: 22,
            username: 'root',
          },
        },
        connectionStringInvalidError: null,
        connectionStringUrl: new ConnectionStringUrl(connectionString),
        errors: [],
        warnings: [],
      }
    );

    expect(response.errors).to.deep.equal([]);
    expect(response.warnings).to.deep.equal([]);
    expect(response.connectionStringInvalidError).to.be.null;
    expect(response.connectionStringUrl.toString()).to.equal(
      new ConnectionStringUrl(connectionString).toString()
    );
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
