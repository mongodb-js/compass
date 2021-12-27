import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { MARKABLE_FORM_FIELD_NAMES } from '../constants/markable-form-fields';

import { handleUpdateConnectionOptions } from './connection-options-handler';

const connectionString = 'mongodb://a:b@outerspace:123/?ssl=false';

describe('#handleUpdateConnectionOptions', function () {
  it('should handle none tab update', function() {
    const response = handleUpdateConnectionOptions({
      currentTab: 'none',
      type: 'update-connection-options',
      key: undefined,
      value: undefined,
    }, {
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
    });

    expect(response.errors).to.deep.equal([{
      fieldName: undefined,
      message: 'message',
    }]);
    expect(response.warnings).to.deep.equal([]);
    expect(response.connectionStringInvalidError).to.be.null;
    expect(response.connectionStringUrl.toString()).to.equal(new ConnectionStringUrl(connectionString).toString());
    expect(response.connectionOptions.connectionString).to.equal(connectionString);
    expect(response.connectionOptions.sshTunnel).to.be.undefined;
  });

  it('should handle tab update with no initial options', function() {
    const response = handleUpdateConnectionOptions({
      currentTab: 'password',
      type: 'update-connection-options',
      key: 'host',
      value: 'localhost',
    }, {
      connectionOptions: {
        connectionString,
      },
      connectionStringInvalidError: null,
      connectionStringUrl: new ConnectionStringUrl(connectionString),
      errors: [],
      warnings: [],
    });

    expect(response.errors).to.deep.equal([]);
    expect(response.warnings).to.deep.equal([]);
    expect(response.connectionStringInvalidError).to.be.null;
    expect(response.connectionStringUrl.toString()).to.equal(new ConnectionStringUrl(connectionString).toString());
    expect(response.connectionOptions.connectionString).to.equal(connectionString);
    expect(response.connectionOptions.sshTunnel.host).to.equal('localhost');
    expect(response.connectionOptions.sshTunnel.port).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.username).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.password).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.identityKeyFile).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.identityKeyPassphrase).to.equal(undefined);
  });

  it('should handle tab update with initial options', function() {
    const response = handleUpdateConnectionOptions({
      currentTab: 'password',
      type: 'update-connection-options',
      key: 'host',
      value: 'localhosted',
    }, {
      connectionOptions: {
        connectionString,
        sshTunnel: {
          host: 'locahost',
          port: 22,
          username: 'root',
        }
      },
      connectionStringInvalidError: null,
      connectionStringUrl: new ConnectionStringUrl(connectionString),
      errors: [],
      warnings: [],
    });

    expect(response.errors).to.deep.equal([]);
    expect(response.warnings).to.deep.equal([]);
    expect(response.connectionStringInvalidError).to.be.null;
    expect(response.connectionStringUrl.toString()).to.equal(new ConnectionStringUrl(connectionString).toString());
    expect(response.connectionOptions.connectionString).to.equal(connectionString);
    expect(response.connectionOptions.sshTunnel.host).to.equal('localhosted');
    expect(response.connectionOptions.sshTunnel.port).to.equal(22);
    expect(response.connectionOptions.sshTunnel.username).to.equal('root');
    expect(response.connectionOptions.sshTunnel.password).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.identityKeyFile).to.equal(undefined);
    expect(response.connectionOptions.sshTunnel.identityKeyPassphrase).to.equal(undefined);
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  ['password', 'socks'].forEach((currentTab) => {
    describe(`validate ${currentTab} form`, function() {
      it('hosts field', function() {
        const response = handleUpdateConnectionOptions({
          currentTab,
          type: 'update-connection-options',
          key: 'host',
          value: 'localhost@',
        }, {
          connectionOptions: {
            connectionString,
          },
          connectionStringInvalidError: null,
          connectionStringUrl: new ConnectionStringUrl(connectionString),
          errors: [],
          warnings: [],
        });
    
        expect(response.errors).to.have.length(1);
        expect(response.errors[0].fieldName).to.equal(MARKABLE_FORM_FIELD_NAMES.IS_SSH);
        expect(response.errors[0].errors).to.have.key('host');
      });
      it('port field', function() {
        const response = handleUpdateConnectionOptions({
          currentTab,
          type: 'update-connection-options',
          key: 'port',
          value: 0,
        }, {
          connectionOptions: {
            connectionString,
          },
          connectionStringInvalidError: null,
          connectionStringUrl: new ConnectionStringUrl(connectionString),
          errors: [],
          warnings: [],
        });
    
        expect(response.errors).to.have.length(1);
        expect(response.errors[0].fieldName).to.equal(MARKABLE_FORM_FIELD_NAMES.IS_SSH);
        expect(response.errors[0].errors).to.have.key('port');
      });
      it('username field', function() {
        const response = handleUpdateConnectionOptions({
          currentTab,
          type: 'update-connection-options',
          key: 'username',
          value: '',
        }, {
          connectionOptions: {
            connectionString,
            sshTunnel: {
              password: '1234'
            },
          },
          connectionStringInvalidError: null,
          connectionStringUrl: new ConnectionStringUrl(connectionString),
          errors: [],
          warnings: [],
        });
    
        expect(response.errors).to.have.length(1);
        expect(response.errors[0].fieldName).to.equal(MARKABLE_FORM_FIELD_NAMES.IS_SSH);
        expect(response.errors[0].errors, 'username is required with password').to.have.key('username');
      });
      it('password field', function() {
        const response = handleUpdateConnectionOptions({
          currentTab,
          type: 'update-connection-options',
          key: 'password',
          value: '12',
        }, {
          connectionOptions: {
            connectionString,
          },
          connectionStringInvalidError: null,
          connectionStringUrl: new ConnectionStringUrl(connectionString),
          errors: [],
          warnings: [],
        });
    
        expect(response.errors).to.have.length(1);
        expect(response.errors[0].fieldName).to.equal(MARKABLE_FORM_FIELD_NAMES.IS_SSH);
        expect(response.errors[0].errors, 'username is required with password').to.have.key('username');
      });
    });
  });

  describe('validate identity form', function() {
    it('hosts field', function() {
      const response = handleUpdateConnectionOptions({
        currentTab: 'identity',
        type: 'update-connection-options',
        key: 'host',
        value: 'localhost@',
      }, {
        connectionOptions: {
          connectionString,
        },
        connectionStringInvalidError: null,
        connectionStringUrl: new ConnectionStringUrl(connectionString),
        errors: [],
        warnings: [],
      });
  
      expect(response.errors).to.have.length(1);
      expect(response.errors[0].fieldName).to.equal(MARKABLE_FORM_FIELD_NAMES.IS_SSH);
      expect(response.errors[0].errors).to.have.key('host');
    });
    it('port field', function() {
      const response = handleUpdateConnectionOptions({
        currentTab: 'identity',
        type: 'update-connection-options',
        key: 'port',
        value: 0,
      }, {
        connectionOptions: {
          connectionString,
        },
        connectionStringInvalidError: null,
        connectionStringUrl: new ConnectionStringUrl(connectionString),
        errors: [],
        warnings: [],
      });
  
      expect(response.errors).to.have.length(1);
      expect(response.errors[0].fieldName).to.equal(MARKABLE_FORM_FIELD_NAMES.IS_SSH);
      expect(response.errors[0].errors).to.have.key('port');
    });
    it('username field', function() {
      const response = handleUpdateConnectionOptions({
        currentTab: 'identity',
        type: 'update-connection-options',
        key: 'username',
        value: '',
      }, {
        connectionOptions: {
          connectionString,
          sshTunnel: {
            identityKeyFile: '1234'
          },
        },
        connectionStringInvalidError: null,
        connectionStringUrl: new ConnectionStringUrl(connectionString),
        errors: [],
        warnings: [],
      });
  
      expect(response.errors).to.have.length(1);
      expect(response.errors[0].fieldName).to.equal(MARKABLE_FORM_FIELD_NAMES.IS_SSH);
      expect(response.errors[0].errors, 'username is required with file').to.have.key('username');
    });
    it('file field', function() {
      const response = handleUpdateConnectionOptions({
        currentTab: 'identity',
        type: 'update-connection-options',
        key: 'identityKeyFile',
        value: 'file',
      }, {
        connectionOptions: {
          connectionString,
          sshTunnel: {
            username: '',
          }
        },
        connectionStringInvalidError: null,
        connectionStringUrl: new ConnectionStringUrl(connectionString),
        errors: [],
        warnings: [],
      });
  
      expect(response.errors).to.have.length(1);
      expect(response.errors[0].fieldName).to.equal(MARKABLE_FORM_FIELD_NAMES.IS_SSH);
      expect(response.errors[0].errors, 'username is required with file').to.have.key('username');
    });
    it('passphrase field', function() {
      const response = handleUpdateConnectionOptions({
        currentTab: 'identity',
        type: 'update-connection-options',
        key: 'identityKeyPassphrase',
        value: '12',
      }, {
        connectionOptions: {
          connectionString,
        },
        connectionStringInvalidError: null,
        connectionStringUrl: new ConnectionStringUrl(connectionString),
        errors: [],
        warnings: [],
      });
  
      expect(response.errors).to.have.length(1);
      expect(response.errors[0].fieldName).to.equal(MARKABLE_FORM_FIELD_NAMES.IS_SSH);
      expect(Object.keys(response.errors[0].errors), 'username is required with passphrase').to.contain('username');
      expect(Object.keys(response.errors[0].errors), 'identityKeyFile is required with passphrase').to.contain('identityKeyFile');
    });
  });
});