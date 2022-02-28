import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import {
  getConnectionStringPassword,
  getConnectionStringUsername,
  parseAuthMechanismProperties,
  setConnectionStringPassword,
  setConnectionStringUsername,
  tryToParseConnectionString,
} from './connection-string-helpers';

describe('connection-string-helpers', function () {
  describe('#parseAuthMechanismProperties', function () {
    it('parses legit authMechanismProperties string', function () {
      const props = parseAuthMechanismProperties(
        new ConnectionStringUrl(
          'mongodb://localhost?authMechanismProperties=SERVICE_NAME:serviceName'
        )
      );

      expect(props.get('SERVICE_NAME')).to.equal('serviceName');
    });

    it('parses broken authMechanismProperties string as empty', function () {
      const props = parseAuthMechanismProperties(
        new ConnectionStringUrl(
          'mongodb://localhost?authMechanismProperties=broken'
        )
      );

      expect(props.get('SERVICE_NAME')).to.equal(undefined);
    });
  });

  describe('#tryToParseConnectionString', function () {
    it('should return the connection string when successfully parsed', function () {
      const [connectionString] = tryToParseConnectionString(
        'mongodb://outerspace:27099?directConnection=true'
      );

      expect(connectionString.toString()).to.equal(
        'mongodb://outerspace:27099/?directConnection=true'
      );
      expect(connectionString.hosts[0]).to.equal('outerspace:27099');
    });

    it('should return without an error when successfully parsed', function () {
      const [connectionString, error] = tryToParseConnectionString(
        'mongodb://outerspace:27099/?directConnection=true'
      );

      expect(connectionString).to.not.equal(undefined);
      expect(error).to.equal(undefined);
    });

    it('should return an error when it cannot be parsed', function () {
      const [connectionString, error] = tryToParseConnectionString(
        '-://pineapple:27099/?directConnection=true'
      );

      expect(connectionString).to.equal(undefined);
      expect(error.message).to.equal(
        'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
      );
    });

    it('should not return an error when the URL is valid but not a valid connection string', function () {
      const [connectionString, error] = tryToParseConnectionString(
        'mongos://pineapple:27099/?directConnection=true'
      );

      expect(connectionString.href).to.equal(
        'mongos://pineapple:27099/?directConnection=true'
      );
      expect(error).to.equal(undefined);
    });
  });

  describe('#getConnectionStringUsername', function () {
    it('returns a decoded username', function () {
      const username = getConnectionStringUsername(
        new ConnectionStringUrl(
          'mongodb://C%3BIb86n5b8%7BAnExew%5BTU%25XZy%2C)E6G!dk:password@outerspace:12345'
        )
      );

      expect(username).to.equal('C;Ib86n5b8{AnExew[TU%XZy,)E6G!dk');
    });
  });

  describe('#getConnectionStringPassword', function () {
    it('returns a decoded password', function () {
      const password = getConnectionStringPassword(
        new ConnectionStringUrl(
          'mongodb://username:C%3BIb86n5b8%7BAnExew%5BTU%25XZy%2C)E6G!dk@outerspace:12345'
        )
      );

      expect(password).to.equal('C;Ib86n5b8{AnExew[TU%XZy,)E6G!dk');
    });
  });

  describe('#setConnectionStringUsername', function () {
    it('sets an encoded username and does not mutate the param', function () {
      const connectionString = new ConnectionStringUrl(
        'mongodb://username:password@outerspace:12345'
      );

      expect(
        setConnectionStringUsername(
          connectionString,
          'C;Ib86n5b8{AnExew[TU%XZy,)E6G!dk'
        ).href
      ).to.equal(
        'mongodb://C%3BIb86n5b8%7BAnExew%5BTU%25XZy%2C)E6G!dk:password@outerspace:12345/'
      );

      expect(connectionString.href).to.equal(
        'mongodb://username:password@outerspace:12345/'
      );
    });
  });

  describe('#setConnectionStringPassword', function () {
    it('sets an encoded password and does not mutate the param', function () {
      const connectionString = new ConnectionStringUrl(
        'mongodb://username:password@outerspace:12345'
      );

      expect(
        setConnectionStringPassword(
          connectionString,
          'C;Ib86n5b8{AnExew[TU%XZy,)E6G!dk'
        ).href
      ).to.equal(
        'mongodb://username:C%3BIb86n5b8%7BAnExew%5BTU%25XZy%2C)E6G!dk@outerspace:12345/'
      );

      expect(connectionString.href).to.equal(
        'mongodb://username:password@outerspace:12345/'
      );
    });
  });
});
