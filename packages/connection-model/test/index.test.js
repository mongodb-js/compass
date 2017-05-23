var assert = require('assert');
var Connection = require('../');
var getTasks = Connection.connect.getTasks;
var loadOptions = Connection.connect.loadOptions;
var parse = require('mongodb-url');
var driverParse = require('mongodb/lib/url_parser');
var fixture = require('mongodb-connection-fixture');
var fs = require('fs');
var _ = require('lodash');
var format = require('util').format;

function isNotValidAndHasMessage(model, msg) {
  assert.equal(model.isValid(), false,
    'It should not be valid, but isValid() did not return false');

  var err = model.validationError;
  assert(err instanceof TypeError);
  assert(new RegExp(msg).test(err.message),
    format('Unexpected error message!  Expected to match `%s` but got `%s`.',
      msg, err.message));
}

/**
 * Test that the connection URL and options are createdb
 * properly for all of the different authentication features
 * that a user may need.
 */
describe('mongodb-connection-model', function() {
  describe('client meta data', function() {
    it('should return the correct URL with appname included', function() {
      var c = new Connection({
        app_name: 'My App'
      });
      assert.equal(c.driver_url,
        'mongodb://localhost:27017/?appname=My%20App');

      assert.doesNotThrow(function() {
        parse(c.driver_url);
      });

      assert.doesNotThrow(function() {
        driverParse(c.driver_url);
      });
    });

    it('sets the default read preference to primary preferred', function() {
      var c = new Connection({ app_name: 'My App' });
      assert.deepEqual(c.driver_options.db, { readPreference: 'primaryPreferred' });
    });

    it('sets the replica set name', function() {
      var c = new Connection({ app_name: 'My App', replica_set_name: 'testing' });
      assert.equal(c.driver_url,
        'mongodb://localhost:27017/?replicaSet=testing&appname=My%20App');
    });
  });

  describe('authentication', function() {
    describe('NONE', function() {
      it('should return the correct URL for the driver', function() {
        var c = new Connection({
          ssl: 'NONE'
        });
        assert.equal(c.driver_url,
          'mongodb://localhost:27017/');

        assert.doesNotThrow(function() {
          parse(c.driver_url);
        });

        assert.doesNotThrow(function() {
          driverParse(c.driver_url);
        });
      });
    });

    describe('MONGODB', function() {
      it('should reject non-applicable fields', function() {
        isNotValidAndHasMessage(new Connection({
          mongodb_username: 'arlo',
          mongodb_password: 'woof',
          kerberos_service_name: 'mongodb'
        }), 'kerberos_service_name field does not apply');
      });

      it('should set authentication to MONGODB', function() {
        var c = new Connection({
          mongodb_username: 'arlo',
          mongodb_password: 'woof'
        });
        assert.equal(c.authentication, 'MONGODB');
      });

      it('should require mongodb_username', function() {
        isNotValidAndHasMessage(new Connection({
          authentication: 'MONGODB',
          mongodb_password: 'woof'
        }), 'mongodb_username field is required');
      });

      it('should require mongodb_password', function() {
        isNotValidAndHasMessage(new Connection({
          mongodb_username: 'arlo'
        }), 'mongodb_password field is required');
      });

      it('should allow the mongodb_database_name to be optional', function() {
        var c = new Connection({
          mongodb_username: 'arlo',
          mongodb_password: 'woof'
        });
        assert(c.isValid());
        assert.equal(c.mongodb_database_name, Connection.MONGODB_DATABASE_NAME_DEFAULT);
      });

      describe('driver_url', function() {
        var c = new Connection({
          mongodb_username: '@rlo',
          mongodb_password: 'w@of'
        });

        it('should urlencode credentials', function() {
          assert.equal(c.driver_url,
            'mongodb://%40rlo:w%40of@localhost:27017/?authSource=admin');
        });

        it('should be parse in the browser', function() {
          assert.doesNotThrow(function() {
            parse(c.driver_url);
          });
        });

        it('should parse on the server', function() {
          assert.doesNotThrow(function() {
            driverParse(c.driver_url);
          });
        });
      });

      describe('with special characters e.g. colon', () => {
        let username;
        let password;
        let connection;
        let authExpect;

        before(() => {
          username = 'user@-azMPk]&3Wt)iP_9C:PMQ=';
          password = 'user@-azMPk]&3Wt)iP_9C:PMQ=';
          connection = new Connection({
            mongodb_username: username,
            mongodb_password: password
          });
          authExpect = `${encodeURIComponent(username)}:${encodeURIComponent(password)}`;
        });

        it('should urlencode credentials', () => {
          assert.equal(connection.driver_url,
            `mongodb://${authExpect}@localhost:27017/?authSource=admin`);
        });

        it('should be parse in the browser', () => {
          assert.doesNotThrow(() => {
            parse(connection.driver_url);
          });
        });

        it('should parse on the server', () => {
          assert.doesNotThrow(() => {
            driverParse(connection.driver_url);
          });
        });
      });

      describe('with emoji', () => {
        let username;
        let password;
        let connection;
        let authExpect;

        before(() => {
          username = '👌emoji😂😍😘🔥💕🎁💯🌹';
          password = '👌emoji😂😍😘🔥💕🎁💯🌹';
          connection = new Connection({
            mongodb_username: username,
            mongodb_password: password
          });
          authExpect = `${encodeURIComponent(username)}:${encodeURIComponent(password)}`;
        });

        it('should urlencode credentials', () => {
          assert.equal(connection.driver_url,
            `mongodb://${authExpect}@localhost:27017/?authSource=admin`);
        });

        it('should be parse in the browser', () => {
          assert.doesNotThrow(() => {
            parse(connection.driver_url);
          });
        });

        it('should parse on the server', () => {
          assert.doesNotThrow(() => {
            driverParse(connection.driver_url);
          });
        });
      });
    });

    describe('ATLAS - mongodb.net', function() {
      var atlasConnection = 'mongodb://ADMINUSER:<PASSWORD>@' +
          'a-compass-atlas-test-shard-00-00-vll9l.mongodb.net:38128,' +
          'a-compass-atlas-test-shard-00-01-vll9l.mongodb.net:38128,' +
          'a-compass-atlas-test-shard-00-02-vll9l.mongodb.net:38128/<DATABASE>?' +
          'ssl=true&replicaSet=a-compass-atlas-test-shard-0&authSource=admin';
      var okAtlasPassword = 'A_MUCH_LONGER_PASSWORD_should_be_more secure...';
      var okAtlasPasswordConnection = atlasConnection.replace(
        '<PASSWORD>',
        okAtlasPassword
      );
      it('defaults SSL to SYSTEMCA', function() {
        var c = Connection.from(atlasConnection);
        // In future, we should ship our own CA with Compass
        // so we can default to 'SERVER'-validated.
        // This is a step in the right direction so let's take the easy wins.
        assert.equal(c.ssl, 'SYSTEMCA');
      });
      it('clears the default <PASSWORD>', function() {
        // UX: We clear the default string 'PASSWORD' from the Atlas GUI
        // so the user is forced to enter their own password
        // rather than getting trapped with the error:
        // "Could not connect to MongoDB on the provided host and port"
        var c = Connection.from(atlasConnection);
        assert.equal(c.mongodb_password, '');
      });
      it('does not clear sufficiently long passwords that happen to contain PASSWORD', function() {
        var c = Connection.from(okAtlasPasswordConnection);
        assert.equal(c.mongodb_password, okAtlasPassword);
      });
      it('works with a non-default secure password', function() {
        var userPass = '6NuZPtHCrjYBAWnI7Iq6jvtsdJx67X0';
        var c = Connection.from(atlasConnection.replace('<PASSWORD>', userPass));
        assert.equal(c.ssl, 'SYSTEMCA');
        assert.equal(c.mongodb_password, userPass);
      });
      it('changes the <DATABASE> namespace to test', function() {
        assert.ok(atlasConnection.indexOf('<DATABASE>') > -1);
        var c = Connection.from(atlasConnection);
        assert.equal(c.ns, 'test');
      });
      it('does not false positive on hi.mongodb.net.my.domain.com', function() {
        var c = Connection.from(
            atlasConnection.replace(/mongodb.net/g, 'hi.mongodb.net.my.domain.com'));
        assert.equal(c.ssl, 'NONE');  // Whatever the Compass default is
      });
      it('is case insensitive, see RFC4343', function() {
        var c = Connection.from(atlasConnection.replace(/mongodb.net/g, 'mOnGOdB.NeT'));
        assert.equal(c.ssl, 'SYSTEMCA');
      });
    });

    describe('enterprise', function() {
      describe('LDAP', function() {
        it('should set authentication to LDAP', function() {
          var c = new Connection({
            ldap_username: 'arlo',
            ldap_password: 'w@of'
          });
          assert.equal(c.authentication, 'LDAP');
        });

        it('should require ldap_username', function() {
          isNotValidAndHasMessage(new Connection({
            authentication: 'LDAP'
          }), 'ldap_username field is required');
        });

        it('should require ldap_password', function() {
          isNotValidAndHasMessage(new Connection({
            authentication: 'LDAP',
            ldap_username: 'arlo'
          }), 'ldap_password field is required');
        });

        describe('driver_url', function() {
          var c = new Connection({
            authentication: 'LDAP',
            ldap_username: 'arlo',
            ldap_password: 'w@of',
            ns: 'ldap'
          });

          it('should have the correct authMechanism', function() {
            assert.equal(c.driver_auth_mechanism, 'PLAIN');
          });

          it('should urlencode credentials', function() {
            assert.equal(c.driver_url,
              'mongodb://arlo:w%40of@localhost:27017/ldap?authMechanism=PLAIN');
          });

          it('should be parse in the browser', function() {
            assert.doesNotThrow(function() {
              parse(c.driver_url);
            });
          });

          it('should parse on the server', function() {
            assert.doesNotThrow(function() {
              driverParse(c.driver_url);
            });
          });
        });

        describe('driver_url with @', function() {
          var c = new Connection({
            authentication: 'LDAP',
            ldap_username: 'arlo@t.co',
            ldap_password: 'woof',
            ns: 'ldap'
          });
          it('COMPASS-745 - should urlencode @ once only', function() {
            assert.equal(c.driver_url,
              'mongodb://arlo%40t.co:woof@localhost:27017/ldap?authMechanism=PLAIN');
          });
        });
      });

      describe('X509', function() {
        it('should set authentication to X509', function() {
          var c = new Connection({
            x509_username: 'CN=client,OU=arlo,O=MongoDB,L=Philadelphia,'
              + 'ST=Pennsylvania,C=US'
          });
          assert.equal(c.authentication, 'X509');
        });

        it('should require x509_username', function() {
          isNotValidAndHasMessage(new Connection({
            authentication: 'X509'
          }), 'x509_username field is required');
        });

        describe('driver_url', function() {
          var c = new Connection({
            authentication: 'X509',
            x509_username: 'CN=client,OU=arlo,O=MongoDB,L=Philadelphia,'
              + 'ST=Pennsylvania,C=US'
          });

          it('should have the correct authMechanism', function() {
            assert.equal(c.driver_auth_mechanism, 'MONGODB-X509');
          });

          it('should urlencode credentials', function() {
            assert.equal(c.driver_url,
              'mongodb://CN%253Dclient%252COU%253Darlo%252CO%253DMongoDB%252CL%253DPhiladelphia'
              + '%252CST%253DPennsylvania%252CC%253DUS@localhost:27017/'
              + '?authMechanism=MONGODB-X509');
          });

          it('should be parse in the browser', function() {
            assert.doesNotThrow(function() {
              parse(c.driver_url);
            });
          });

          it('should parse on the server', function() {
            assert.doesNotThrow(function() {
              driverParse(c.driver_url);
            });
          });
        });
      });

      describe('KERBEROS', function() {
        it('should set authentication to KERBEROS', function() {
          var c = new Connection({
            kerberos_principal: 'lucas@kerb.mongodb.parts'
          });
          assert.equal(c.authentication, 'KERBEROS');
        });

        it('should require a principal', function() {
          isNotValidAndHasMessage(new Connection({
            authentication: 'KERBEROS'
          }), 'kerberos_principal field is required');
        });

        it('should *only* require a principal', function() {
          var c = new Connection({
            authentication: 'KERBEROS',
            kerberos_principal: 'lucas@kerb.mongodb.parts'
          });
          assert.equal(c.isValid(), true);
        });
        describe('driver_url', function() {
          describe('When a password is provided', function() {
            var c = new Connection({
              kerberos_principal: 'arlo/dog@krb5.mongodb.parts',
              kerberos_password: 'w@@f',
              kerberos_service_name: 'mongodb'
            });

            it('should have the GSSAPI authMechanism', function() {
              assert.equal(c.driver_auth_mechanism, 'GSSAPI');
            });

            it('should urlencode the principal', function() {
              var expectedPrefix = 'mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017';
              assert.equal(c.driver_url.indexOf(expectedPrefix), 0);
            });

            it('should be parse in the browser', function() {
              assert.doesNotThrow(function() {
                parse(c.driver_url);
              });
            });

            it('should parse on the server', function() {
              assert.doesNotThrow(function() {
                driverParse(c.driver_url);
              });
            });
          });

          describe('When a password is NOT provided', function() {
            var c = new Connection({
              kerberos_principal: 'arlo/dog@krb5.mongodb.parts'
            });

            it('should have the GSSAPI authMechanism', function() {
              assert.equal(c.driver_auth_mechanism, 'GSSAPI');
            });

            it('should be parse in the browser', function() {
              assert.doesNotThrow(function() {
                parse(c.driver_url);
              });
            });

            it('should parse on the server', function() {
              assert.doesNotThrow(function() {
                driverParse(c.driver_url);
              });
            });
          });
        });
        describe('regressions', function() {
          it('should include the `:` auth seperator when no password is provided', function() {
            var c = new Connection({
              kerberos_principal: 'lucas@kerb.mongodb.parts'
            });
            var expectedPrefix = 'mongodb://lucas%2540kerb.mongodb.parts:@localhost:27017';
            assert.equal(c.driver_url.indexOf(expectedPrefix), 0);
          });
        });
      });
    });
  });

  describe('from', function() {
    it('should work', function() {
      var c = Connection.from('mongodb://krb5.mongodb.parts:1234');
      assert.equal(c.hostname, 'krb5.mongodb.parts');
      assert.equal(c.port, 1234);
    });

    it('should not require the mongodb protocol prefix', function() {
      assert.doesNotThrow(function() {
        Connection.from('localhost:27017');
      });
    });

    it('should not require a port number', function() {
      var c = Connection.from('mongodb://data.mongodb.com/');
      assert.equal(c.hostname, 'data.mongodb.com');
      assert.equal(c.port, 27017);
    });

    describe('if model initialized with string', function() {
      var c = Connection.from('krb5.mongodb.parts:1234');
      it('should not have a validationError', function() {
        assert.equal(c.validationError, undefined);
      });

      it('should be valid', function() {
        assert(c.isValid());
      });

      it('should have the correct hostname', function() {
        assert.equal(c.hostname, 'krb5.mongodb.parts');
      });

      it('should have the correct port', function() {
        assert.equal(c.port, 1234);
      });
    });

    describe('authentication', function() {
      it('should parse MONGODB', function() {
        var c = Connection.from('mongodb://%40rlo:w%40of@localhost:27017/'
          + '?authSource=%40dmin');
        assert(c);
        assert.equal(c.hostname, 'localhost');
        assert.equal(c.port, 27017);
        assert.equal(c.authentication, 'MONGODB');
        assert.equal(c.mongodb_username, '@rlo');
        assert.equal(c.mongodb_password, 'w@of');
        // this is the authSource, not dbName!
        assert.equal(c.mongodb_database_name, '@dmin');
      });
      it('should work with explicit authSource', function() {
        var c = Connection.from('mongodb://%40rlo:w%40of@localhost:27017/dogdb'
          + '?authMechanism=SCRAM-SHA-1&authSource=catdb');
        assert(c);
        assert.equal(c.ns, 'dogdb');
        assert.equal(c.mongodb_database_name, 'catdb');
      });
      it('should fall back to dbName if authSource is not specified', function() {
        var c = Connection.from('mongodb://%40rlo:w%40of@localhost:27017/dogdb'
          + '?authMechanism=SCRAM-SHA-1');
        assert(c);
        assert.equal(c.ns, 'dogdb');
        assert.equal(c.mongodb_database_name, 'dogdb');
      });
      describe('enterprise', function() {
        it('should parse LDAP', function() {
          var c = Connection.from('mongodb://arlo:w%40of@localhost:27017/'
            + 'ldap?authMechanism=PLAIN');
          assert.equal(c.hostname, 'localhost');
          assert.equal(c.port, 27017);
          assert.equal(c.authentication, 'LDAP');
          assert.equal(c.ldap_username, 'arlo');
          assert.equal(c.ldap_password, 'w@of');
          assert.equal(c.ns, 'ldap');
        });

        it('should parse X509', function() {
          var c = Connection.from('mongodb://CN%253Dclient%252COU%253Darlo%252CO%253DMongoDB%252CL%253DPhiladelphia'
            + '%252CST%253DPennsylvania%252CC%253DUS@localhost:27017/'
            + 'x509?authMechanism=MONGODB-X509');
          assert.equal(c.hostname, 'localhost');
          assert.equal(c.port, 27017);
          assert.equal(c.authentication, 'X509');
          assert.equal(c.x509_username, 'CN=client,OU=arlo,O=MongoDB,L=Philadelphia,ST=Pennsylvania,C=US');
          assert.equal(c.ns, 'x509');
        });

        it('should parse KERBEROS', function() {
          var c = Connection.from('mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/'
            + 'kerberos?gssapiServiceName=mongodb&authMechanism=GSSAPI');
          assert.equal(c.hostname, 'localhost');
          assert.equal(c.port, 27017);
          assert.equal(c.authentication, 'KERBEROS');
          assert.equal(c.kerberos_principal, 'arlo/dog@krb5.mongodb.parts');
          assert.equal(c.kerberos_password, 'w@@f');
          assert.equal(c.ns, 'kerberos');
        });
      });
    });
  });

  describe('extra_options', function() {
    describe('When not specifying any extra_options', function() {
      var conn = new Connection();

      it('should use default driver_options', function() {
        assert.ok(!_.has(conn.driver_options, 'connectTimeoutMS'));
        assert.ok(!_.has(conn.driver_options, 'socketTimeoutMS'));
      });
    });
    describe('When specifying custom extra_options', function() {
      var conn = new Connection({
        extra_options: {
          socketTimeoutMS: 1000
        }
      });

      it('should include the extra_options in driver_options', function() {
        var options = _.clone(Connection.DRIVER_OPTIONS_DEFAULT);
        options.socketTimeoutMS = 1000;
        assert.deepEqual(conn.driver_options, options);
      });
    });
  });

  describe('promote_values', function() {
    describe('when no promote_values provided', function() {
      var conn = new Connection();

      it('should not have promoteValues specified', function() {
        assert.ok(!_.has(conn.driver_options.db.promoteValues));
      });
    });
    describe('when including promoteValues as true in connection', function() {
      var conn = new Connection({promote_values: true});
      it('should have the same value in driver options', function() {
        assert.equal(conn.driver_options.db.promoteValues, true);
      });
    });
    describe('when including promoteValues as false in connection', function() {
      var conn = new Connection({promote_values: false});
      it('should have the same value in driver options', function() {
        assert.equal(conn.driver_options.db.promoteValues, false);
      });
    });
  });

  describe('ssl', function() {
    describe('load', function() {
      it('should load all of the files from the filesystem', function(done) {
        var c = new Connection({
          ssl: 'ALL',
          ssl_ca: [fixture.ssl.ca],
          ssl_certificate: fixture.ssl.server,
          ssl_private_key: fixture.ssl.server
        });

        loadOptions(c, function(err, driverOptions) {
          if (err) {
            return done(err);
          }
          var opts = driverOptions.server;
          assert.equal(opts.sslValidate, true);
          assert(Array.isArray(opts.sslCA));
          assert(Buffer.isBuffer(opts.sslCA[0]));
          assert.equal(opts.sslPass, undefined);
          assert(Buffer.isBuffer(opts.sslCert));
          assert(Buffer.isBuffer(opts.sslKey));
          done();
        });
      });
    });
    describe('When ssl is NONE', function() {
      var sslNone = new Connection({
        ssl: 'NONE'
      });

      it('should produce the correct driver URL', function() {
        assert.equal(sslNone.driver_url, 'mongodb://localhost:27017/');
      });
      it('should produce the correct driver options', function() {
        assert.deepEqual(sslNone.driver_options,
          Connection.DRIVER_OPTIONS_DEFAULT);
      });
    });

    describe('When ssl is UNVALIDATED', function() {
      var sslUnvalidated = new Connection({
        ssl: 'UNVALIDATED'
      });

      it('should produce the correct driver URL', function() {
        assert.equal(sslUnvalidated.driver_url,
          'mongodb://localhost:27017/?ssl=true');
      });
      it('should produce the correct driver options', function() {
        var options = _.clone(Connection.DRIVER_OPTIONS_DEFAULT);
        options.server = {
          checkServerIdentity: false,
          sslValidate: false
        };
        assert.deepEqual(sslUnvalidated.driver_options, options);
      });
    });

    describe('When ssl is SYSTEMCA', function() {
      var sslSystemCA = new Connection({
        ssl: 'SYSTEMCA'
      });

      it('should produce the correct driver URL', function() {
        assert.equal(sslSystemCA.driver_url,
          'mongodb://localhost:27017/?ssl=true');
      });
      it('should produce the correct driver options', function() {
        var options = _.clone(Connection.DRIVER_OPTIONS_DEFAULT);
        options.server = {
          checkServerIdentity: true,
          sslValidate: true
        };
        assert.deepEqual(sslSystemCA.driver_options, options);
      });
    });

    describe('When ssl is IFAVAILABLE', function() {
      var sslUnvalidated = new Connection({
        ssl: 'IFAVAILABLE'
      });

      it('should produce the correct driver URL', function() {
        assert.equal(sslUnvalidated.driver_url,
          'mongodb://localhost:27017/?ssl=prefer');
      });
      it('should produce the correct driver options', function() {
        var options = _.clone(Connection.DRIVER_OPTIONS_DEFAULT);
        options.server = {
          checkServerIdentity: false,
          sslValidate: true
        };
        assert.deepEqual(sslUnvalidated.driver_options, options);
      });
    });

    describe('When ssl is SERVER', function() {
      var sslServer = new Connection({
        ssl: 'SERVER',
        ssl_ca: fixture.ssl.ca
      });

      it('should produce the correct driver URL', function() {
        assert.equal(sslServer.driver_url,
          'mongodb://localhost:27017/?ssl=true');
      });
      it('should produce the correct driver options', function() {
        var expected = _.clone(Connection.DRIVER_OPTIONS_DEFAULT);
        expected.server = {
          sslCA: [fixture.ssl.ca],
          sslValidate: true
        };
        assert.deepEqual(sslServer.driver_options, expected);
      });
    });

    describe('When ssl is ALL', function() {
      it('should cooerce a string value for `ssl_ca` into an array', function() {
        assert.doesNotThrow(function() {
          var c = new Connection({
            ssl_ca: fixture.ssl.ca
          });
          assert(Array.isArray(c.ssl_ca));
        });
      });
      describe('passwordless private keys', function() {
        var c = new Connection({
          ssl: 'ALL',
          ssl_ca: fixture.ssl.ca,
          ssl_certificate: fixture.ssl.server,
          ssl_private_key: fixture.ssl.server
        });
        it('should be valid', function() {
          assert.equal(c.isValid(), true);
        });
        it('should produce the correct driver_url', function() {
          assert.equal(c.driver_url,
            'mongodb://localhost:27017/?ssl=true');
        });

        it('should produce the correct driver_options', function() {
          var expected = _.clone(Connection.DRIVER_OPTIONS_DEFAULT);
          expected.server = {
            sslCA: [fixture.ssl.ca],
            sslCert: fixture.ssl.server,
            sslKey: fixture.ssl.server,
            sslValidate: true
          };
          assert.deepEqual(c.driver_options, expected);
        });

        it("has relevant driver_options after 'Load SSL files'", function(done) {
          /* eslint-disable no-sync */
          var expectAfterLoad = {
            sslCA: [fs.readFileSync(fixture.ssl.ca)],
            sslCert: fs.readFileSync(fixture.ssl.server),
            sslKey: fs.readFileSync(fixture.ssl.server),
            sslValidate: true
          };
          /* eslint-enable no-sync */
          const tasks = getTasks(c);
          // Trigger relevant side-effect, loading the SSL files into memory
          tasks['Load SSL files'](function() {  // eslint-disable-line new-cap
            // Read files into memory as the connect function does
            assert.deepEqual(tasks.driver_options.server, expectAfterLoad);
            done();
          });
        });
      });
      describe('password protected private keys', function() {
        var c = new Connection({
          ssl: 'ALL',
          ssl_ca: fixture.ssl.ca,
          ssl_certificate: fixture.ssl.server,
          ssl_private_key: fixture.ssl.server,
          ssl_private_key_password: 'woof'
        });

        it('should be valid', function() {
          assert.equal(c.isValid(), true);
        });

        it('should produce the correct driver_url', function() {
          assert.equal(c.driver_url,
            'mongodb://localhost:27017/?ssl=true');
        });

        it('should produce the correct driver_options', function() {
          var expected = _.clone(Connection.DRIVER_OPTIONS_DEFAULT);
          expected.server = {
            sslCA: [fixture.ssl.ca],
            sslCert: fixture.ssl.server,
            sslKey: fixture.ssl.server,
            sslPass: 'woof',
            sslValidate: true
          };
          assert.deepEqual(c.driver_options, expected);
        });
      });
    });
  });
});
