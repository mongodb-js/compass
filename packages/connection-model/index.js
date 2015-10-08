var toURL = require('url').format;
var format = require('util').format;
var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');
var assign = require('lodash.assign');
var contains = require('lodash.contains');
var pick = require('lodash.pick');
var omit = require('lodash.omit');
var parse = require('mongodb-url');
var debug = require('debug')('mongodb-connection-model');

var Connection = {};
var props = {};
var derived = {};

/**
 * # Top-Level
 */
assign(props, {
  /**
   * User specified name for this connection.
   *
   * @example
   *   My Laptop
   *   PRODUCTION
   *   Analyics Box
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
  }
});

assign(derived, {
  /**
   * @see http://npm.im/mongodb-instance-model
   */
  instance_id: {
    deps: ['hostname', 'port'],
    fn: function() {
      return format('%s:%s', this.hostname, this.port);
    }
  }
});

/**
 * ## Authentication
 */
assign(props, {
  /**
   * `auth_mechanism` for humans.
   */
  authentication: {
    type: 'string',
    values: [
      /**
       * Use no authentication.
       */
      'NONE',
      /**
       * Allow the driver to autodetect and select SCRAM-SHA-1
       * or MONGODB-CR depending on server capabilities.
       */
      'MONGODB',
      /**
       * @enterprise
       * @see http://bit.ly/mongodb-node-driver-x509
       */
      'X509',
      /**
       * @enterprise
       * @see http://bit.ly/mongodb-node-driver-kerberos
       */
      'KERBEROS',
      /**
       * @enterprise
       * @see http://bit.ly/mongodb-node-driver-ldap
       */
      'LDAP'
    ],
    default: 'NONE'
  }
});

// For `connection-model` -> `URL`
var AUTHENICATION_TO_AUTH_MECHANISM = {
  NONE: undefined,
  /**
   * @todo (imlucas): Double check latest driver
   * that `url_parser.js` no longer barfs if
   * the url contains `auth_mechanism=DEFAULT`
   * and uncomment the below as we would
   * much rather this be explicit.
   */
  // 'MONGODB': 'DEFAULT',
  MONGODB: undefined,
  KERBEROS: 'GSSAPI',
  X509: 'MONGODB-X509',
  LDAP: 'PLAIN'
};

// For `URL` -> `connection-model`
var AUTH_MECHANISM_TO_AUTHENTICATION = {
  '': 'NONE',
  DEFAULT: 'MONGODB',
  'SCRAM-SHA-1': 'MONGODB',
  'MONGODB-CR': 'MONGODB',
  'MONGODB-X509': 'X509',
  GSSAPI: 'KERBEROS',
  PLAIN: 'LDAP'
};

var AUTHENTICATION_TO_FIELD_NAMES = {
  NONE: [],
  MONGODB: [
    'mongodb_username', // required
    'mongodb_password', // required
    'mongodb_database_name' // optional
  ],
  KERBEROS: [
    'kerberos_principal', // required
    'kerberos_password', // optional
    'kerberos_service_name' // optional
  ],
  X509: [],
  LDAP: []
};

assign(derived, {
  /**
   * Converts the value of `authentication` (for humans)
   * into the `auth_mechanism` value for the driver.
   */
  driver_auth_mechanism: {
    type: 'string',
    deps: ['authentication'],
    fn: function() {
      return AUTHENICATION_TO_AUTH_MECHANISM[this.authentication];
    }
  }
});

/**
 * ### `authentication = MONGODB`
 */
assign(props, {
  mongodb_username: {
    type: 'string',
    default: undefined
  },
  mongodb_password: {
    type: 'string',
    default: undefined
  },
  /**
   * The database name associated with the user's credentials.
   * If `authentication === 'MONGODB'`,
   * the value for `authSource` to pass to the driver.
   *
   * @see http://docs.mongodb.org/manual/reference/connection-string/#uri.authSource
   */
  mongodb_database_name: {
    type: 'string',
    default: undefined
  }
});

/**
 * ### `authentication = KERBEROS`
 */

assign(props, {
  /**
   * Any program or computer you access over a network. Examples of
   * services include “host” (a host, e.g., when you use telnet and rsh),
   * “ftp” (FTP), “krbtgt” (authentication; cf. ticket-granting ticket),
   * and “pop” (email).
   *
   * Formerly kerberos_service_name
   */
  kerberos_service_name: {
    type: 'string',
    default: undefined
  },
  /**
   * The format of a typical Kerberos V5 principal is `primary/instance@REALM`.
   *
   * @example
   *   jennifer/admin@ATHENA.MIT.EDU
   *   jennifer@ATHENA.MIT.EDU
   *
   * @see http://bit.ly/kerberos-principal
   * @note (imlucas): When passed to the driver, this should be
   * `mongodb://#{encodeURIComponent(this.kerberos_principal)}`
   */
  kerberos_principal: {
    type: 'string',
    default: undefined
  },
  /**
   * You can optionally include a password for a kerberos connection.
   * Including a password is useful on windows if you don’t have a
   * security domain set up.
   * If no password is supplied, it is expected that a valid kerberos
   * ticket has already been created for the principal.
   */
  kerberos_password: {
    type: 'string',
    default: undefined
  }
});

/**
 * ## SSL
 *
 * @note (imlucas): Not to be confused with `authentication=X509`!
 */
// assign(props, {
//   ssl: {
//     type: 'boolean',
//     default: false
//   },
//   ssl_validate: {
//     type: 'boolean',
//     default: false
//   },
//
//   /**
//    * Array of valid certificates either as Buffers or Strings
//    * (needs to have a mongod server with ssl support, 2.4 or higher).
//    */
//   ssl_ca: {
//     type: 'array',
//     default: undefined
//   },
//
//   /**
//    * String or buffer containing the certificate we wish to present
//    * (needs to have a mongod server with ssl support, 2.4 or higher).
//    */
//   ssl_cert: {
//     type: 'string',
//     default: undefined
//   },
//   /**
//    * String or buffer containing the certificate private key we wish to present
//    * (needs to have a mongod server with ssl support, 2.4 or higher).
//    */
//   ssl_private_key: {
//     type: 'string',
//     default: undefined
//   },
//   /**
//    * String or buffer containing the certificate password
//    * (needs to have a mongod server with ssl support, 2.4 or higher).
//    */
//   ssl_private_key_password: {
//     type: 'string',
//     default: undefined
//   }
// });

/**
 * ## Driver Connection Options
 *
 * So really everything above is all about putting
 * a human API on top of the two arguments `scout-server`
 * will always blindly pass to the driver when connecting to mongodb:
 * `MongoClient.connect(model.driver_url, model.driver_options)`.
 */
assign(derived, {
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

      if (this.ssl) {
        req.query.ssl = 'true';
      }

      if (this.authentication === 'NONE') {
        return toURL(req);
      }

      if (this.authentication === 'MONGODB') {
        assign(req, {
          auth: format('%s:%s', this.mongodb_username, this.mongodb_password),
          query: {
            slaveOk: 'true',
            authSource: this.mongodb_database_name || 'admin'
          }
        });
        return toURL(req);
      }

      if (this.authentication === 'KERBEROS') {
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
        return toURL(req);
      }

      throw new TypeError('Unspported authentication method.');
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
      'ssl_validate',
      'ssl_ca',
      'ssl_cert',
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
        server: {},
        replSet: {
          ha: false,
          connectWithNoPrimary: true
        },
        mongos: {}
      };

      // @todo (imlucas): Circle back on SSL after compass 0.4.3.
      // if (this.ssl_validate) {
      //   opts.server.sslValidate = true;
      // }
      // if (this.ssl_ca) {
      //   opts.server.sslCA = this.ssl_ca;
      // }
      // if (this.ssl_cert) {
      //   opts.server.sslCert = this.ssl_cert;
      // }
      // if (this.ssl_private_key) {
      //   opts.server.sslKey = this.ssl_private_key;
      // }
      // if (this.ssl_private_key_password) {
      //   opts.server.sslPass = this.ssl_private_key_password;
      // }
      return connectionOptions;
    }
  }
});

/**
 * An ampersand.js model to represent a connection to a MongoDB database.
 * It does not actually talk to MongoDB.  It is just a higher-level
 * abstraction that prepares arguments for `MongoClient.connect`.
**/
Connection = AmpersandModel.extend({
  namespace: 'Connection',
  idAttribute: 'instance_id',
  props: props,
  derived: derived,
  initialize: function(attrs) {
    attrs = attrs || {};
    debug('initialize', attrs);
    this.parse(attrs);
  },
  parse: function(attrs) {
    debug('parsing `%j`', attrs);
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
    debug('parse result `%j`', attrs);
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

      /**
       * Enforce constraints for SSL.
       */
      // @todo (imlucas): Circle back on SSL after compass 0.4.3.
      // if (!attrs.ssl) {
      //   if (attrs.ssl_validate) {
      //     throw new TypeError('The ssl_validate field requires ssl.');
      //   }
      //   if (attrs.ssl_ca) {
      //     throw new TypeError('The ssl_ca field requires ssl.');
      //   }
      //   if (attrs.ssl_cert) {
      //     throw new TypeError('The ssl_cert field requires ssl.');
      //   }
      //   if (attrs.ssl_private_key) {
      //     throw new TypeError('The ssl_private_key field requires ssl.');
      //   }
      //   if (attrs.ssl_private_key_password) {
      //     throw new TypeError('The ssl_private_key_password field requires ssl.');
      //   }
      // }

      /**
       * Enforce constraints for Kerberos.
       */
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
    } catch (err) {return err;}
    debug('attributes are valid');
  },
  serialize: function(options) {
    options = options || {};
    options.credentials = options.credentials || false;

    var credentialKeys = AUTHENTICATION_TO_FIELD_NAMES[this.authentication];
    var res = AmpersandModel.prototype.serialize.call(this, options);
    var args = [res];
    args.push.apply(args, credentialKeys);

    if (options.credentials) {
      if (credentialKeys.length === 0) return undefined;
      return pick.apply(null, args);
    }

    if (credentialKeys.length == 0) {
      return res;
    }

    return omit.apply(null, args);
  }
});

/**
 * For easy command line integration.
 *
 * @example
 *   var args = require('minimist')(process.argv.slice(2));
 *   var Connection = require('mongodb-connection-model');
 *   var createClient = require('scout-client');
 *   args.endpoint = args.endpoint || 'https://localhost:29017';
 *   var client = createClient(args.endpoint, Connection.from(args._[0]));
 *
 * @param {String} [url]
 * @return {Connection}
 */
Connection.from = function(url) {
  if (!url) {
    url = 'mongodb://localhost:27017';
  }

  var parsed = parse(url);
  var attrs = {
    hostname: parsed.servers[0].host,
    port: parsed.servers[0].port
  };

  if (parsed.username && !parsed.authMechanism) {
    parsed.authMechanism = 'DEFAULT';
  }

  if (parsed.authMechanism) {
    attrs.authentication = parsed.authMechanism[AUTH_MECHANISM_TO_AUTHENTICATION];

    if (contains(['DEFAULT', 'SCRAM-SHA-1', 'MONGODB-CR'], attrs.authentication)) {
      attrs.mongodb_username = parsed.username;
      attrs.mongodb_password = parsed.password;
      attrs.mongodb_database_name = parsed.dbName;
    }
  }
  return new Connection(attrs);
};

/**
 * For a given `authentication` strategy, what are the applicable
 * field names for say a form?
 *
 * @param {String} authentication - @see {Connection#authentication}
 * @return {Array}
 */
Connection.getFieldNames = function(authentication) {
  return AUTHENTICATION_TO_FIELD_NAMES[authentication];
};

var ConnectionCollection = AmpersandCollection.extend({
  comparator: 'instance_id',
  model: Connection,
  modelType: 'ConnectionCollection'
});

module.exports = Connection;
module.exports.Collection = ConnectionCollection;
