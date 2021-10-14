import { expect } from 'chai';
import util from 'util';

import { ConnectionInfo } from '../connection-info';

import {
  convertConnectionModelToInfo,
  LegacyConnectionModelProperties,
} from './legacy-connection-model';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ConnectionModel = require('mongodb-connection-model');

async function createAndConvertModel(
  connectionString: string,
  additionalOptions?: Partial<LegacyConnectionModelProperties>
): Promise<ConnectionInfo> {
  const model = await util.promisify(ConnectionModel.from)(connectionString);
  Object.assign(model, additionalOptions ?? {});
  return convertConnectionModelToInfo(model);
}

describe('convertConnectionModelToInfo', function () {
  it('converts _id', async function () {
    const { id } = await createAndConvertModel(
      'mongodb://localhost:27017/admin',
      { _id: '1234-1234-1234-1234' }
    );

    expect(id).to.deep.equal('1234-1234-1234-1234');
  });

  it('converts favorite', async function () {
    const { favorite } = await createAndConvertModel(
      'mongodb://localhost:27017/admin',
      {
        _id: '1234-1234-1234-1234',
        isFavorite: true,
        name: 'Connection 1',
        color: '#00000',
      }
    );

    expect(favorite).to.deep.equal({
      name: 'Connection 1',
      color: '#00000',
    });
  });

  it('converts anon local string', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://localhost:27017/admin',
      { _id: '1234-1234-1234-1234' }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/admin?readPreference=primary&directConnection=true&ssl=false',
    });
  });

  it('converts username and password', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://user:password@localhost/admin',
      { _id: '1234-1234-1234-1234' }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://user:password@localhost:27017/admin?authSource=admin&readPreference=primary&directConnection=true&ssl=false',
    });
  });

  it('converts SSL true', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://user:password@localhost/admin?ssl=true',
      { _id: '1234-1234-1234-1234' }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://user:password@localhost:27017/admin?authSource=admin&readPreference=primary&directConnection=true&ssl=true',
    });
  });

  it('converts sslMethod ALL', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://user:password@localhost/admin?ssl=true',
      {
        _id: '1234-1234-1234-1234',
        sslMethod: 'ALL',
        ssl: true,
        sslCA: ['pathToCaFile'],
        sslCert: 'pathToCertKey',
        sslKey: 'pathToCertKey',
      }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://user:password@localhost:27017/admin?' +
        'authSource=admin&readPreference=primary&directConnection=true' +
        '&ssl=true' +
        '&tlsCAFile=pathToCaFile' +
        '&tlsCertificateKeyFile=pathToCertKey',
    });
  });

  it('stores sslCert as tlsCertificateFile if different from sslKey', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://user:password@localhost/admin?ssl=true',
      {
        _id: '1234-1234-1234-1234',
        sslMethod: 'ALL',
        ssl: true,
        sslCA: ['pathToCaFile'],
        sslCert: 'pathToCertKey1',
        sslKey: 'pathToCertKey2',
      }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://user:password@localhost:27017/admin?' +
        'authSource=admin&readPreference=primary&directConnection=true' +
        '&ssl=true' +
        '&tlsCAFile=pathToCaFile' +
        '&tlsCertificateKeyFile=pathToCertKey2',
      tlsCertificateFile: 'pathToCertKey1',
    });
  });

  it('converts extra options', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://localhost:27017?&socketTimeoutMS=2000'
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/' +
        '?socketTimeoutMS=2000&readPreference=primary&directConnection=true&ssl=false',
    });
  });

  it('keeps SRV url intact', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb+srv://compass-data-sets.e06dc.mongodb.net'
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb+srv://compass-data-sets.e06dc.mongodb.net/' +
        '?replicaSet=compass-data-sets-shard-0&readPreference=primary&authSource=admin&ssl=true',
    });
  });

  it('converts ssh tunnel options (USER_PASSWORD)', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://localhost:27017',
      {
        sshTunnel: 'USER_PASSWORD',
        sshTunnelHostname: 'jumphost',
        sshTunnelPort: 22,
        sshTunnelUsername: 'root',
      }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/' +
        '?readPreference=primary&directConnection=true&ssl=false',
      sshTunnel: {
        host: 'jumphost',
        port: 22,
        username: 'root',
      },
    });
  });

  it('converts ssh tunnel options (IDENTITY_FILE)', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://localhost:27017',
      {
        sshTunnel: 'IDENTITY_FILE',
        sshTunnelHostname: 'jumphost',
        sshTunnelPort: 22,
        sshTunnelUsername: 'root',
        sshTunnelIdentityFile: 'myfile',
      }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/' +
        '?readPreference=primary&directConnection=true&ssl=false',
      sshTunnel: {
        host: 'jumphost',
        port: 22,
        identityKeyFile: 'myfile',
        username: 'root',
      },
    });
  });

  it('converts ssh tunnel options (IDENTITY_FILE) + passphrase', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://localhost:27017',
      {
        sshTunnel: 'IDENTITY_FILE',
        sshTunnelHostname: 'jumphost',
        sshTunnelPort: 22,
        sshTunnelUsername: 'root',
        sshTunnelIdentityFile: 'myfile',
        sshTunnelPassphrase: 'passphrase',
      }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/' +
        '?readPreference=primary&directConnection=true&ssl=false',
      sshTunnel: {
        host: 'jumphost',
        port: 22,
        identityKeyFile: 'myfile',
        identityKeyPassphrase: 'passphrase',
        username: 'root',
      },
    });
  });
});
