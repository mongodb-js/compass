var assert = require('assert');
var Connection = require('../');
var loadOptions = require('../connect').loadOptions;
var parse = require('mongodb-url');
var driverParse = require('mongodb/lib/url_parser');
var fixture = require('mongodb-connection-fixture');
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
  describe('authentication', function() {
    describe('NONE', function() {
      it('should return the correct URL for the driver', function() {
        var c = new Connection();
        assert.equal(c.driver_url,
          'mongodb://localhost:27017/?slaveOk=true');

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
            'mongodb://%40rlo:w%40of@localhost:27017/?slaveOk=true&authSource=admin');
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
            ldap_password: 'w@of'
          });

          it('should have the correct authMechanism', function() {
            assert.equal(c.driver_auth_mechanism, 'PLAIN');
          });

          it('should urlencode credentials', function() {
            assert.equal(c.driver_url,
              'mongodb://arlo:w%40of@localhost:27017/?slaveOk=true&authMechanism=PLAIN');
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
              + '?slaveOk=true&authMechanism=MONGODB-X509');
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
          var c = new Connection({
            kerberos_principal: 'arlo/dog@krb5.mongodb.parts',
            kerberos_password: 'w@@f',
            kerberos_service_name: 'mongodb'
          });

          it('should have the correct authMechanism', function() {
            assert.equal(c.driver_auth_mechanism, 'GSSAPI');
          });

          it('should urlencode the principal', function() {
            assert.equal(c.driver_url,
              'mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/'
              + 'kerberos?slaveOk=true&gssapiServiceName=mongodb&authMechanism=GSSAPI');
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
        describe('regressions', function() {
          it('should include the `:` auth seperator when no password is provided', function() {
            var c = new Connection({
              kerberos_principal: 'lucas@kerb.mongodb.parts'
            });
            assert.equal(c.driver_url,
              'mongodb://lucas%2540kerb.mongodb.parts:@localhost:27017/'
              + 'kerberos?slaveOk=true&gssapiServiceName=mongodb&authMechanism=GSSAPI');
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

    describe('authentication', function() {
      it('should parse MONGODB', function() {
        var c = Connection.from('mongodb://%40rlo:w%40of@localhost:27017/'
          + '?slaveOk=true&authSource=%40dmin');
        assert(c);
        assert.equal(c.hostname, 'localhost');
        assert.equal(c.port, 27017);
        assert.equal(c.authentication, 'MONGODB');
        assert.equal(c.mongodb_username, '@rlo');
        assert.equal(c.mongodb_password, 'w@of');
        assert.equal(c.mongodb_database_name, 'admin');
      });
      describe('enterprise', function() {
        it('should parse LDAP', function() {
          var c = Connection.from('mongodb://arlo:w%40of@localhost:27017/'
            + '?slaveOk=true&authMechanism=PLAIN');
          assert.equal(c.hostname, 'localhost');
          assert.equal(c.port, 27017);
          assert.equal(c.authentication, 'LDAP');
          assert.equal(c.ldap_username, 'arlo');
          assert.equal(c.ldap_password, 'w@of');
        });

        it('should parse X509', function() {
          var c = Connection.from('mongodb://CN%253Dclient%252COU%253Darlo%252CO%253DMongoDB%252CL%253DPhiladelphia'
            + '%252CST%253DPennsylvania%252CC%253DUS@localhost:27017/'
            + '?slaveOk=true&authMechanism=MONGODB-X509');
          assert.equal(c.hostname, 'localhost');
          assert.equal(c.port, 27017);
          assert.equal(c.authentication, 'X509');
          assert.equal(c.x509_username, 'CN=client,OU=arlo,O=MongoDB,L=Philadelphia,ST=Pennsylvania,C=US');
        });

        it('should parse KERBEROS', function() {
          var c = Connection.from('mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/'
            + 'kerberos?slaveOk=true&gssapiServiceName=mongodb&authMechanism=GSSAPI');
          assert.equal(c.hostname, 'localhost');
          assert.equal(c.port, 27017);
          assert.equal(c.authentication, 'KERBEROS');
          assert.equal(c.kerberos_principal, 'arlo/dog@krb5.mongodb.parts');
          assert.equal(c.kerberos_password, 'w@@f');
        });
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
      it('should produce the correct driver URL');
      it('should produce the correct driver options');
    });

    describe('When ssl is UNVALIDATED', function() {
      it('should produce the correct driver URL');
      it('should produce the correct driver options');
    });

    describe('When ssl is SERVER', function() {
      it('should produce the correct driver URL');
      it('should produce the correct driver options');
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
      it('should produce the correct driver URL');
      it('should produce the correct driver options');
    });
  });
});
