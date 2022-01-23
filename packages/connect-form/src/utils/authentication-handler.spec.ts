import { expect } from 'chai';
import ConnectionString from 'mongodb-connection-string-url';

import {
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

    it('should return an error if the connection string has a password and the username is being set to empty', function () {
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
        'mongodb://a123:b123@localhost'
      );
      expect(res.errors).to.deep.equal([
        {
          fieldName: 'username',
          message:
            'Username cannot be empty: "URI contained empty userinfo section"',
        },
      ]);
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
        'mongodb://localhost/?authMechanism=DEFAULT'
      );
      expect(res.errors).to.deep.equal([
        {
          fieldName: 'username',
          message:
            'Username cannot be empty: "URI contained empty userinfo section"',
        },
        {
          fieldName: 'password',
          message: 'Please enter a username first',
        },
      ]);
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
        'mongodb://a123:b123@localhost/?authMechanism=PLAIN'
      );
      expect(res.errors).to.equal(undefined);
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
});
