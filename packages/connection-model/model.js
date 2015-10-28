var toURL = require('url').format;
var format = require('util').format;
var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');
var assign = require('lodash.assign');
var defaults = require('lodash.defaults');
var contains = require('lodash.contains');
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
 * @constant {Array} - Allowed values for the `authentication` field.
 */
var AUTHENTICATION_VALUES = [
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
];

/**
 * @constant {String} - The default value for `authentication`.
 */
var AUTHENTICATION_DEFAULT = 'NONE';

assign(props, {
  /**
   * @property {String} authentication - `auth_mechanism` for humans.
   */
  authentication: {
    type: 'string',
    values: AUTHENTICATION_VALUES,
    default: AUTHENTICATION_DEFAULT
  }
});

/**
 * @constant {Object} - Maps driver auth_mechanism to `authentication`.
 */
var AUTHENICATION_TO_AUTH_MECHANISM = {
  NONE: undefined,
  MONGODB: 'DEFAULT',
  KERBEROS: 'GSSAPI',
  X509: 'MONGODB-X509',
  LDAP: 'PLAIN'
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
 * @constant {Object} - Maps `authentication` to driver auth_mechanism.
 */
var AUTH_MECHANISM_TO_AUTHENTICATION = {
  '': 'NONE',
  DEFAULT: 'MONGODB',
  'SCRAM-SHA-1': 'MONGODB',
  'MONGODB-CR': 'MONGODB',
  'MONGODB-X509': 'X509',
  GSSAPI: 'KERBEROS',
  SSAPI: 'KERBEROS',
  PLAIN: 'LDAP',
  LDAP: 'LDAP'
};

/**
 * @constant {Object} - Array of field names associated with each `authentication`.
 */
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
  X509: [
    'x509_username' // required
  ],
  LDAP: [
    'ldap_username', // required
    'ldap_password' // required
  ]
};

/**
 * ### `authentication = MONGODB`
 *
 * @example
 *   var c = new Connection({
 *     mongodb_username: 'arlo',
 *     mongodb_password: 'w@of'
 *   });
 *   console.log(c.driver_url)
 *   >>> mongodb://arlo:w%40of@localhost:27017?slaveOk=true&authSource=admin
 *   console.log(c.driver_options)
 *   >>> { uri_decode_auth: true,
 *     db: { readPreference: 'nearest' },
 *     replSet: { connectWithNoPrimary: true } }
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
   * The value for `authSource` to pass to the driver.
   *
   * @see http://docs.mongodb.org/manual/reference/connection-string/#uri.authSource
   */
  mongodb_database_name: {
    type: 'string',
    default: undefined
  }
});

var MONGODB_DATABASE_NAME_DEFAULT = 'admin';

/**
 * ### `authentication = KERBEROS`
 *
 * @example
 *   var c = new Connection({
 *     kerberos_service_name: 'mongodb',
 *     kerberos_password: 'w@@f',
 *     kerberos_principal: 'arlo/dog@krb5.mongodb.parts'
 *   });
 *   console.log(c.driver_url)
 *   >>> mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/kerberos?slaveOk=true&gssapiServiceName=mongodb&authMechanism=GSSAPI
 *   console.log(c.driver_options)
 *   >>> { uri_decode_auth: true,
 *     db: { readPreference: 'nearest' },
 *     replSet: { connectWithNoPrimary: true } }
 *
 * @enterprise
 * @see http://bit.ly/mongodb-node-driver-kerberos
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

var KERBEROS_SERVICE_NAME_DEFAULT = 'mongodb';

/**
 * ### `authentication = LDAP`
 *
 * @example
 *    var c = new Connection({
 *     ldap_username: 'arlo',
 *     ldap_password: 'w@of'
 *   });
 *   console.log(c.driver_url)
 *   >>> mongodb://arlo:w%40of@localhost:27017?slaveOk=true&authMechanism=PLAIN
 *   console.log(c.driver_options)
 *   >>> { uri_decode_auth: true,
 *     db: { readPreference: 'nearest' },
 *     replSet: { connectWithNoPrimary: true } }
 *
 * @enterprise
 * @see http://bit.ly/mongodb-node-driver-ldap
 */
assign(props, {
  /**
   * @see http://bit.ly/mongodb-node-driver-ldap
   * @see http://bit.ly/mongodb-ldap
   */
  ldap_username: {
    type: 'string',
    default: undefined
  },
  /**
   * @see http://bit.ly/mongodb-node-driver-ldap
   * @see http://bit.ly/mongodb-ldap
   */
  ldap_password: {
    type: 'string',
    default: undefined
  }
});

/**
 * ### `authentication = X509`
 *
 * @todo (imlucas): We've been assuming authenticaiton=X509 that SSL=ALL is implied,
 * but the driver docs only send `ssl_private_key` and `ssl_certificate`
 * so we may need to add another value to `SSL_VALUES`.  Need to verify this and
 * then update the example below.
 *
 * @example
 *   var c = new Connection({
 *    'x509_username': 'CN=client,OU=arlo,O=MongoDB,L=Philadelphia,ST=Pennsylvania,C=US',
 *   });
 *   console.log(c.driver_url)
 *   >>> mongodb://CN%253Dclient%252COU%253Darlo%252CO%253DMongoDB%252CL%253DPhiladelphia%252CST%253DPennsylvania%252CC%253DUS@localhost:27017?slaveOk=true&authMechanism=MONGODB-X509
 *   console.log(c.driver_options)
 *   >>> { uri_decode_auth: true,
 *    db: { readPreference: 'nearest' },
 *    replSet: { connectWithNoPrimary: true } }
 *
 * @see http://bit.ly/mongodb-node-driver-x509
 * @see http://bit.ly/mongodb-x509
 */
assign(props, {
  /**
   * The x.509 certificate derived user name, e.g. "CN=user,OU=OrgUnit,O=myOrg,..."
   */
  x509_username: {
    type: 'string',
    default: undefined
  }
});

/**
 * ## SSL
 *
 * @note (imlucas): Not to be confused with `authentication=X509`!
 */
/**
 * @constant {Array} - Allowed values for the `ssl` field.
 */
var SSL_VALUES = [
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
];

/**
 * @constant {String} - The default value for `ssl`.
 */
var SSL_DEFAULT = 'NONE';

assign(props, {
  ssl: {
    type: 'string',
    values: SSL_VALUES,
    default: SSL_DEFAULT
  },
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
});

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
        pathname: '/',
        query: {
          slaveOk: 'true'
        }
      };

      if (this.authentication === 'MONGODB') {
        req.auth = format('%s:%s', this.mongodb_username, this.mongodb_password);
        req.query.authSource = this.mongodb_database_name;
      } else if (this.authentication === 'KERBEROS') {
        req.pathname = '/kerberos';
        defaults(req.query, {
          gssapiServiceName: this.kerberos_service_name,
          authMechanism: this.driver_auth_mechanism
        });

        if (this.kerberos_password) {
          req.auth = format('%s:%s',
            encodeURIComponent(this.kerberos_principal),
            this.kerberos_password);
        } else {
          req.auth = format('%s:',
            encodeURIComponent(this.kerberos_principal));
        }
      } else if (this.authentication === 'X509') {
        req.auth = encodeURIComponent(this.x509_username);
        defaults(req.query, {
          authMechanism: this.driver_auth_mechanism
        });
      } else if (this.authentication === 'LDAP') {
        req.auth = format('%s:%s',
          encodeURIComponent(this.ldap_username),
          this.ldap_password);
        defaults(req.query, {
          authMechanism: this.driver_auth_mechanism
        });
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
      if (this.ssl === 'SERVER') {
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
    if (!attrs) {
      return attrs;
    }
    debug('parsing...');
    if (attrs.mongodb_username) {
      this.authentication = attrs.authentication = 'MONGODB';
    } else if (attrs.kerberos_principal) {
      this.authentication = attrs.authentication = 'KERBEROS';
    } else if (attrs.ldap_username) {
      this.authentication = attrs.authentication = 'LDAP';
    } else if (attrs.x509_username) {
      this.authentication = attrs.authentication = 'X509';
    }

    if (attrs.authentication === 'MONGODB') {
      if (!attrs.mongodb_database_name) {
        attrs.mongodb_database_name = MONGODB_DATABASE_NAME_DEFAULT;
      }
      this.mongodb_database_name = attrs.mongodb_database_name;
    }
    if (attrs.authentication === 'KERBEROS') {
      if (!attrs.kerberos_service_name) {
        attrs.kerberos_service_name = KERBEROS_SERVICE_NAME_DEFAULT;
      }
      this.kerberos_service_name = attrs.kerberos_service_name;
    }

    if (attrs.ssl_ca && !Array.isArray(attrs.ssl_ca)) {
      this.ssl_ca = attrs.ssl_ca = [attrs.ssl_ca];
    }

    debug('parsing complete');
    return attrs;
  },

  validate: function(attrs) {
    debug('validating...');
    try {
      this.validate_ssl(attrs);
      this.validate_mongodb(attrs);
      this.validate_kerberos(attrs);
      this.validate_x509(attrs);
      this.validate_ldap(attrs);
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
  validate_mongodb: function(attrs) {
    if (attrs.authentication === 'MONGODB') {
      if (!attrs.mongodb_username) {
        throw new TypeError(format(
          'The mongodb_username field is required when '
          + 'using MONGODB for authentication.'));
      }

      if (!attrs.mongodb_password) {
        throw new TypeError(format(
          'The mongodb_password field is required when '
          + 'using MONGODB for authentication.'));
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
  },
  validate_x509: function(attrs) {
    if (attrs.authentication === 'X509') {
      if (!attrs.x509_username) {
        throw new TypeError(format(
          'The x509_username field is required when '
          + 'using X509 for authentication.'));
      }
    }
  },
  validate_ldap: function(attrs) {
    if (attrs.authentication === 'LDAP') {
      if (!attrs.ldap_username) {
        throw new TypeError(format(
          'The ldap_username field is required when '
          + 'using LDAP for authentication.'));
      }
      if (!attrs.ldap_password) {
        throw new TypeError(format(
          'The ldap_password field is required when '
          + 'using LDAP for authentication.'));
      }
    }
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
  /* eslint camelcase:0 */
  if (!url) {
    url = 'mongodb://localhost:27017';
  }

  var parsed = parse(url);
  debug('parsed url `%s`', url, parsed);
  debug('authMechanism is', parsed.db_options.authMechanism);

  var attrs = {
    hostname: parsed.servers[0].host,
    port: parsed.servers[0].port
  };

  if (parsed.auth) {
    /**
     * @todo (imlucas): This case is ambiguous... support `mongodb+ldap://user:pass@host`.
     */
    if (parsed.auth.user && parsed.auth.password) {
      parsed.authMechanism = 'DEFAULT';
    } else if (parsed.auth.user && !parsed.auth.password) {
      parsed.authMechanism = 'MONGODB-X509';
    }
  }

  if (parsed.auth && parsed.db_options) {
    // Handles cannonicalizing all possible values for each
    // `authentication` into the correct one.
    attrs.authentication = AUTH_MECHANISM_TO_AUTHENTICATION[parsed.db_options.authMechanism];

    if (attrs.authentication === 'LDAP') {
      attrs.ldap_username = decodeURIComponent(parsed.auth.user);
      attrs.ldap_password = decodeURIComponent(parsed.auth.password);
    } else if (attrs.authentication === 'X509') {
      attrs.x509_username = decodeURIComponent(parsed.auth.user);
    } else if (attrs.authentication === 'KERBEROS') {
      attrs.kerberos_principal = decodeURIComponent(parsed.auth.user);
      attrs.kerberos_password = decodeURIComponent(parsed.auth.password);
    // attrs.kerberos_service_name = parsed.
    } else {
      attrs.authentication = 'MONGODB';
      attrs.mongodb_username = decodeURIComponent(parsed.auth.user);
      attrs.mongodb_password = decodeURIComponent(parsed.auth.password);
      attrs.mongodb_database_name = decodeURIComponent(parsed.dbName);
    }
  }

  debug('parsed connection attributes', attrs);
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

Connection.AUTHENTICATION_VALUES = AUTHENTICATION_VALUES;
Connection.AUTHENTICATION_DEFAULT = AUTHENTICATION_DEFAULT;
Connection.SSL_VALUES = SSL_VALUES;
Connection.SSL_DEFAULT = SSL_DEFAULT;
Connection.MONGODB_DATABASE_NAME_DEFAULT = MONGODB_DATABASE_NAME_DEFAULT;
Connection.KERBEROS_SERVICE_NAME_DEFAULT = KERBEROS_SERVICE_NAME_DEFAULT;

var ConnectionCollection = AmpersandCollection.extend({
  comparator: 'instance_id',
  model: Connection,
  modelType: 'ConnectionCollection'
});

module.exports = Connection;
module.exports.Collection = ConnectionCollection;
