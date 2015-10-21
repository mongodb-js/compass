var app = require('ampersand-app');
var BaseConnection = require('mongodb-connection-model');
var connectionSync = require('./connection-sync')();
var client = require('scout-client');
var debug = require('debug')('scout:models:connection');
var uuid = require('uuid');
var bugsnag = require('../bugsnag');

/**
 * @note (imlucas) See note below on `mongodb-connection-model`
 * as this plucking uses these imports internally.
 */
var toURL = require('url').format;
var format = require('util').format;
var _ = require('lodash');
var assign = _.assign;
var contains = _.contains;

/**
 * @todo (imlucas) Merge `dataTypes` back into
 * `mongodb-connection-model` when stabilized.
 */
var dataTypes = {};
/**
 * `authentication` ENUM
 *
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-authentication
 * @see ./src/connect/authentication.js
 */
dataTypes.authentication = {
  type: 'string',
  default: 'NONE',
  values: [
    'NONE',
    'MONGODB',
    'KERBEROS',
    'X509',
    'LDAP'
  ]
};

/**
 * `ssl` ENUM
 *
 * @note (imlucas): Not to be confused with `authentication=X509`!
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-ssl
 * @see ./src/connect/ssl.js
 */
dataTypes.ssl = {
  type: 'string',
  values: [
    /**
     * Do not use SSL for anything.
     */
    'NONE',
    /**
     * Use SSL but do not perform any validation of the certificate chain.
     */
    'UNVALIDATED',
    /**
     * The driver should validate the server certificate and fail to connect if validation fails.
     */
    'SERVER',
    /**
     * The driver must present a valid certificate and validate the server certificate.
     */
    'ALL'
  ],
  default: 'NONE'
};

/**
 * Configuration for connecting to a MongoDB Deployment.
 */
var Connection = BaseConnection.extend({
  dataTypes: dataTypes,
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      default: function() {
        return uuid.v4();
      }
    },
    /**
     * Updated on each successful connection to the Deployment.
     */
    last_used: 'date',
    is_favorite: {
      type: 'boolean',
      default: false
    },
    /*
     * @note (imlucas) `ssl` props plucked from upcoming
     * `mongodb-connection-model` release to figure out if
     * they are viable IRL and should be merged back into
     * `mongodb-connection-model` for compass@0.5.0.
     */
    ssl: dataTypes.ssl,
    /**
      * Array of valid certificates either as Buffers or Strings
      * (needs to have a mongod server with ssl support, 2.4 or higher).
      */
    ssl_ca: {
      type: 'array',
      default: undefined
    },
    /**
     * String or buffer containing the certificate we wish to present
     * (needs to have a mongod server with ssl support, 2.4 or higher).
     */
    ssl_certificate: {
      type: 'string',
      default: undefined
    },
    /**
     * String or buffer containing the certificate private key we wish to present
     * (needs to have a mongod server with ssl support, 2.4 or higher).
     */
    ssl_private_key: {
      type: 'string',
      default: undefined
    },
    /**
     * String or buffer containing the certificate password
     * (needs to have a mongod server with ssl support, 2.4 or higher).
     */
    ssl_private_key_password: {
      type: 'string',
      default: undefined
    }
  },
  /**
   * Called by `./src/connect/index.js` to make sure
   * the user can connect to MongoDB before trying to
   * open the schema view.
   * @param {Function} done - Callback `(err, model)`
   *
   * @see `scout-client#test()` http://git.io/vWLRf
   */
  test: function(done) {
    var model = this;
    var connection = model.serialize({
      all: true
    });

    var onInstanceFetched = function(err, res) {
      if (!err) {
        debug('woot.  all gravy!  able to see %s collections', res.collections.length);
        done(null, model);
        return;
      }
      debug('could not get collection list :( sending to bugsnag for follow up...');
      bugsnag.notify(err, 'collection list failed');
      done(err);
    };

    debug('Can we connect with `%j`?', connection);
    client.test(app.endpoint, connection, function(err) {
      if (err) {
        bugsnag.notify(err, 'connection test failed');
        return done(err);
      }

      debug('test worked!');
      debug('Can we use `%j` to actually get a list of collections?', connection);
      client(app.endpoint, connection).instance(onInstanceFetched);
    });
    return this;
  },
  sync: connectionSync,
  /*
   * @note (imlucas) Everything from here down plucked from upcoming
   * `mongodb-connection-model` release to figure out if
   * they are viable IRL and should be merged back into
   * `mongodb-connection-model` for compass@0.5.0.
   */
  derived: {
    /**
     * Get the URL which can be passed to `MongoClient.connect`.
     * @see http://bit.ly/mongoclient-connect
     * @return {String}
     */
    driver_url: {
      deps: [
        'hostname',
        'port',
        'ssl',
        'kerberos_principal',
        'kerberos_password',
        'kerberos_service_name',
        'mongodb_username',
        'mongodb_password',
        'mongodb_database_name',
        'driver_auth_mechanism'
      ],
      fn: function() {
        var req = {
          protocol: 'mongodb',
          slashes: true,
          hostname: this.hostname,
          port: this.port,
          query: {
            slaveOk: 'true'
          }
        };

        if (this.authentication === 'MONGODB') {
          assign(req, {
            auth: format('%s:%s', this.mongodb_username, this.mongodb_password),
            query: {
              slaveOk: 'true',
              authSource: this.mongodb_database_name || 'admin'
            }
          });
        } else if (this.authentication === 'KERBEROS') {
          assign(req, {
            pathname: 'kerberos',
            query: {
              slaveOk: 'true',
              gssapiServiceName: this.kerberos_service_name,
              authMechanism: this.driver_auth_mechanism
            }
          });

          if (this.kerberos_password) {
            req.auth = format('%s:%s',
              encodeURIComponent(this.kerberos_principal),
              this.kerberos_password);
          } else {
            req.auth = format('%s',
              encodeURIComponent(this.kerberos_principal));
          }
        }

        if (contains(this.ssl, 'UNVALIDATED', 'SERVER', 'ALL')) {
          req.query.ssl = 'true';
        }

        return toURL(req);
      }
    },
    /**
     * Get the options which can be passed to `MongoClient.connect`
     * in addition to the URI.
     * @see http://mongodb.github.io/node-mongodb-native/2.0/api/MongoClient.html#.connect
     * @return {Object}
     */
    driver_options: {
      deps: [
        'ssl',
        'ssl_ca',
        'ssl_certificate',
        'ssl_private_key',
        'ssl_private_key_password'
      ],
      fn: function() {
        var opts = {
          uri_decode_auth: true,
          db: {
            // important!  or slaveOk=true set above no worky!
            readPreference: 'nearest'
          },
          replSet: {
            connectWithNoPrimary: true
          }
        };
        if (this.authentication === 'X509') {
          throw new TypeError('X509 not currently supported');
        } else if (this.ssl === 'SERVER') {
          assign(opts, {
            server: {
              sslValidate: true,
              sslCA: this.ssl_ca
            }
          });
        } else if (this.ssl === 'ALL') {
          assign(opts, {
            server: {
              sslValidate: true,
              sslCA: this.ssl_ca,
              sslKey: this.ssl_private_key,
              sslCert: this.ssl_certificate,
              sslPass: this.ssl_private_key_password
            }
          });
        }
        return opts;
      }
    }
  },
  initialize: function(attrs) {
    attrs = attrs || {};
    debug('initialize', attrs);
    this.parse(attrs);
  },
  parse: function(attrs) {
    if (attrs.mongodb_username) {
      this.authentication = 'MONGODB';
    } else if (attrs.kerberos_principal) {
      this.authentication = 'KERBEROS';
    }

    if (attrs.authentication === 'MONGODB') {
      if (!attrs.mongodb_database_name) {
        attrs.mongodb_database_name = 'admin';
      }
    }
    if (attrs.authentication === 'KERBEROS') {
      if (!attrs.kerberos_service_name) {
        attrs.kerberos_service_name = 'mongodb';
      }
    }
    return attrs;
  },

  validate: function(attrs) {
    debug('validating...');
    try {
      if (attrs.authentication === 'X509') {
        throw new TypeError('X.509 authentication not yet supported.');
      }

      if (attrs.authentication === 'LDAP') {
        throw new TypeError('LDAP authentication not yet supported.');
      }

      this.validate_ssl();
      this.validate_kerberos();
    } catch (err) {
      return err;
    }
    debug('attributes are valid');
  },
  /**
   * Enforce constraints for SSL.
   * @param {Object} attrs - Incoming attributes.
   */
  validate_ssl: function(attrs) {
    if (!attrs.ssl || contains(['NONE', 'UNVALIDATED'], attrs.ssl)) {
      return;
    }
    if (attrs.ssl === 'SERVER' && !attrs.ssl_ca) {
      throw new TypeError('ssl_ca is required when ssl is SERVER.');
    } else if (attrs.ssl === 'ALL') {
      if (!attrs.ssl_ca) {
        throw new TypeError('ssl_ca is required when ssl is ALL.');
      }

      if (!attrs.ssl_private_key) {
        throw new TypeError('ssl_private_key is required when ssl is ALL.');
      }

      if (!attrs.ssl_certificate) {
        throw new TypeError('ssl_certificate is required when ssl is ALL.');
      }
    }
  },
  /**
   * Enforce constraints for Kerberos.
   * @param {Object} attrs - Incoming attributes.
   */
  validate_kerberos: function(attrs) {
    if (attrs.authentication !== 'KERBEROS') {
      if (attrs.kerberos_service_name) {
        throw new TypeError(format(
          'The kerberos_service_name field does not apply when '
          + 'using %s for authentication.', attrs.authentication));
      }
      if (attrs.kerberos_principal) {
        throw new TypeError(format(
          'The kerberos_principal field does not apply when '
          + 'using %s for authentication.', attrs.authentication));
      }
      if (attrs.kerberos_password) {
        throw new TypeError(format(
          'The kerberos_password field does not apply when '
          + 'using %s for authentication.', attrs.authentication));
      }
    }

    if (attrs.authentication === 'KERBEROS') {
      if (!attrs.kerberos_principal) {
        throw new TypeError(format(
          'The kerberos_principal field is required when '
          + 'using KERBEROS for authentication.'));
      }
    }
  }
});

module.exports = Connection;
module.exports.dataTypes = dataTypes;
