import { expect } from 'chai';
import type { AuthMechanism, MongoClientOptions } from 'mongodb';
import ConnectionString from 'mongodb-connection-string-url';

import {
  getConnectionUrlWithoutAuth,
  handleUpdateUsername,
  handleUpdatePassword,
  handleUpdateAuthMechanism,
} from './authentication-handler';

const testConnectionString = 'mongodb://a123:b123@localhost';

describe('Authentication Handler', function () {
  describe('#handleUpdateUsername', function () {
    it('should update the username in the connection string', function () {
      const res = handleUpdateUsername({
        action: {
          type: 'update-username',
          username: 'pineapple',
        },
        connectionStringUrl: new ConnectionString(testConnectionString),
        connectionOptions: {
          connectionString: testConnectionString,
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://pineapple:b123@localhost/'
      );
      expect(res.errors).to.equal(undefined);
    });

    it('should update the username in the connection string when there is no username', function () {
      const res = handleUpdateUsername({
        action: {
          type: 'update-username',
          username: 'pineapple',
        },
        connectionStringUrl: new ConnectionString('mongodb://localhost'),
        connectionOptions: {
          connectionString: 'mongodb://localhost',
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://pineapple@localhost/'
      );
      expect(res.errors).to.equal(undefined);
    });

    it('should encode the username in the connection string', function () {
      const res = handleUpdateUsername({
        action: {
          type: 'update-username',
          username: 'C;Ib86n5b8{AnExew[TU%XZy,)E6G!dk;;',
        },
        connectionStringUrl: new ConnectionString('mongodb://before@localhost'),
        connectionOptions: {
          connectionString: 'mongodb://before@localhost',
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://C%3BIb86n5b8%7BAnExew%5BTU%25XZy%2C)E6G!dk%3B%3B@localhost/'
      );
      expect(res.errors).to.equal(undefined);
    });

    it('should not return an error if the connection string has a password and the username is being set to empty', function () {
      const res = handleUpdateUsername({
        action: {
          type: 'update-username',
          username: '',
        },
        connectionStringUrl: new ConnectionString(testConnectionString),
        connectionOptions: {
          connectionString: testConnectionString,
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://:b123@localhost/'
      );
      expect(res.errors).to.equal(undefined);
    });

    it('should remove the username field when being set to empty with no password', function () {
      const res = handleUpdateUsername({
        action: {
          type: 'update-username',
          username: '',
        },
        connectionStringUrl: new ConnectionString('mongodb://a123@localhost'),
        connectionOptions: {
          connectionString: 'mongodb://a123@localhost',
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://localhost/'
      );
      expect(res.errors).to.equal(undefined);
    });
  });

  describe('#handleUpdatePassword', function () {
    it('should update the password in the connection string', function () {
      const res = handleUpdatePassword({
        action: {
          type: 'update-password',
          password: 'pineapple',
        },
        connectionStringUrl: new ConnectionString(testConnectionString),
        connectionOptions: {
          connectionString: testConnectionString,
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://a123:pineapple@localhost/'
      );
      expect(res.errors).to.equal(undefined);
    });

    it('should password escape the password in the connection string', function () {
      const res = handleUpdatePassword({
        action: {
          type: 'update-password',
          password: 'p!n34pp e@@)s',
        },
        connectionStringUrl: new ConnectionString(testConnectionString),
        connectionOptions: {
          connectionString: testConnectionString,
        },
      });

      expect(res.errors).to.equal(undefined);
      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://a123:p!n34pp%20e%40%40)s@localhost/'
      );
    });

    it('should encode the password in the connection string', function () {
      const res = handleUpdatePassword({
        action: {
          type: 'update-password',
          password: 'C;Ib86n5b8{AnExew[TU%XZy,)E6G!dk;;',
        },
        connectionStringUrl: new ConnectionString(
          'mongodb://before:password@outerspaces'
        ),
        connectionOptions: {
          connectionString: 'mongodb://before:password@outerspaces',
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://before:C%3BIb86n5b8%7BAnExew%5BTU%25XZy%2C)E6G!dk%3B%3B@outerspaces/'
      );
      expect(res.errors).to.equal(undefined);
    });

    it('should return an error if the connection string has no username and the password is being set to not empty', function () {
      const res = handleUpdatePassword({
        action: {
          type: 'update-password',
          password: 'pineapple',
        },
        connectionStringUrl: new ConnectionString(
          'mongodb://localhost?authMechanism=DEFAULT'
        ),
        connectionOptions: {
          connectionString: 'mongodb://localhost/?authMechanism=DEFAULT',
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://:pineapple@localhost/?authMechanism=DEFAULT'
      );
      expect(res.errors).to.equal(undefined);
    });

    it('should remove the password field when being set to empty with a username', function () {
      const res = handleUpdatePassword({
        action: {
          type: 'update-password',
          password: '',
        },
        connectionStringUrl: new ConnectionString(testConnectionString),
        connectionOptions: {
          connectionString: testConnectionString,
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://a123@localhost/'
      );
      expect(res.errors).to.equal(undefined);
    });
  });

  describe('#handleUpdateAuthMechanism', function () {
    it('should update the authMechanism in the connection string when being set', function () {
      const res = handleUpdateAuthMechanism({
        action: {
          type: 'update-auth-mechanism',
          authMechanism: 'PLAIN',
        },
        connectionStringUrl: new ConnectionString(testConnectionString),
        connectionOptions: {
          connectionString: testConnectionString,
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://localhost/?authMechanism=PLAIN&authSource=%24external'
      );
      expect(res.errors).to.equal(undefined);
    });

    it('should set authSource=$external when needed', function () {
      const externalAuthMechanisms: AuthMechanism[] = [
        'MONGODB-AWS',
        'GSSAPI',
        'PLAIN',
        'MONGODB-X509',
      ];

      for (const authMechanism of externalAuthMechanisms) {
        const res = handleUpdateAuthMechanism({
          action: {
            type: 'update-auth-mechanism',
            authMechanism,
          },
          connectionStringUrl: new ConnectionString(testConnectionString),
          connectionOptions: {
            connectionString: testConnectionString,
          },
        });

        expect(res.connectionOptions.connectionString).to.equal(
          `mongodb://localhost/?authMechanism=${authMechanism}&authSource=%24external`
        );
      }
    });

    it('should not set authSource=$external when not needed', function () {
      const externalAuthMechanisms: AuthMechanism[] = [
        'MONGODB-CR',
        'DEFAULT',
        'SCRAM-SHA-1',
        'SCRAM-SHA-256',
      ];

      for (const authMechanism of externalAuthMechanisms) {
        const res = handleUpdateAuthMechanism({
          action: {
            type: 'update-auth-mechanism',
            authMechanism,
          },
          connectionStringUrl: new ConnectionString(testConnectionString),
          connectionOptions: {
            connectionString: testConnectionString,
          },
        });

        expect(res.connectionOptions.connectionString).to.equal(
          `mongodb://localhost/?authMechanism=${authMechanism}`
        );
      }
    });

    it('should remove the username/password field when being set to no auth', function () {
      const res = handleUpdateAuthMechanism({
        action: {
          type: 'update-auth-mechanism',
          authMechanism: null,
        },
        connectionStringUrl: new ConnectionString(testConnectionString),
        connectionOptions: {
          connectionString: testConnectionString,
        },
      });

      expect(res.connectionOptions.connectionString).to.equal(
        'mongodb://localhost/'
      );
      expect(res.errors).to.equal(undefined);
    });
  });

  describe('#getConnectionUrlWithoutAuth', function () {
    it('should remove the authMechanism in the connection string', function () {
      const res = getConnectionUrlWithoutAuth(
        new ConnectionString(
          'mongodb://a123:b123@localhost:27020/?authMechanism=PLAIN'
        )
      );

      expect(res.toString()).to.equal('mongodb://localhost:27020/');
      expect(
        res.typedSearchParams<MongoClientOptions>().get('authMechanism')
      ).to.equal(null);
    });

    it('should remove the username+password in the connection string', function () {
      const res = getConnectionUrlWithoutAuth(
        new ConnectionString(
          'mongodb://a123:b123@localhost:27020/?authMechanism=PLAIN'
        )
      );

      expect(res.toString()).to.equal('mongodb://localhost:27020/');
      expect(res.username).to.equal('');
      expect(res.password).to.equal('');
    });

    it('should remove the username in the connection string', function () {
      const res = getConnectionUrlWithoutAuth(
        new ConnectionString('mongodb://a123@localhost:27021')
      );

      expect(res.toString()).to.equal('mongodb://localhost:27021/');
      expect(res.username).to.equal('');
    });

    it('should remove the gssapiServiceName in the connection string', function () {
      const testString = new ConnectionString(
        'mongodb://a123@localhost:27020/?authMechanism=GSSAPI&gssapiServiceName=aaa'
      );
      expect(testString.searchParams.get('gssapiServiceName')).to.equal('aaa');
      const res = getConnectionUrlWithoutAuth(testString);

      expect(res.toString()).to.equal('mongodb://localhost:27020/');
      expect(res.searchParams.get('gssapiServiceName')).to.equal(null);
    });

    it('should remove the authMechanismProperties in the connection string', function () {
      const res = getConnectionUrlWithoutAuth(
        new ConnectionString(
          'mongodb://a123:b123@outerspace:27777/testdb?authSource=$external&authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN:super-secret'
        )
      );

      expect(res.toString()).to.equal('mongodb://outerspace:27777/testdb');
      expect(
        res
          .typedSearchParams<MongoClientOptions>()
          .get('authMechanismProperties')
      ).to.equal(null);
    });

    it('should remove authSource from the connection string', function () {
      const res = getConnectionUrlWithoutAuth(
        new ConnectionString(
          'mongodb://a123:b123@outerspace:27777/testdb?authSource=$external&authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN:super-secret'
        )
      );

      expect(res.toString()).to.equal('mongodb://outerspace:27777/testdb');
      expect(
        res.typedSearchParams<MongoClientOptions>().get('authSource')
      ).to.equal(null);
    });

    it('should do nothing to a connection string with no auth', function () {
      const res = getConnectionUrlWithoutAuth(
        new ConnectionString('mongodb+srv://kansas/?tls=true')
      );

      expect(res.toString()).to.equal('mongodb+srv://kansas/?tls=true');
    });
  });
});
