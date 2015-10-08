var assert = require('assert');
var Connection = require('../');
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
 * Test that the connection URL and options are created
 * properly for all of the different authentication features
 * that a user may need.
 */
describe('mongodb-connection-model', function() {
  describe.skip('When ssl is true', function() {
    it('should not allow specifying ssl_validate without turning on ssl', function() {
      isNotValidAndHasMessage(new Connection({
        ssl_validate: true
      }), 'ssl_validate field requires ssl');
    });

    it('should not allow specifying ssl_ca without turning on ssl', function() {
      isNotValidAndHasMessage(new Connection({
        ssl_ca: ['ca1']
      }), 'ssl_ca field requires ssl');
    });

    it('should not allow specifying ssl_cert without turning on ssl', function() {
      isNotValidAndHasMessage(new Connection({
        ssl_cert: 'cert'
      }), 'ssl_cert field requires ssl');
    });

    it('should not allow specifying ssl_key without turning on ssl', function() {
      isNotValidAndHasMessage(new Connection({
        ssl_private_key: 'key'
      }), 'ssl_private_key field requires ssl');
    });

    it('should not allow specifying ssl_pass without turning on ssl', function() {
      isNotValidAndHasMessage(new Connection({
        ssl_private_key_password: 'pass'
      }), 'ssl_private_key_password field requires ssl');
    });
  });

  describe('When authentication is NONE', function() {
    it('should return the correct URL for the driver', function() {
      assert.equal(new Connection().driver_url,
        'mongodb://localhost:27017?slaveOk=true');
    });
  });

  describe('When authentication is MONGODB', function() {
    it('should not allow specifying kerberos_service_name', function() {
      isNotValidAndHasMessage(new Connection({
        authentication: 'MONGODB',
        kerberos_service_name: 'mongodb'
      }), 'kerberos_service_name field does not apply');
    });

    describe('driver_url', function() {
      it('should include the username and password', function() {
        var url = new Connection({
          mongodb_username: 'arlo',
          mongodb_password: 'dog',
          authentication: 'MONGODB'
        }).driver_url;

        assert.equal(url,
          'mongodb://arlo:dog@localhost:27017?slaveOk=true&authSource=admin');
      });

      it('should urlencode fields', function() {
        var url = new Connection({
          mongodb_username: '@rlo',
          mongodb_password: 'd@g',
          mongodb_database_name: '@dmin',
          authentication: 'MONGODB'
        }).driver_url;
        assert.equal(url,
          'mongodb://%40rlo:d%40g@localhost:27017?slaveOk=true&authSource=%40dmin');
      });
    });
  });

  describe('When authentication is LDAP', function() {
    it('should be marked as not yet unsupported', function() {
      isNotValidAndHasMessage(new Connection({
        authentication: 'LDAP'
      }), 'not yet supported');
    });
  });
  describe('When authentication is X509', function() {
    it('should be marked as not yet unsupported', function() {
      isNotValidAndHasMessage(new Connection({
        authentication: 'X509'
      }), 'not yet supported');
    });
  });

  describe('When authentication is KERBEROS', function() {
    it('should require a principal', function() {
      isNotValidAndHasMessage(new Connection({
        authentication: 'KERBEROS'
      }), 'kerberos_principal field is required');
    });

    it('should *only* require a principal', function() {
      assert.equal(new Connection({
        authentication: 'KERBEROS',
        kerberos_principal: 'lucas@kerb.mongodb.parts'
      }).isValid(), true);
    });

    it('should return the correct URL for the driver', function() {
      var url = new Connection({
        kerberos_principal: 'arlo/dog@krb5.mongodb.parts',
        kerberos_password: 'w@@f',
        kerberos_service_name: 'mongodb',
        authentication: 'KERBEROS'
      }).driver_url;
      assert.equal(url,
        'mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/'
        + 'kerberos?slaveOk=true&gssapiServiceName=mongodb&authMechanism=GSSAPI');
    });
  });
  // describe('Basic Username/Password Strings', function() {
  //
  // describe('Enterprise Auth', function() {
  //   var connection = new Connection({
  //     mongodb_username: 'arlo',
  //     mongodb_password: 'dog',
  //     ssl: true
  //   });
  //   it('should connect using ssl', function(done) {
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo:dog',
  //       hostname: 'localhost',
  //       port: '27017',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         ssl: true
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {},
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using ssl with validation', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: 'arlo',
  //       mongodb_password: 'dog',
  //       ssl: true,
  //       ssl_validate: true
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo:dog',
  //       hostname: 'localhost',
  //       port: '27017',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         ssl: true
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {
  //         sslValidate: true
  //       },
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using ssl with a CA', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: 'arlo',
  //       mongodb_password: 'dog',
  //       ssl: true,
  //       ssl_ca: ['ca1', 'ca2']
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo:dog',
  //       hostname: 'localhost',
  //       port: '27017',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         ssl: true
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {
  //         sslCA: ['ca1', 'ca2']
  //       },
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using ssl with a cert', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: 'arlo',
  //       mongodb_password: 'dog',
  //       ssl: true,
  //       ssl_cert: 'cert'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo:dog',
  //       hostname: 'localhost',
  //       port: '27017',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         ssl: true
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {
  //         sslCert: 'cert'
  //       },
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using ssl with a key', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: 'arlo',
  //       mongodb_password: 'dog',
  //       ssl: true,
  //       ssl_private_key: 'key'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo:dog',
  //       hostname: 'localhost',
  //       port: '27017',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         ssl: true
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {
  //         sslKey: 'key'
  //       },
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using ssl with a password', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: 'arlo',
  //       mongodb_password: 'dog',
  //       ssl: true,
  //       ssl_private_key_password: 'pass'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo:dog',
  //       hostname: 'localhost',
  //       port: '27017',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         ssl: true
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {
  //         sslPass: 'pass'
  //       },
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using authmechanism', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: 'arlo',
  //       mongodb_password: 'dog',
  //       auth_mechanism: 'PLAIN'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo:dog',
  //       hostname: 'localhost',
  //       port: '27017',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         authMechanism: 'PLAIN'
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {},
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using only a username if provided', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: 'arlo',
  //       auth_mechanism: 'MONGODB-X509'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo',
  //       hostname: 'localhost',
  //       port: '27017',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         authMechanism: 'MONGODB-X509'
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {},
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using only a username and it should be urlencoded', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: '@rlo',
  //       auth_mechanism: 'MONGODB-X509'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: '@rlo',
  //       hostname: 'localhost',
  //       port: '27017',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         authMechanism: 'MONGODB-X509'
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {},
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using authmechanism and gssapiServiceName', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: 'arlo',
  //       mongodb_password: 'dog',
  //       auth_mechanism: 'GSSAPI',
  //       kerberos_service_name: 'mongodb'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo:dog',
  //       hostname: 'localhost',
  //       port: '27017',
  //       pathname: 'kerberos',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         authMechanism: 'GSSAPI',
  //         gssapiServiceName: 'mongodb'
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {},
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should connect using authmechanism and gssapiServiceName urlencoded', function(done) {
  //     var connection = new Connection({
  //       mongodb_username: 'arlo',
  //       mongodb_password: 'dog',
  //       auth_mechanism: 'GSSAPI',
  //       kerberos_service_name: 'm@ngodb'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'arlo:dog',
  //       hostname: 'localhost',
  //       port: '27017',
  //       pathname: 'kerberos',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         authMechanism: 'GSSAPI',
  //         gssapiServiceName: 'm@ngodb'
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {},
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should work for standard kerberos', function(done) {
  //     var connection = new Connection({
  //       hostname: 'ldaptest.10gen.cc',
  //       port: null,
  //       mongodb_username: 'integrations@LDAPTEST.10GEN.CC',
  //       auth_mechanism: 'GSSAPI',
  //       kerberos_service_name: 'mongodb'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'integrations@LDAPTEST.10GEN.CC',
  //       hostname: 'ldaptest.10gen.cc',
  //       pathname: 'kerberos',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         authMechanism: 'GSSAPI',
  //         gssapiServiceName: 'mongodb'
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {},
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should work for standard kerberos with a password', function(done) {
  //     var connection = new Connection({
  //       hostname: 'ldaptest.10gen.cc',
  //       port: null,
  //       mongodb_username: 'integrations@LDAPTEST.10GEN.CC',
  //       mongodb_password: 'compass',
  //       auth_mechanism: 'GSSAPI',
  //       kerberos_service_name: 'mongodb'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'integrations@LDAPTEST.10GEN.CC:compass',
  //       hostname: 'ldaptest.10gen.cc',
  //       pathname: 'kerberos',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         authMechanism: 'GSSAPI',
  //         gssapiServiceName: 'mongodb'
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {},
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  //
  //   it('should work for standard kerberos with a password urlencoded', function(done) {
  //     var connection = new Connection({
  //       hostname: 'ldaptest.10gen.cc',
  //       port: null,
  //       mongodb_username: 'integrations@LDAPTEST.10GEN.CC',
  //       mongodb_password: 'comp@ss',
  //       auth_mechanism: 'GSSAPI',
  //       kerberos_service_name: 'mongodb'
  //     });
  //     var correctURL = url.format({
  //       protocol: 'mongodb',
  //       slashes: true,
  //       auth: 'integrations@LDAPTEST.10GEN.CC:comp@ss',
  //       hostname: 'ldaptest.10gen.cc',
  //       pathname: 'kerberos',
  //       query: {
  //         slaveOk: true,
  //         authSource: 'admin',
  //         authMechanism: 'GSSAPI',
  //         gssapiServiceName: 'mongodb'
  //       }
  //     });
  //     var correctOptions = {
  //       uri_decode_auth: true,
  //       db: {},
  //       server: {},
  //       replSet: {
  //         connectWithNoPrimary: true
  //       },
  //       mongos: {}
  //     };
  //
  //     verifyConnection(connection, correctURL, correctOptions, done);
  //   });
  // });
});
