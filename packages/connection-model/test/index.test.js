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
    it('should produce the correct driver URL');
    it('should produce the correct driver options');
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
});
