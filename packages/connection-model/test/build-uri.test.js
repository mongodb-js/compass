const Connection = require('../');
const chai = require('chai');
const fs = require('fs');
const sslFixture = require('./__fixtures__/ssl');
const expect = chai.expect;
const loadOptions = Connection.connect.loadOptions;
const getTasks = Connection.connect.getTasks;
const encodeURIComponentRFC3986 = Connection.encodeURIComponentRFC3986;

chai.use(require('chai-subset'));

describe('Connection model builder', () => {
  context('when building URI', () => {
    it('should include default host, port, readPreference and ssl', (done) => {
      const c = new Connection();

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&ssl=false'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include appname', (done) => {
      const c = new Connection({ appname: 'My App' });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&appname=My%20App&ssl=false'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include srv prefix', () => {
      const c = new Connection({ isSrvRecord: true });

      expect(c.driverUrl).to.be.equal(
        'mongodb+srv://localhost/?readPreference=primary&ssl=false'
      );
    });

    it('should include replicaSet', (done) => {
      const c = new Connection({ appname: 'My App', replicaSet: 'testing' });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?replicaSet=testing&readPreference=primary&appname=My%20App&ssl=false'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('does not include empty replicaSet', (done) => {
      const c = new Connection({ appname: 'My App', replicaSet: '' });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&appname=My%20App&ssl=false'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include sslMethod equal NONE', (done) => {
      const c = new Connection({ sslMethod: 'NONE' });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&ssl=false'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include sslMethod equal UNVALIDATED', (done) => {
      const c = new Connection({ sslMethod: 'UNVALIDATED' });
      const options = Object.assign({}, Connection.DRIVER_OPTIONS_DEFAULT, {
        checkServerIdentity: false,
        sslValidate: false,
        readPreference: 'primary',
        connectWithNoPrimary: true
      });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&ssl=true'
      );
      expect(c.driverOptions).to.deep.equal(options);

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include sslMethod equal SYSTEMCA', (done) => {
      const c = new Connection({ sslMethod: 'SYSTEMCA' });
      const options = Object.assign({}, Connection.DRIVER_OPTIONS_DEFAULT, {
        checkServerIdentity: true,
        sslValidate: true,
        readPreference: 'primary',
        connectWithNoPrimary: true
      });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&ssl=true'
      );
      expect(c.driverOptions).to.deep.equal(options);

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include sslMethod equal IFAVAILABLE', (done) => {
      const c = new Connection({ sslMethod: 'IFAVAILABLE' });
      const options = Object.assign({}, Connection.DRIVER_OPTIONS_DEFAULT, {
        checkServerIdentity: false,
        sslValidate: true,
        readPreference: 'primary',
        connectWithNoPrimary: true
      });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&ssl=prefer'
      );
      expect(c.driverOptions).to.deep.equal(options);

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include sslMethod equal SERVER', (done) => {
      const c = new Connection({ sslMethod: 'SERVER', sslCA: sslFixture.ca });
      const options = Object.assign({}, Connection.DRIVER_OPTIONS_DEFAULT, {
        sslCA: [sslFixture.ca],
        sslValidate: true,
        readPreference: 'primary',
        connectWithNoPrimary: true
      });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&ssl=true'
      );
      expect(c.driverOptions).to.deep.equal(options);

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include sslMethod equal ALL and authMechanism equal X509', (done) => {
      const c = new Connection({
        sslMethod: 'ALL',
        sslCA: sslFixture.ca,
        sslCert: sslFixture.server,
        sslKey: sslFixture.server,
        authStrategy: 'X509',
        x509Username: 'testing'
      });
      const options = Object.assign({}, Connection.DRIVER_OPTIONS_DEFAULT, {
        sslCA: [sslFixture.ca],
        sslCert: sslFixture.server,
        sslKey: sslFixture.server,
        checkServerIdentity: false,
        sslValidate: false,
        readPreference: 'primary',
        connectWithNoPrimary: true
      });

      expect(c.driverUrl).to.be.equal(
        'mongodb://testing@localhost:27017/?authMechanism=MONGODB-X509&readPreference=primary&ssl=true&authSource=$external'
      );
      expect(c.driverOptions).to.deep.equal(options);

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include sslMethod equal ALL and passwordless private keys', (done) => {
      const c = new Connection({
        sslMethod: 'ALL',
        sslCA: sslFixture.ca,
        sslCert: sslFixture.server,
        sslKey: sslFixture.server
      });
      const options = Object.assign({}, Connection.DRIVER_OPTIONS_DEFAULT, {
        sslCA: [sslFixture.ca],
        sslCert: sslFixture.server,
        sslKey: sslFixture.server,
        sslValidate: true,
        readPreference: 'primary',
        connectWithNoPrimary: true
      });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&ssl=true'
      );
      expect(c.driverOptions).to.deep.equal(options);

      /* eslint-disable no-sync */
      const expectAfterLoad = {
        sslCA: [fs.readFileSync(sslFixture.ca)],
        sslCert: fs.readFileSync(sslFixture.server),
        sslKey: fs.readFileSync(sslFixture.server),
        sslValidate: true,
        connectWithNoPrimary: true,
        readPreference: 'primary'
      };
      /* eslint-enable no-sync */
      const tasks = getTasks(c);
      // Trigger relevant side-effect, loading the SSL files into memory.
      // eslint-disable-next-line new-cap
      tasks['Load SSL files'](function () {
        // Read files into memory as the connect function does
        expect(tasks.driverOptions).to.deep.equal(expectAfterLoad);
        done();
      });
    });

    it('should include sslMethod equal ALL and password protected private keys', (done) => {
      const c = new Connection({
        sslMethod: 'ALL',
        sslCA: sslFixture.ca,
        sslCert: sslFixture.server,
        sslKey: sslFixture.server,
        sslPass: 'woof'
      });
      const options = Object.assign({}, Connection.DRIVER_OPTIONS_DEFAULT, {
        sslCA: [sslFixture.ca],
        sslCert: sslFixture.server,
        sslKey: sslFixture.server,
        sslPass: 'woof',
        sslValidate: true,
        connectWithNoPrimary: true,
        readPreference: 'primary'
      });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=primary&ssl=true'
      );
      expect(c.driverOptions).to.deep.equal(options);

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should convert sslCA into an array', (done) => {
      const c = new Connection({ sslCA: sslFixture.ca });

      expect(Array.isArray(c.sslCA)).to.be.equal(true);

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode credentials when using SCRAM-SHA-256 auth', (done) => {
      const c = new Connection({
        mongodbUsername: '@rlo',
        mongodbPassword: 'w@of',
        authStrategy: 'SCRAM-SHA-256'
      });

      expect(c.driverUrl).to.be.equal(
        'mongodb://%40rlo:w%40of@localhost:27017/?authSource=admin&authMechanism=SCRAM-SHA-256&readPreference=primary&ssl=false'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode credentials when using no auth', (done) => {
      const c = new Connection({
        mongodbUsername: '@rlo',
        mongodbPassword: 'w@of'
      });

      expect(c.driverUrl).to.be.equal(
        'mongodb://%40rlo:w%40of@localhost:27017/?authSource=admin&readPreference=primary&ssl=false'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode credentials when using MONGODB auth', (done) => {
      const mongodbUsername = 'user';
      const mongodbPassword = 'C;Ib86n5b8{AnExew[TU%XZy,)E6G!dk';
      const c = new Connection({ mongodbUsername, mongodbPassword });

      expect(c.driverUrl).to.be.equal(
        'mongodb://user:C%3BIb86n5b8%7BAnExew%5BTU%25XZy%2C%29E6G%21dk@localhost:27017/?authSource=admin&readPreference=primary&ssl=false'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode credentials when using MONGODB auth with emoji 💕', (done) => {
      const mongodbUsername = '👌emoji😂😍😘🔥💕🎁💯🌹';
      const mongodbPassword = '👌emoji😂😍😘🔥💕🎁💯🌹';
      const c = new Connection({ mongodbUsername, mongodbPassword });

      expect(c.driverUrl).to.be.equal(
        [
          'mongodb://',
          '%F0%9F%91%8Cemoji%F0%9F%98%82%F0%9F%98%8D%F0%9F%98%98%F0%9F%94%A5%F0%9F%92%95%F0%9F%8E%81%F0%9F%92%AF%F0%9F%8C%B9',
          ':',
          '%F0%9F%91%8Cemoji%F0%9F%98%82%F0%9F%98%8D%F0%9F%98%98%F0%9F%94%A5%F0%9F%92%95%F0%9F%8E%81%F0%9F%92%AF%F0%9F%8C%B9',
          '@localhost:27017/?authSource=admin&readPreference=primary&ssl=false'
        ].join('')
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode credentials when using LDAP auth', (done) => {
      const ldapUsername = 'user@-azMPk]&3Wt)iP_9C:PMQ=';
      const ldapPassword = 'user@-azMPk]&3Wt)iP_9C:PMQ=';
      const c = new Connection({ ldapUsername, ldapPassword });

      expect(c.driverUrl).to.be.equal(
        [
          'mongodb://user%40-azMPk%5D%263Wt%29iP_9C%3APMQ%3D:user%40-azMPk%5D%263Wt%29iP_9C%3APMQ%3D',
          '@localhost:27017/?authMechanism=PLAIN&readPreference=primary&ssl=false&authSource=$external'
        ].join('')
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode credentials when using KERBEROS auth', (done) => {
      const kerberosPrincipal = 'user@-azMPk]&3Wt)iP_9C:PMQ=';
      const c = new Connection({ kerberosPrincipal });

      expect(c.driverUrl).to.be.equal(
        [
          'mongodb://user%40-azMPk%5D%263Wt%29iP_9C%3APMQ%3D',
          '@localhost:27017/?gssapiServiceName=mongodb&authMechanism=GSSAPI&readPreference=primary&ssl=false&authSource=$external'
        ].join('')
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode credentials when using KERBEROS auth with canonicalizing the host name', (done) => {
      const kerberosPrincipal = 'user@-azMPk]&3Wt)iP_9C:PMQ=';
      const c = new Connection({
        kerberosCanonicalizeHostname: true,
        kerberosPrincipal,
      });

      expect(c.driverUrl).to.be.equal(
        [
          'mongodb://user%40-azMPk%5D%263Wt%29iP_9C%3APMQ%3D',
          '@localhost:27017/?gssapiServiceName=mongodb&authMechanism=GSSAPI&readPreference=primary&ssl=false&authSource=$external&authMechanismProperties=CANONICALIZE_HOST_NAME:true'
        ].join('')
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should replace default readPreference with a custom value', (done) => {
      const c = new Connection({ readPreference: 'secondary' });

      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?readPreference=secondary&ssl=false'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should build safeUrl for LDAP auth', (done) => {
      const attrs = {
        ldapUsername: 'ldap-user',
        ldapPassword: 'ldap-password',
        authStrategy: 'LDAP'
      };
      const c = new Connection(attrs);

      expect(c.driverUrl).to.be.equal(
        'mongodb://ldap-user:ldap-password@localhost:27017/?authMechanism=PLAIN&readPreference=primary&ssl=false&authSource=$external'
      );
      expect(c.safeUrl).to.be.equal(
        'mongodb://ldap-user:*****@localhost:27017/?authMechanism=PLAIN&readPreference=primary&ssl=false&authSource=$external'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should include non-dependent attribute', (done) => {
      const c = new Connection({ authStrategy: 'LDAP' });

      c.ldapUsername = 'ldap-user';
      c.ldapPassword = 'ldap-password';

      expect(c.driverUrl).to.be.equal(
        'mongodb://ldap-user:ldap-password@localhost:27017/?authMechanism=PLAIN&readPreference=primary&ssl=false&authSource=$external'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode ldapPassword when using LDAP auth', (done) => {
      const c = new Connection({
        authStrategy: 'LDAP',
        ldapUsername: 'arlo',
        ldapPassword: 'w@of',
        ns: 'ldap'
      });

      expect(c.driverAuthMechanism).to.be.equal('PLAIN');
      expect(c.driverUrl).to.be.equal(
        'mongodb://arlo:w%40of@localhost:27017/ldap?authMechanism=PLAIN&readPreference=primary&ssl=false&authSource=$external'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode ldapUsername when using LDAP auth', (done) => {
      // COMPASS-745 - should urlencode @ once onl
      const c = new Connection({
        authStrategy: 'LDAP',
        ldapUsername: 'arlo@t.co',
        ldapPassword: 'woof',
        ns: 'ldap'
      });

      expect(c.driverAuthMechanism).to.be.equal('PLAIN');
      expect(c.driverUrl).to.be.equal(
        'mongodb://arlo%40t.co:woof@localhost:27017/ldap?authMechanism=PLAIN&readPreference=primary&ssl=false&authSource=$external'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should urlencode credentials when using X509 auth', (done) => {
      const c = new Connection({
        authStrategy: 'X509',
        x509Username:
          'CN=client,OU=kerneluser:info,O=10Gen,L=New York City,ST=New York,C=US'
      });

      expect(c.driverAuthMechanism).to.be.equal('MONGODB-X509');
      expect(c.driverUrl).to.be.equal(
        'mongodb://CN%3Dclient%2COU%3Dkerneluser%3Ainfo%2CO%3D10Gen%2CL%3DNew%20York%20City' +
          '%2CST%3DNew%20York%2CC%3DUS@localhost:27017/' +
          '?authMechanism=MONGODB-X509&readPreference=primary&ssl=false&authSource=$external'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });

    it('should not include credentials when using X509 auth and there is no username', (done) => {
      const c = new Connection({
        authStrategy: 'X509'
      });

      expect(c.driverAuthMechanism).to.be.equal('MONGODB-X509');
      expect(c.driverUrl).to.be.equal(
        'mongodb://localhost:27017/?authMechanism=MONGODB-X509' +
          '&readPreference=primary&ssl=false&authSource=$external'
      );

      Connection.from(c.driverUrl, (error) => {
        expect(error).to.not.exist;
        done();
      });
    });
  });

  context('when building a connection object', () => {
    context('authStrategy', () => {
      it('should set authStrategy to SCRAM-SHA-256', (done) => {
        const c = new Connection({
          mongodbUsername: 'arlo',
          mongodbPassword: 'woof',
          authStrategy: 'SCRAM-SHA-256'
        });

        expect(c.authStrategy).to.be.equal('SCRAM-SHA-256');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set default admin authSource when using SCRAM-SHA-256 auth', (done) => {
        const attrs = {
          mongodbUsername: 'arlo',
          mongodbPassword: 'woof',
          authStrategy: 'SCRAM-SHA-256'
        };
        const c = new Connection(attrs);

        expect(c.driverUrl).to.be.equal(
          'mongodb://arlo:woof@localhost:27017/?authSource=admin&authMechanism=SCRAM-SHA-256&readPreference=primary&ssl=false'
        );

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should build safeUrl for SCRAM-SHA-256 auth', (done) => {
        const attrs = {
          mongodbUsername: 'arlo',
          mongodbPassword: 'woof',
          authStrategy: 'SCRAM-SHA-256'
        };
        const c = new Connection(attrs);

        expect(c.driverUrl).to.be.equal(
          'mongodb://arlo:woof@localhost:27017/?authSource=admin&authMechanism=SCRAM-SHA-256&readPreference=primary&ssl=false'
        );
        expect(c.safeUrl).to.be.equal(
          'mongodb://arlo:*****@localhost:27017/?authSource=admin&authMechanism=SCRAM-SHA-256&readPreference=primary&ssl=false'
        );

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should throw the error if auth is SCRAM-SHA-256 and mongodbUsername is missing', () => {
        const attrs = {
          authStrategy: 'SCRAM-SHA-256',
          mongodbPassword: 'woof'
        };
        const c = new Connection(attrs);
        const error = c.validate(attrs);

        expect(c.isValid()).to.be.equal(false);
        expect(error.message).to.include('The \'Username\' field is required when using \'Username/Password\' or \'SCRAM-SHA-256\' for authentication.');
      });

      it('should throw the error if auth is SCRAM-SHA-256 and mongodbPassword is missing', () => {
        const attrs = {
          mongodbUsername: 'arlo',
          authStrategy: 'SCRAM-SHA-256'
        };
        const c = new Connection(attrs);
        const error = c.validate(attrs);

        expect(c.isValid()).to.be.equal(false);
        expect(error.message).to.equal('The \'Password\' field is required when using \'Username/Password\' or \'SCRAM-SHA-256\' for authentication.');
      });

      it('should throw the error if MONGODB auth receives non-applicable fields', () => {
        const attrs = {
          mongodbUsername: 'arlo',
          mongodbPassword: 'woof',
          kerberosServiceName: 'mongodb'
        };
        const c = new Connection(attrs);
        const error = c.validate(attrs);

        expect(c.isValid()).to.be.equal(false);
        expect(error.message).to.equal(
          'The Kerberos \'Service Name\' field does not apply when using MONGODB for authentication.'
        );
      });

      it('should set authStrategy to MONGODB', (done) => {
        const c = new Connection({
          mongodbUsername: 'arlo',
          mongodbPassword: 'woof'
        });

        expect(c.authStrategy).to.be.equal('MONGODB');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set default admin authSource when using MONGODB auth', (done) => {
        const attrs = {
          authStrategy: 'MONGODB',
          mongodbUsername: 'user',
          mongodbPassword: 'somepass'
        };
        const c = new Connection(attrs);

        expect(c.driverUrl).to.be.equal(
          'mongodb://user:somepass@localhost:27017/?authSource=admin&readPreference=primary&ssl=false'
        );

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should build safeUrl for MONGODB auth', (done) => {
        const attrs = {
          authStrategy: 'MONGODB',
          mongodbUsername: 'user',
          mongodbPassword: 'somepass'
        };
        const c = new Connection(attrs);

        expect(c.driverUrl).to.be.equal(
          'mongodb://user:somepass@localhost:27017/?authSource=admin&readPreference=primary&ssl=false'
        );
        expect(c.safeUrl).to.be.equal(
          'mongodb://user:*****@localhost:27017/?authSource=admin&readPreference=primary&ssl=false'
        );

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should throw the error if auth is MONGODB and mongodbUsername is missing', () => {
        const attrs = { authStrategy: 'MONGODB', mongodbPassword: 'woof' };
        const c = new Connection(attrs);
        const error = c.validate(attrs);

        expect(c.isValid()).to.be.equal(false);
        expect(error.message).to.include('The \'Username\' field is required when using \'Username/Password\' or \'SCRAM-SHA-256\' for authentication.');
      });

      it('should throw the error if auth is MONGODB and mongodbPassword is missing', (done) => {
        const c = new Connection({
          mongodbUsername: 'arlo',
          mongodbPassword: 'woof'
        });

        expect(c.mongodbDatabaseName).to.be.equal(
          Connection.MONGODB_DATABASE_NAME_DEFAULT
        );

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should add a real password to driver url', () => {
        const c = new Connection({
          mongodbUsername: 'arlo',
          mongodbPassword: 'woof'
        });

        expect(c.driverUrl).to.be.equal(
          'mongodb://arlo:woof@localhost:27017/?authSource=admin&readPreference=primary&ssl=false'
        );
        expect(c.driverUrl).to.be.equal(c.driverUrlWithSsh);
      });

      it('should set authStrategy to LDAP', (done) => {
        const c = new Connection({
          ldapUsername: 'arlo',
          ldapPassword: 'w@of'
        });

        expect(c.authStrategy).to.be.equal('LDAP');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should throw the error if auth is LDAP and ldapUsername is missing', () => {
        const attrs = { authStrategy: 'LDAP' };
        const c = new Connection(attrs);
        const error = c.validate(attrs);

        expect(c.isValid()).to.be.equal(false);
        expect(error.message).to.equal('The \'Username\' field is required when using \'LDAP\' for authentication.');
      });

      it('should throw the error if auth is LDAP and ldapPassword is missing', () => {
        const attrs = { authStrategy: 'LDAP', ldapUsername: 'arlo' };
        const c = new Connection(attrs);
        const error = c.validate(attrs);

        expect(c.isValid()).to.be.equal(false);
        expect(error.message).to.equal('The \'Password\' field is required when using LDAP for authentication.');
      });

      it('should set authStrategy to X509', (done) => {
        const c = new Connection({
          x509Username:
            'CN=client,OU=kerneluser,O=10Gen,L=New York City,ST=New York,C=US'
        });

        expect(c.authStrategy).to.be.equal('X509');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should not throw the error if auth is X509 and x509Username is missing', () => {
        const attrs = {
          authStrategy: 'X509',
          sslMethod: 'ALL',
          sslCA: [sslFixture.ca],
          sslCert: sslFixture.server,
          sslKey: sslFixture.server
        };
        const c = new Connection(attrs);

        expect(c.isValid()).to.be.equal(true);
      });

      it('should throw a validation error if auth is X509 and sslMethod is not "ALL"', () => {
        const attrs = {
          authStrategy: 'X509'
        };
        const c = new Connection(attrs);
        const error = c.validate(attrs);

        expect(c.isValid()).to.be.equal(false);
        expect(error.message).to.equal('SSL method is required to be set to \'Server and Client Validation\' when using X.509 authentication.');
      });

      it('should set default mongodb gssapiServiceName when using KERBEROS auth', (done) => {
        const c = new Connection({
          kerberosPrincipal: 'lucas@kerb.mongodb.parts'
        });

        expect(c.driverUrl).to.be.equal(
          'mongodb://lucas%40kerb.mongodb.parts@localhost:27017/?gssapiServiceName=mongodb&authMechanism=GSSAPI&readPreference=primary&ssl=false&authSource=$external'
        );

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set authStrategy to KERBEROS', (done) => {
        const c = new Connection({
          kerberosPrincipal: 'lucas@kerb.mongodb.parts'
        });

        expect(c.authStrategy).to.be.equal('KERBEROS');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should throw the error if auth is KERBEROS and kerberosPrincipal is missing', () => {
        const attrs = { authStrategy: 'KERBEROS' };
        const c = new Connection(attrs);
        const error = c.validate(attrs);

        expect(c.isValid()).to.be.equal(false);
        expect(error.message).to.equal('The Kerberos \'Principal\' field is required when using \'Kerberos\' for authentication.');
      });

      it('should *only* require a kerberosPrincipal', () => {
        const attrs = {
          authStrategy: 'KERBEROS',
          kerberosPrincipal: 'lucas@kerb.mongodb.parts'
        };
        const c = new Connection(attrs);

        expect(c.isValid()).to.be.equal(true);
      });

      it('should build safeUrl for KERBEROS auth when password is specified', (done) => {
        const attrs = {
          kerberosPrincipal: 'alena@test.test',
          ldapPassword: 'ldap-password',
        };
        const c = new Connection(attrs);

        expect(c.driverUrl).to.be.equal(
          'mongodb://alena%40test.test@localhost:27017/?gssapiServiceName=mongodb&authMechanism=GSSAPI&readPreference=primary&ssl=false&authSource=$external'
        );
        expect(c.safeUrl).to.be.equal(
          'mongodb://alena%40test.test@localhost:27017/?gssapiServiceName=mongodb&authMechanism=GSSAPI&readPreference=primary&ssl=false&authSource=$external'
        );

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set driverAuthMechanism to GSSAPI when a password is provided', (done) => {
        const c = new Connection({
          kerberosPrincipal: 'arlo/dog@krb5.mongodb.parts',
          kerberosServiceName: 'mongodb'
        });

        expect(c.driverAuthMechanism).to.be.equal('GSSAPI');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set driverAuthMechanism to GSSAPI when a password is provided and urlencode the principal', (done) => {
        const c = new Connection({
          kerberosPrincipal: 'arlo/dog@krb5.mongodb.parts',
          kerberosServiceName: 'mongodb'
        });
        const kerberosPrincipal = encodeURIComponentRFC3986(
          c.kerberosPrincipal
        );
        const expectedPrefix = `mongodb://${kerberosPrincipal}@localhost:27017`;

        expect(c.driverAuthMechanism).to.be.equal('GSSAPI');
        expect(c.driverUrl.indexOf(expectedPrefix)).to.be.equal(0);

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set driverAuthMechanism to GSSAPI when a password is not provided', (done) => {
        const c = new Connection({
          kerberosPrincipal: 'arlo/dog@krb5.mongodb.parts'
        });

        expect(c.driverAuthMechanism).to.be.equal('GSSAPI');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should not include the `:` auth seperator', (done) => {
        const c = new Connection({
          kerberosPrincipal: 'lucas@kerb.mongodb.parts'
        });
        const kerberosPrincipal = encodeURIComponentRFC3986(
          c.kerberosPrincipal
        );
        const expectedPrefix = `mongodb://${kerberosPrincipal}@localhost:27017`;

        expect(c.driverUrl.indexOf(expectedPrefix)).to.be.equal(0);

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });
    });

    context('top level properties', () => {
      it('should set the default read preference to primary preferred', (done) => {
        const c = new Connection({ appname: 'My App' });

        expect(c.driverOptions).to.be.deep.equal({
          readPreference: 'primary',
          connectWithNoPrimary: true
        });

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set isSrvRecord defaults to false', (done) => {
        const c = new Connection();

        expect(c.isSrvRecord).to.be.equal(false);

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should allow the mongodbDatabaseName to be optional', () => {
        const attrs = { mongodbUsername: 'arlo' };
        const c = new Connection(attrs);
        const error = c.validate(attrs);

        expect(c.isValid()).to.be.equal(false);
        expect(error.message).to.equal('The \'Password\' field is required when using \'Username/Password\' or \'SCRAM-SHA-256\' for authentication.');
      });

      it('should generate the local port when using a ssh tunnel and bind to local port does not exist', () => {
        const c = new Connection();

        c.sshTunnel = 'USER_PASSWORD';
        c.sshTunnelHostname = '123.45.67.89';
        c.sshTunnelPort = 22;
        c.sshTunnelUsername = 'user';
        c.sshTunnelPassword = 'pass';

        expect(c.driverUrl).to.not.be.equal('');
        expect(c.sshTunnelBindToLocalPort).to.not.exist;
      });

      it('should load all of the files from the filesystem if sslMethod ia ALL', (done) => {
        const c = new Connection({
          sslMethod: 'ALL',
          sslCA: [sslFixture.ca],
          sslCert: sslFixture.server,
          sslKey: sslFixture.server
        });

        loadOptions(c, (error, driverOptions) => {
          if (error) {
            return done(error);
          }

          const opts = driverOptions;

          expect(opts.sslValidate).to.be.equal(true);
          expect(Array.isArray(opts.sslCA)).to.be.equal(true);
          expect(Buffer.isBuffer(opts.sslCA[0])).to.be.equal(true);
          expect(opts.sslPass).to.not.exist;
          expect(Buffer.isBuffer(opts.sslCert)).to.be.equal(true);
          expect(Buffer.isBuffer(opts.sslKey)).to.be.equal(true);
          done();
        });
      });
    });

    context('extra options', () => {
      it('should use default driverOptions when there is no extra options', (done) => {
        const c = new Connection();

        expect(c.driverOptions).to.have.property('connectWithNoPrimary');
        expect(c.driverOptions).to.have.property('readPreference');
        expect(c.driverOptions).to.not.have.property('socketTimeoutMS');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should include extra options in driverOptions when specified', (done) => {
        const c = new Connection({ extraOptions: { socketTimeoutMS: 1000 } });
        const options = Object.assign({}, Connection.DRIVER_OPTIONS_DEFAULT, {
          socketTimeoutMS: 1000,
          readPreference: 'primary'
        });

        expect(c.driverOptions).to.deep.equal(options);

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });
    });

    context('promote values', () => {
      it('should not include promoteValues when not specified', (done) => {
        const c = new Connection();

        expect(c.driverOptions).to.not.have.property('promoteValues');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set promoteValues to true', (done) => {
        const c = new Connection({ promoteValues: true });

        expect(c.driverOptions).to.have.property('promoteValues');
        expect(c.driverOptions.promoteValues).to.be.equal(true);

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set promoteValues to false', (done) => {
        const c = new Connection({ promoteValues: false });

        expect(c.driverOptions).to.have.property('promoteValues');
        expect(c.driverOptions.promoteValues).to.be.equal(false);

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });
    });

    context('connection type', () => {
      it('should set default connectionType to NODE_DRIVER', (done) => {
        const c = new Connection({});

        expect(c.connectionType).to.be.equal('NODE_DRIVER');

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should set default host and port when connectionType is NODE_DRIVER', (done) => {
        const c = new Connection({ connectionType: 'NODE_DRIVER' });

        expect(c.hostname).to.be.equal('localhost');
        expect(c.port).to.be.equal(27017);

        Connection.from(c.driverUrl, (error) => {
          expect(error).to.not.exist;
          done();
        });
      });

      it('should not allow stitchClientAppId', () => {
        const c = new Connection({
          connectionType: 'NODE_DRIVER',
          stitchClientAppId: 'xkcd42'
        });

        expect(c.isValid()).to.be.equal(false);
      });

      it('should not allow stitchClientAppId', () => {
        const c = new Connection({
          connectionType: 'NODE_DRIVER',
          stitchBaseUrl: 'http://localhost:9001/'
        });

        expect(c.isValid()).to.be.equal(false);
      });

      it('should not allow stitchGroupId', () => {
        const c = new Connection({
          connectionType: 'NODE_DRIVER',
          stitchGroupId: '23xkcd'
        });

        expect(c.isValid()).to.be.equal(false);
      });

      it('should not allow stitchServiceName', () => {
        const c = new Connection({
          connectionType: 'NODE_DRIVER',
          stitchServiceName: 'woof'
        });

        expect(c.isValid()).to.be.equal(false);
      });

      it('should require stitchClientAppId when connectionType is STITCH_ATLAS', () => {
        const c = new Connection({ connectionType: 'STITCH_ATLAS' });

        expect(c.isValid()).to.be.equal(false);
      });

      it('should be valid when stitchClientAppId is included and connectionType is STITCH_ATLAS', () => {
        const c = new Connection({
          connectionType: 'STITCH_ATLAS',
          stitchClientAppId: 'xkcd42'
        });

        expect(c.isValid()).to.be.equal(true);
      });

      it('should require stitchClientAppId when connectionType is STITCH_ON_PREM', () => {
        const c = new Connection({
          connectionType: 'STITCH_ON_PREM',
          stitchBaseUrl: 'http://localhost:9001/',
          stitchGroupId: '23xkcd',
          stitchServiceName: 'woof'
        });

        expect(c.isValid()).to.be.equal(false);
      });

      it('should require stitchBaseUrl when connectionType is STITCH_ON_PREM', () => {
        const c = new Connection({
          connectionType: 'STITCH_ON_PREM',
          stitchClientAppId: 'xkcd42',
          stitchGroupId: '23xkcd',
          stitchServiceName: 'woof'
        });

        expect(c.isValid()).to.be.equal(false);
      });

      it('should require stitchGroupId when connectionType is STITCH_ON_PREM', () => {
        const c = new Connection({
          connectionType: 'STITCH_ON_PREM',
          stitchClientAppId: 'xkcd42',
          stitchBaseUrl: 'http://localhost:9001/',
          stitchServiceName: 'woof'
        });

        expect(c.isValid()).to.be.equal(false);
      });

      it('should require stitchServiceName when connectionType is STITCH_ON_PREM', () => {
        const c = new Connection({
          connectionType: 'STITCH_ON_PREM',
          stitchClientAppId: 'xkcd42',
          stitchBaseUrl: 'http://localhost:9001/',
          stitchGroupId: '23xkcd'
        });

        expect(c.isValid()).to.be.equal(false);
      });

      it('should be valid when all required fields are included and connectionType is STITCH_ON_PREM ', () => {
        const c = new Connection({
          connectionType: 'STITCH_ON_PREM',
          stitchClientAppId: 'xkcd42',
          stitchBaseUrl: 'http://localhost:9001/',
          stitchGroupId: '23xkcd',
          stitchServiceName: 'woof'
        });

        expect(c.isValid()).to.be.equal(true);
      });
    });
  });

  context('when using the isURI() method', () => {
    it('should return true when using a mongodb protocol', () => {
      const isURI = Connection.isURI('mongodb://localhost&ssl=false');

      expect(isURI).to.be.equal(true);
    });

    it('should return true when using a mongodb+srv protocol', () => {
      const isURI = Connection.isURI('mongodb+srv://localhost&ssl=false');

      expect(isURI).to.be.equal(true);
    });

    it('should return false when using another protocol', () => {
      const isURI = Connection.isURI('mongodb+somethign://localhost&ssl=false');

      expect(isURI).to.be.equal(false);
    });

    it('should return false when using a shell connection string', () => {
      const isURI = Connection.isURI('mongo "mongodb://localhost&ssl=false"');

      expect(isURI).to.be.equal(false);
    });
  });

  context('when building a connection object from URI', () => {
    it('should throw the type error', () => {
      expect(
        () =>
          new Connection(
            'mongodb://mongodb1.example.com:27317,mongodb2.example.com:27017/?replicaSet=mySet&authSource=authDB'
          )
      ).to.throw(
        TypeError,
        'To create a connection object from URI please use `Connection.from` function.'
      );
    });
  });
});
