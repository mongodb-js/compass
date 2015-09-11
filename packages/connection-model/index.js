var url = require('url');
var format = require('util').format;
var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');

/**
 * An ampersand.js model to represent a connection to a MongoDB database.
 * It does not actually talk to MongoDB.  It is just a higher-level
 * abstraction that prepares arguments for `MongoClient.connect`.
**/
var Connection = AmpersandModel.extend({
  namespace: 'Connection',
  idAttribute: 'instance_id',
  props: {
    /**
     * User specified name for this connection.
     */
    name: {
      type: 'string',
      default: 'Local'
    },
    hostname: {
      type: 'string',
      default: 'localhost'
    },
    port: {
      type: 'number',
      default: 27017
    },
    mongodb_username: {
      type: 'string',
      default: null
    },
    mongodb_password: {
      type: 'string',
      default: null
    },
    /**
     * Used when the user for authentication is stored
      in another database using indirect authentication.
     */
    auth_source: {
      type: 'string',
      default: 'admin'
    },
    /**
     * GSSAPI = Kerberos, PLAIN = LDAP
     */
    auth_mechanism: {
      type: 'string',
      values: [null, 'SCRAM-SHA-1', 'MONGODB-CR', 'MONGODB-X509', 'GSSAPI', 'PLAIN'],
      default: null
    },
    gssapi_service_name: {
      type: 'string',
      default: null
    },
    /**
     * a.k.a `authdb`
     */
    database_name: {
      type: 'string',
      default: 'admin'
    },
    ssl: {
      type: 'boolean',
      default: false
    },
    /**
     * Validate mongod server certificate against ca
     * (needs to have a mongod server with ssl support, 2.4 or higher).
     */
    ssl_validate: {
      type: 'boolean',
      default: false
    },

    /**
     * Array of valid certificates either as Buffers or Strings
     * (needs to have a mongod server with ssl support, 2.4 or higher).
     */
    ssl_ca: {
      type: 'array',
      default: null
    },

    /**
     * String or buffer containing the certificate we wish to present
     * (needs to have a mongod server with ssl support, 2.4 or higher).
     */
    ssl_cert: {
      type: 'string',
      default: null
    },

    /**
     * String or buffer containing the certificate private key we wish to present
     * (needs to have a mongod server with ssl support, 2.4 or higher).
     */
    ssl_private_key: {
      type: 'string',
      default: null
    },

    /**
     * String or buffer containing the certificate password
     * (needs to have a mongod server with ssl support, 2.4 or higher).
     */
    ssl_private_key_password: {
      type: 'string',
      default: null
    }
  },

  validate: function(attrs) {
    if (attrs.auth_mechanism === 'GSSAPI') {
      if (!attrs.gssapi_service_name) {
        return new TypeError('The `gssapi_service_name` '
          + 'field is required when using GSSAPI as the auth mechanism.');
      }
    }

    if (attrs.gssapi_service_name) {
      if (attrs.auth_mechanism !== 'GSSAPI') {
        return new TypeError(format(
          'The `gssapi_service_name` field does not apply when '
          + 'using `%s` as the auth mechanism.', attrs.auth_mechanism));
      }
    }

    if (!attrs.ssl) {
      if (attrs.ssl_validate) {
        return new TypeError('The `ssl_validate` field requires `ssl = true`.');
      }
      if (attrs.ssl_ca) {
        return new TypeError('The `ssl_ca` field requires `ssl = true`.');
      }
      if (attrs.ssl_cert) {
        return new TypeError('The `ssl_cert` field requires `ssl = true`.');
      }
      if (attrs.ssl_private_key) {
        return new TypeError('The `ssl_private_key` field requires `ssl = true`.');
      }
      if (attrs.ssl_private_key_password) {
        return new TypeError('The `ssl_private_key_password` field requires `ssl = true`.');
      }
    }
  },

  derived: {
    instance_id: {
      deps: ['hostname', 'port'],
      fn: function() {
        return format('%s:%s', this.hostname, this.port);
      }
    },
    /**
     * Get the URI which can be passed to `MongoClient.connect`.
     * @see http://mongodb.github.io/node-mongodb-native/2.0/api/MongoClient.html#.connect
     * @return {String}
     */
    uri: {
      deps: ['hostname', 'port', 'ssl', 'auth_source', 'auth_mechanism',
        'gssapi_service_name', 'mongodb_username', 'mongodb_password'],
      fn: function() {
        var urlObj = {
          protocol: 'mongodb',
          slashes: true,
          hostname: this.hostname,
          port: this.port,
          query: {
            slaveOk: 'true'
          }
        };

        if (this.auth_source) {
          urlObj.query.authSource = this.auth_source;
        }

        if (this.mongodb_username && this.mongodb_password) {
          urlObj.auth = this.mongodb_username + ':' + this.mongodb_password;
        } else if (this.mongodb_username) {
          urlObj.auth = this.mongodb_username;
        }

        if (this.ssl) {
          urlObj.query.ssl = this.ssl;
        }
        if (this.auth_mechanism) {
          urlObj.query.authMechanism = this.auth_mechanism;
        }
        if (this.auth_mechanism === 'GSSAPI') {
          urlObj.pathname = 'kerberos';
        }
        if (this.gssapi_service_name) {
          urlObj.query.gssapiServiceName = this.gssapi_service_name;
        }

        return url.format(urlObj);
      }
    },
    /**
     * Get the options which can be passed to `MongoClient.connect`
     * in addition to the URI.
     * @see http://mongodb.github.io/node-mongodb-native/2.0/api/MongoClient.html#.connect
     * @return {Object}
     */
    options: {
      deps: ['ssl_validate', 'ssl_ca', 'ssl_cert',
        'ssl_private_key', 'ssl_private_key_password'],
      fn: function() {
        var connectionOptions = {
          uri_decode_auth: true,
          db: {},
          server: {},
          replSet: {
            connectWithNoPrimary: true
          },
          mongos: {}
        };

        if (this.ssl_validate) {
          connectionOptions.server.sslValidate = true;
        }
        if (this.ssl_ca) {
          connectionOptions.server.sslCA = this.ssl_ca;
        }
        if (this.ssl_cert) {
          connectionOptions.server.sslCert = this.ssl_cert;
        }
        if (this.ssl_private_key) {
          connectionOptions.server.sslKey = this.ssl_private_key;
        }
        if (this.ssl_private_key_password) {
          connectionOptions.server.sslPass = this.ssl_private_key_password;
        }
        return connectionOptions;
      }
    }
  }
});

var ConnectionCollection = AmpersandCollection.extend({
  comparator: 'instance_id',
  model: Connection,
  modelType: 'ConnectionCollection'
});

module.exports = Connection;
module.exports.Collection = ConnectionCollection;
