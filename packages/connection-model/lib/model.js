var toURL = require('url').format;
var format = require('util').format;
var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');
var ReadPreference = require('mongodb/lib/read_preference');
var _ = require('lodash');
var parse = require('mongodb-url');
var dataTypes = require('./data-types');
var fs = require('fs');

var Connection = {};
var props = {};
var derived = {};

function localPortGenerator() {
  // Choose a random ephemeral port to serve our (perhaps many) SSH Tunnels.
  // IANA says 29170-29998 is unassigned,
  // but Nintendo used 29900+ according to Wikipedia.
  // https://en.wikipedia.org/wiki/Ephemeral_port
  // https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
  // http://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml?&page=127
  const startPort = 29170;
  const endPort = 29899;
  return parseInt(
    (Math.random() * (endPort - startPort + 1) + startPort).toString(), 10);
}

/**
 * @constant {Object} - Allowed values for the 'connectionType' field
 */
var CONNECTION_TYPE_VALUES = {
  NODE_DRIVER: 'NODE_DRIVER',
  STITCH_ON_PREM: 'STITCH_ON_PREM',
  STITCH_ATLAS: 'STITCH_ATLAS'
};

/**
 * # Top-Level
 */
_.assign(props, {
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
  connectionType: {
    type: 'string',
    default: CONNECTION_TYPE_VALUES.NODE_DRIVER
  },
  stitchServiceName: {
    type: 'string'
  },
  stitchClientAppId: {
    type: 'string'
  },
  stitchGroupId: {
    type: 'string'
  },
  stitchBaseUrl: {
    type: 'string'
  },
  port: {
    type: 'port',
    default: 27017
  },
  ns: {
    type: 'string',
    default: undefined
  },
  app_name: {
    type: 'string',
    default: undefined
  },
  extra_options: {
    type: 'object',
    default: function() {
      return {};
    }
  },
  replica_set_name: {
    type: 'string',
    default: undefined
  },
  isSrvRecord: {
    type: 'boolean',
    default: false
  }
});

_.assign(derived, {
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
 * The read preference values.
 */
var READ_PREFERENCE_VALUES = [
  ReadPreference.PRIMARY,
  ReadPreference.PRIMARY_PREFERRED,
  ReadPreference.SECONDARY,
  ReadPreference.SECONDARY_PREFERRED,
  ReadPreference.NEAREST
];

/**
 * The default read preference.
 */
var READ_PREFERENCE_DEFAULT = ReadPreference.PRIMARY;

_.assign(props, {
  /**
   * @property {String} authentication - `auth_mechanism` for humans.
   */
  read_preference: {
    type: 'string',
    values: READ_PREFERENCE_VALUES,
    default: READ_PREFERENCE_DEFAULT
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

_.assign(props, {
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

_.assign(derived, {
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
  SSPI: 'KERBEROS',
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
 *   >>> { db: { readPreference: 'nearest' },
 *     replSet: { connectWithNoPrimary: true } }
 */
_.assign(props, {
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
  },
  /**
   * Whether BSON values should be promoted to their JS type counterparts.
   */
  promote_values: {
    type: 'boolean'
  }
});

var MONGODB_DATABASE_NAME_DEFAULT = 'admin';
var MONGODB_NAMESPACE_DEFAULT = 'test';

/**
 * ### `authentication = KERBEROS`
 *
 * @example
 *   var c = new Connection({
 *     kerberos_service_name: 'mongodb',
 *     kerberos_password: 'w@@f',
 *     kerberos_principal: 'arlo/dog@krb5.mongodb.parts',
 *     ns: 'kerberos'
 *   });
 *   console.log(c.driver_url)
 *   >>> mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/kerberos?slaveOk=true&gssapiServiceName=mongodb&authMechanism=GSSAPI
 *   console.log(c.driver_options)
 *   >>> { db: { readPreference: 'nearest' },
 *     replSet: { connectWithNoPrimary: true } }
 *
 * @enterprise
 * @see http://bit.ly/mongodb-node-driver-kerberos
 */
_.assign(props, {
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
 *     ldap_password: 'w@of',
 *     ns: 'ldap'
 *   });
 *   console.log(c.driver_url)
 *   >>> mongodb://arlo:w%40of@localhost:27017/ldap?slaveOk=true&authMechanism=PLAIN
 *   console.log(c.driver_options)
 *   >>> { db: { readPreference: 'nearest' },
 *     replSet: { connectWithNoPrimary: true } }
 *
 * @enterprise
 * @see http://bit.ly/mongodb-node-driver-ldap
 */
_.assign(props, {
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
 *   >>> { db: { readPreference: 'nearest' },
 *    replSet: { connectWithNoPrimary: true } }
 *
 * @see http://bit.ly/mongodb-node-driver-x509
 * @see http://bit.ly/mongodb-x509
 */
_.assign(props, {
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
   * Use system CA.
   */
  'SYSTEMCA',
  /**
   * Use SSL if available.
   */
  'IFAVAILABLE',
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

_.assign(props, {
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
    type: 'any',
    default: undefined
  },

  /**
   * String or buffer containing the certificate we wish to present
   * (needs to have a mongod server with ssl support, 2.4 or higher).
   */
  ssl_certificate: {
    type: 'any',
    default: undefined
  },
  /**
   * String or buffer containing the certificate private key we wish to present
   * (needs to have a mongod server with ssl support, 2.4 or higher).
   */
  ssl_private_key: {
    type: 'any',
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
 * @constant {Array} - Allowed values for the `ssh_tunnel` field.
 */
var SSH_TUNNEL_VALUES = [
  /**
   * Do not use SSH tunneling.
   */
  'NONE',
  /**
   * The tunnel is created with username and password only.
   */
  'USER_PASSWORD',
  /**
   * The tunnel is created using an identity file.
   */
  'IDENTITY_FILE'
];

/**
 * @constant {String} - The default value for `ssh_tunnel`.
 */
var SSH_TUNNEL_DEFAULT = 'NONE';

_.assign(props, {
  ssh_tunnel: {
    type: 'string',
    values: SSH_TUNNEL_VALUES,
    default: SSH_TUNNEL_DEFAULT
  },
  /**
   * The hostname of the SSH remote host.
   */
  ssh_tunnel_hostname: {
    type: 'string',
    default: undefined
  },
  /**
   * The SSH port of the remote host.
   */
  ssh_tunnel_port: {
    type: 'port',
    default: 22
  },
  /**
   * Bind the localhost endpoint of the SSH Tunnel to this port.
   */
  ssh_tunnel_bind_to_local_port: {
    type: 'port',
    default: undefined
  },
  /**
   * The optional SSH username for the remote host.
   */
  ssh_tunnel_username: {
    type: 'string',
    default: undefined
  },
  /**
   * The optional SSH password for the remote host.
   */
  ssh_tunnel_password: {
    type: 'string',
    default: undefined
  },
  /**
   * The optional path to the SSH identity file for the remote host.
   */
  ssh_tunnel_identity_file: {
    type: 'any',
    default: undefined
  },
  /**
   * The optional passphrase for `ssh_tunnel_identity_file`.
   */
  ssh_tunnel_passphrase: {
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
var DRIVER_OPTIONS_DEFAULT = {
  db: {},
  replSet: {
    connectWithNoPrimary: true
  }
};

_.assign(derived, {
  /**
   * Get the URL which can be passed to `MongoClient.connect(url)`.
   * @see http://bit.ly/mongoclient-connect
   * @return {String}
   */
  driver_url: {
    cache: false,
    /* eslint complexity: 0 */
    fn: function() {
      const AUTH_TOKEN = 'AUTH_TOKEN';
      var req = {
        protocol: this.isSrvRecord ? 'mongodb+srv' : 'mongodb',
        slashes: true,
        hostname: this.hostname,
        port: this.port,
        pathname: '/',
        query: {}
      };

      if (this.replica_set_name) {
        req.query.replicaSet = this.replica_set_name;
      }

      req.query.readPreference = this.read_preference;

      if (this.app_name) {
        req.query.appname = this.app_name;
      }

      if (this.ns) {
        req.pathname = format('/%s', this.ns);
      }

      const encodeAuthForUrlFormat = () => {
        if (this.authentication === 'MONGODB') {
          req.auth = AUTH_TOKEN;
          req.query.authSource = this.mongodb_database_name;
        } else if (this.authentication === 'KERBEROS') {
          _.defaults(req.query, {
            gssapiServiceName: this.kerberos_service_name,
            authMechanism: this.driver_auth_mechanism
          });
          req.auth = AUTH_TOKEN;
        } else if (this.authentication === 'X509') {
          req.auth = this.x509_username;
          _.defaults(req.query, {
            authMechanism: this.driver_auth_mechanism
          });
        } else if (this.authentication === 'LDAP') {
          req.auth = AUTH_TOKEN;

          _.defaults(req.query, {
            authMechanism: this.driver_auth_mechanism
          });
        }
      };
      encodeAuthForUrlFormat();

      if (_.includes(['UNVALIDATED', 'SYSTEMCA', 'SERVER', 'ALL'], this.ssl)) {
        req.query.ssl = 'true';
      } else if (this.ssl === 'IFAVAILABLE') {
        req.query.ssl = 'prefer';
      }
      var reqClone = _.clone(req);
      if (this.ssh_tunnel !== 'NONE') {
        // Populate the SSH Tunnel options correctly
        reqClone.hostname = this.ssh_tunnel_options.localAddr;
        reqClone.port = this.ssh_tunnel_options.localPort;
      }
      var result = toURL(reqClone);

      // Post url.format() workaround for
      // https://github.com/nodejs/node/issues/1802
      if (this.authentication === 'MONGODB') {
        const authField = format(
          '%s:%s',
          encodeURIComponent(this.mongodb_username),
          encodeURIComponent(this.mongodb_password)
        );

        // The auth component comes straight after the mongodb:// so
        // a single string replace should always work
        result = result.replace(AUTH_TOKEN, authField, 1);
      }
      if (this.authentication === 'LDAP') {
        const authField = format(
          '%s:%s',
          encodeURIComponent(this.ldap_username),
          encodeURIComponent(this.ldap_password)
        );
        result = result.replace(AUTH_TOKEN, authField, 1);
      }
      if (this.authentication === 'KERBEROS') {
        if (this.kerberos_password) {
          const authField = format(
            '%s:%s',
            encodeURIComponent(this.kerberos_principal),
            encodeURIComponent(this.kerberos_password)
          );
          result = result.replace(AUTH_TOKEN, authField, 1);
        } else {
          const authField = format(
            '%s:',
            encodeURIComponent(this.kerberos_principal)
          );
          result = result.replace(AUTH_TOKEN, authField, 1);
        }
      }
      return result;
    }
  },
  /**
   * Get the options which can be passed to `MongoClient.connect`
   * in addition to the URI.
   * @see http://mongodb.github.io/node-mongodb-native/2.0/api/MongoClient.html#.connect
   * @return {Object}
   */
  driver_options: {
    cache: false,
    fn: function() {
      var opts = _.clone(DRIVER_OPTIONS_DEFAULT, true);
      if (this.ssl === 'SERVER') {
        _.assign(opts, {
          server: {
            sslValidate: true,
            sslCA: this.ssl_ca
          }
        });
      } else if (this.ssl === 'ALL') {
        _.assign(opts, {
          server: {
            sslValidate: true,
            sslCA: this.ssl_ca,
            sslKey: this.ssl_private_key,
            sslCert: this.ssl_certificate
          }
        });

        if (this.ssl_private_key_password) {
          opts.server.sslPass = this.ssl_private_key_password;
        }

        if (this.authentication === 'X509') {
          opts.server.checkServerIdentity = false;
          opts.server.sslValidate = false;
        }
      } else if (this.ssl === 'UNVALIDATED') {
        _.assign(opts, {
          server: {
            checkServerIdentity: false,
            sslValidate: false
          }
        });
      } else if (this.ssl === 'SYSTEMCA') {
        _.assign(opts, {
          server: {
            checkServerIdentity: true,
            sslValidate: true
          }
        });
      } else if (this.ssl === 'IFAVAILABLE') {
        _.assign(opts, {
          server: {
            checkServerIdentity: false,
            sslValidate: true
          }
        });
      }

      // assign and overwrite all extra options provided by user
      _.assign(opts, this.extra_options);

      // only set promoteValues if it is defined
      if (this.promote_values !== undefined) {
        opts.db.promoteValues = this.promote_values;
      }

      opts.db.readPreference = this.read_preference;

      return opts;
    }
  },
  /**
   * @return {Object} The options passed to our SSHTunnel and also
   * downwards to http://npm.im/ssh2
   */
  ssh_tunnel_options: {
    cache: false,
    fn: function() {
      if (this.ssh_tunnel === 'NONE') {
        return {};
      }
      if (!this.ssh_tunnel_bind_to_local_port) {
        this.ssh_tunnel_bind_to_local_port = localPortGenerator();
      }
      var opts = {
        readyTimeout: 5000,
        forwardTimeout: 5000,
        keepaliveInterval: 5000,
        srcAddr: '127.0.0.1',  // OS should figure out an ephemeral srcPort
        dstPort: this.port,
        dstAddr: this.hostname,
        localPort: this.ssh_tunnel_bind_to_local_port,
        localAddr: '127.0.0.1',
        host: this.ssh_tunnel_hostname,
        port: this.ssh_tunnel_port,
        username: this.ssh_tunnel_username
      };

      if (this.ssh_tunnel === 'USER_PASSWORD') {
        opts.password = this.ssh_tunnel_password;
      } else if (this.ssh_tunnel === 'IDENTITY_FILE') {
        /* eslint no-sync: 0 */
        if (this.ssh_tunnel_identity_file && this.ssh_tunnel_identity_file[0]) {
          // @note: COMPASS-2263: Handle the case where the file no longer exists.
          const fileName = this.ssh_tunnel_identity_file[0];
          try {
            opts.privateKey = fs.readFileSync(fileName);
          } catch (e) {
            /* eslint no-console: 0 */
            console.error(`Could not locate ssh tunnel identity file: ${fileName}`);
          }
        }
        if (this.ssh_tunnel_passphrase) {
          opts.passphrase = this.ssh_tunnel_passphrase;
        }
      }
      return opts;
    }
  }
});

/**
 * An ampersand.js model to represent a connection to a MongoDB database.
 * It does not actually talk to MongoDB.  It is just a higher-level
 * abstraction that prepares arguments for `MongoClient.connect`.
 */
Connection = AmpersandModel.extend({
  namespace: 'Connection',
  idAttribute: 'instance_id',
  props: props,
  derived: derived,
  dataTypes: dataTypes,
  initialize: function(attrs) {
    if (attrs) {
      if (typeof attrs === 'string') {
        try {
          attrs = Connection.from(attrs);
        } catch (e) {
          this.validationError = e;
          return;
        }
      }

      if (attrs.ssl_ca && !Array.isArray(attrs.ssl_ca)) {
        this.ssl_ca = attrs.ssl_ca = [attrs.ssl_ca];
      }
      if (attrs.ssh_tunnel && attrs.ssh_tunnel !== 'NONE' &&
          !attrs.ssh_tunnel_bind_to_local_port) {
        const port = localPortGenerator();
        attrs.ssh_tunnel_bind_to_local_port = port;
        this.ssh_tunnel_bind_to_local_port = port;
      }
      this.parse(attrs);
    }
  },
  parse: function(attrs) {
    if (!attrs) {
      return attrs;
    }
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
    return attrs;
  },

  validate: function(attrs) {
    try {
      this.validate_ssl(attrs);
      this.validate_mongodb(attrs);
      this.validate_kerberos(attrs);
      this.validate_x509(attrs);
      this.validate_ldap(attrs);
      this.validate_ssh_tunnel(attrs);
      this.validate_stitch(attrs);
    } catch (err) {
      return err;
    }
  },
  /**
   * Enforce constraints for SSL.
   * @param {Object} attrs - Incoming attributes.
   */
  validate_ssl: function(attrs) {
    if (!attrs.ssl || _.includes(['NONE', 'UNVALIDATED', 'IFAVAILABLE', 'SYSTEMCA'], attrs.ssl)) {
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
  },
  validate_ssh_tunnel: function(attrs) {
    if (!attrs.ssh_tunnel || attrs.ssh_tunnel === SSH_TUNNEL_DEFAULT) {
      return;
    }
    if (attrs.ssh_tunnel === 'USER_PASSWORD') {
      this.validate_standard_ssh_tunnel_options(attrs);
      if (!attrs.ssh_tunnel_password) {
        throw new TypeError('ssl_tunnel_password is required when ssh_tunnel is USER_PASSWORD.');
      }
    } else if (attrs.ssh_tunnel === 'IDENTITY_FILE') {
      this.validate_standard_ssh_tunnel_options(attrs);
      if (!attrs.ssh_tunnel_identity_file) {
        throw new TypeError('ssl_tunnel_identity_file is required when ssh_tunnel is IDENTITY_FILE.');
      }
    }
  },
  validate_standard_ssh_tunnel_options: function(attrs) {
    if (!attrs.ssh_tunnel_username) {
      throw new TypeError('ssl_tunnel_username is required when ssh_tunnel is not NONE.');
    }
    if (!attrs.ssh_tunnel_hostname) {
      throw new TypeError('ssl_tunnel_hostname is required when ssh_tunnel is not NONE.');
    }
    if (!attrs.ssh_tunnel_port) {
      throw new TypeError('ssl_tunnel_port is required when ssh_tunnel is not NONE.');
    }
  },
  validate_stitch: function(attrs) {
    if (attrs.connectionType === CONNECTION_TYPE_VALUES.STITCH_ATLAS) {
      if (!attrs.stitchClientAppId) {
        throw new TypeError('stitchClientAppId is required when connectionType is STITCH_ATLAS.');
      }
    } else if (attrs.connectionType === CONNECTION_TYPE_VALUES.STITCH_ON_PREM) {
      if (!attrs.stitchClientAppId) {
        throw new TypeError('stitchClientAppId is required when connectionType is STITCH_ON_PREM.');
      }
      if (!attrs.stitchBaseUrl) {
        throw new TypeError('stitchBaseUrl is required when connectionType is STITCH_ON_PREM.');
      }
      if (!attrs.stitchGroupId) {
        throw new TypeError('stitchGroupId is required when connectionType is STITCH_ON_PREM.');
      }
      if (!attrs.stitchServiceName) {
        throw new TypeError('stitchServiceName is required when connectionType is STITCH_ON_PREM.');
      }
    } else if (attrs.connectionType === CONNECTION_TYPE_VALUES.NODE_DRIVER) {
      if (attrs.stitchClientAppId) {
        throw new TypeError('stitchClientAppId should not be provided when connectionType is NODE_DRIVER.');
      }
      if (attrs.stitchBaseUrl) {
        throw new TypeError('stitchBaseUrl should not be provided when connectionType is NODE_DRIVER.');
      }
      if (attrs.stitchGroupId) {
        throw new TypeError('stitchGroupId should not be provided when connectionType is NODE_DRIVER.');
      }
      if (attrs.stitchServiceName) {
        throw new TypeError('stitchServiceName should not be provided when connectionType is NODE_DRIVER.');
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
  var attrs = {
    hostname: parsed.servers[0].host,
    port: parsed.servers[0].port
  };

  attrs.isSrvRecord = parsed.isSrvRecord;

  // Don't want to inherit the drivers default values
  // into our model's default values so only set `ns`
  // if it was actually in the URL and not a default.
  if (url.indexOf(parsed.dbName) > -1) {
    attrs.ns = parsed.dbName;
  }

  if (parsed.auth && parsed.auth.user) {
    /**
     * @todo (imlucas): This case is ambiguous... support `mongodb+ldap://user:pass@host`.
     */
    if (parsed.auth.password) {
      parsed.authMechanism = 'DEFAULT';
    } else {
      parsed.authMechanism = 'MONGODB-X509';
    }
  }

  if (parsed.rs_options) {
    if (parsed.rs_options.rs_name) {
      attrs.replica_set_name = parsed.rs_options.rs_name;
    }
  }

  if (parsed.auth && parsed.db_options) {
    // Handles cannonicalizing all possible values for each
    // `authentication` into the correct one.
    attrs.authentication = AUTH_MECHANISM_TO_AUTHENTICATION[parsed.db_options.authMechanism];

    if (parsed.db_options.read_preference) {
      attrs.read_preference = parsed.db_options.read_preference;
    }

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
      // authSource takes precedence, but fall back to dbName
      // @see https://docs.mongodb.org/v3.0/reference/connection-string/#uri.authSource
      attrs.mongodb_database_name = decodeURIComponent(
        parsed.db_options.authSource || parsed.dbName);
    }
    Object.assign(attrs, Connection._improveAtlasDefaults(url, attrs.mongodb_password, attrs.ns));
  }

  return new Connection(attrs);
};

/**
 * Helper function to improve the Atlas user experience by
 * providing better default values.
 *
 * @param {String} url - The connection string URL.
 * @param {String} mongodb_password - The mongodb_password
 *   which the user may need to change.
 * @param {String} namespace - The namespace (ns) to connect to.
 * @returns {Object} Connection attributes to override
 * @private
 */
Connection._improveAtlasDefaults = function(url, mongodb_password, namespace) {
  var atlasConnectionAttrs = {};
  if (Connection.isAtlas(url)) {
    atlasConnectionAttrs.ssl = 'SYSTEMCA';
    if (mongodb_password.match(/^.?PASSWORD.?$/i)) {
      atlasConnectionAttrs.mongodb_password = '';
    }
    if (!namespace || namespace.match(/^.?DATABASE.?$/i)) {
      atlasConnectionAttrs.ns = Connection.MONGODB_NAMESPACE_DEFAULT;
    }
  }
  return atlasConnectionAttrs;
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

Connection.isAtlas = function(str) {
  return str.match(/mongodb.net[:/]/i);
};

Connection.isURI = function(str) {
  return str.indexOf('mongodb://') > -1;
};

Connection.AUTHENTICATION_VALUES = AUTHENTICATION_VALUES;
Connection.AUTHENTICATION_DEFAULT = AUTHENTICATION_DEFAULT;
Connection.SSL_VALUES = SSL_VALUES;
Connection.SSL_DEFAULT = SSL_DEFAULT;
Connection.SSH_TUNNEL_VALUES = SSH_TUNNEL_VALUES;
Connection.SSH_TUNNEL_DEFAULT = SSH_TUNNEL_DEFAULT;
Connection.MONGODB_NAMESPACE_DEFAULT = MONGODB_NAMESPACE_DEFAULT;
Connection.MONGODB_DATABASE_NAME_DEFAULT = MONGODB_DATABASE_NAME_DEFAULT;
Connection.KERBEROS_SERVICE_NAME_DEFAULT = KERBEROS_SERVICE_NAME_DEFAULT;
Connection.DRIVER_OPTIONS_DEFAULT = DRIVER_OPTIONS_DEFAULT;
Connection.READ_PREFERENCE_VALUES = READ_PREFERENCE_VALUES;
Connection.READ_PREFERENCE_DEFAULT = READ_PREFERENCE_DEFAULT;
Connection.CONNECTION_TYPE_VALUES = CONNECTION_TYPE_VALUES;

var ConnectionCollection = AmpersandCollection.extend({
  comparator: 'instance_id',
  model: Connection,
  modelType: 'ConnectionCollection'
});

module.exports = Connection;
module.exports.Collection = ConnectionCollection;
