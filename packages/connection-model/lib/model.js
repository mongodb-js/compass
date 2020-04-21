/* eslint complexity: 0 */

const URL = require('url');
const toURL = URL.format;
const { format } = require('util');
const fs = require('fs');

const { assign, defaults, clone, includes, unescape } = require('lodash');

const AmpersandModel = require('ampersand-model');
const AmpersandCollection = require('ampersand-rest-collection');

const { ReadPreference } = require('mongodb');
const { parseConnectionString } = require('mongodb/lib/core');

const dataTypes = require('./data-types');
const localPortGenerator = require('./local-port-generator');

/**
 * Defining constants
 */
const CONNECTION_TYPE_VALUES = require('../constants/connection-type-values');
const AUTH_MECHANISM_TO_AUTH_STRATEGY = require('../constants/auth-mechanism-to-auth-strategy');
const AUTHENICATION_TO_AUTH_MECHANISM = require('../constants/auth-strategy-to-auth-mechanism');
const AUTH_STRATEGY_VALUES = require('../constants/auth-strategy-values');
const AUTH_STRATEGY_TO_FIELD_NAMES = require('../constants/auth-strategy-to-field-names');
const SSL_METHOD_VALUES = require('../constants/ssl-method-values');
const SSH_TUNNEL_VALUES = require('../constants/ssh-tunnel-values');
const READ_PREFERENCE_VALUES = [
  ReadPreference.PRIMARY,
  ReadPreference.PRIMARY_PREFERRED,
  ReadPreference.SECONDARY,
  ReadPreference.SECONDARY_PREFERRED,
  ReadPreference.NEAREST
];

/**
 * Defining default values
 */
const AUTH_STRATEGY_DEFAULT = 'NONE';
const READ_PREFERENCE_DEFAULT = ReadPreference.PRIMARY;
const MONGODB_DATABASE_NAME_DEFAULT = 'admin';
const KERBEROS_SERVICE_NAME_DEFAULT = 'mongodb';
const SSL_DEFAULT = 'NONE';
const SSH_TUNNEL_DEFAULT = 'NONE';
const DRIVER_OPTIONS_DEFAULT = { connectWithNoPrimary: true };

/**
 * Mappings from the old connection model properties to the new one.
 */
const PASSWORD_MAPPINGS = {
  mongodb_password: 'mongodbPassword',
  kerberos_password: 'kerberosPassword',
  ldap_password: 'ldapPassword',
  ssl_private_key_password: 'sslPass',
  ssh_tunnel_password: 'sshTunnelPassword',
  ssh_tunnel_passphrase: 'sshTunnelPassphrase'
};

const props = {};
const derived = {};
const session = {};

let Connection = {};

/**
 * Assigning observable top-level properties of a state class
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
  ns: { type: 'string', default: undefined },
  isSrvRecord: { type: 'boolean', default: false },
  hostname: { type: 'string', default: 'localhost' },
  port: { type: 'port', default: 27017 },
  hosts: {
    type: 'array',
    default: () => [{ host: 'localhost', port: 27017 }]
  },
  extraOptions: { type: 'object', default: () => ({}) },
  connectionType: {
    type: 'string',
    default: CONNECTION_TYPE_VALUES.NODE_DRIVER
  },
  authStrategy: {
    type: 'string',
    values: AUTH_STRATEGY_VALUES,
    default: AUTH_STRATEGY_DEFAULT
  }
});

assign(session, {
  auth: { type: 'object', default: undefined }
});

/**
 * Connection string options
 */
const CONNECTION_STRING_OPTIONS = {
  replicaSet: { type: 'string', default: undefined },
  connectTimeoutMS: { type: 'number', default: undefined },
  socketTimeoutMS: { type: 'number', default: undefined },
  compression: { type: 'object', default: undefined },
  /**
   * Connection Pool Option
   */
  maxPoolSize: { type: 'number', default: undefined },
  minPoolSize: { type: 'number', default: undefined },
  maxIdleTimeMS: { type: 'number', default: undefined },
  waitQueueMultiple: { type: 'number', default: undefined },
  waitQueueTimeoutMS: { type: 'number', default: undefined },
  /**
   * Write Concern Options
   */
  w: { type: 'any', default: undefined },
  wTimeoutMS: { type: 'number', default: undefined },
  journal: { type: 'boolean', default: undefined },
  /**
   * Read Concern Options
   */
  readConcernLevel: { type: 'string', default: undefined },
  /**
   * Read Preference Options
   */
  readPreference: {
    type: 'string',
    values: READ_PREFERENCE_VALUES,
    default: READ_PREFERENCE_DEFAULT
  },
  maxStalenessSeconds: { type: 'number', default: undefined },
  readPreferenceTags: { type: 'array', default: undefined },
  /**
   * Authentication Options
   */
  authSource: { type: 'string', default: undefined },
  authMechanism: { type: 'string', default: undefined },
  authMechanismProperties: { type: 'object', default: undefined },
  gssapiServiceName: { type: 'string', default: undefined },
  gssapiServiceRealm: { type: 'string', default: undefined },
  gssapiCanonicalizeHostName: { type: 'boolean', default: undefined },
  /**
   * Server Selection and Discovery Options
   */
  localThresholdMS: { type: 'number', default: undefined },
  serverSelectionTimeoutMS: { type: 'number', default: undefined },
  serverSelectionTryOnce: { type: 'boolean', default: undefined },
  heartbeatFrequencyMS: { type: 'number', default: undefined },
  /**
   * Miscellaneous Configuration
   */
  appname: { type: 'string', default: undefined },
  retryWrites: { type: 'boolean', default: undefined },
  uuidRepresentation: {
    type: 'string',
    values: [
      undefined,
      'standard',
      'csharpLegacy',
      'javaLegacy',
      'pythonLegacy'
    ],
    default: undefined
  }
};

assign(props, CONNECTION_STRING_OPTIONS);

/**
 * Stitch attributes
 */
assign(props, {
  stitchServiceName: { type: 'string', default: undefined },
  stitchClientAppId: { type: 'string', default: undefined },
  stitchGroupId: { type: 'string', default: undefined },
  stitchBaseUrl: { type: 'string', default: undefined }
});

/**
 * `authStrategy = MONGODB`
 *
 * @example
 *   const c = new Connection({
 *     mongodbUsername: 'arlo',
 *     mongodbPassword: 'w@of'
 *   });
 *   console.log(c.driverUrl)
 *   >>> mongodb://arlo:w%40of@localhost:27017?slaveOk=true&authSource=admin
 *   console.log(c.driverOptions)
 *   >>> { db: { readPreference: 'nearest' }, replSet: { connectWithNoPrimary: true } }
 */
assign(props, {
  mongodbUsername: { type: 'string', default: undefined },
  mongodbPassword: { type: 'string', default: undefined },
  /**
   * The database name associated with the user's credentials.
   * If `authStrategy === 'MONGODB'`,
   * The value for `authSource` to pass to the driver.
   *
   * @see http://docs.mongodb.org/manual/reference/connection-string/#uri.authSource
   */
  mongodbDatabaseName: { type: 'string', default: undefined },
  /**
   * Whether BSON values should be promoted to their JS type counterparts.
   */
  promoteValues: { type: 'boolean', default: undefined }
});

/**
 * `authStrategy = KERBEROS`
 *
 * @example
 *   const c = new Connection({
 *     kerberosServiceName: 'mongodb',
 *     kerberosPassword: 'w@@f',
 *     kerberosPrincipal: 'arlo/dog@krb5.mongodb.parts',
 *     ns: 'kerberos'
 *   });
 *   console.log(c.driverUrl)
 *   >>> mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/kerberos?slaveOk=true&gssapiServiceName=mongodb&authMechanism=GSSAPI
 *   console.log(c.driverOptions)
 *   >>> { db: { readPreference: 'nearest' }, replSet: { connectWithNoPrimary: true } }
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
   * Formerly kerberosServiceName
   */
  kerberosServiceName: { type: 'string', default: undefined },
  /**
   * The format of a typical Kerberos V5 principal is `primary/instance@REALM`.
   *
   * @example
   *   jennifer/admin@ATHENA.MIT.EDU
   *   jennifer@ATHENA.MIT.EDU
   *
   * @see http://bit.ly/kerberos-principal
   * @note (imlucas): When passed to the driver, this should be
   * `mongodb://#{encodeURIComponent(this.kerberosPrincipal)}`
   */
  kerberosPrincipal: { type: 'string', default: undefined },
  /**
   * You can optionally include a password for a kerberos connection.
   * Including a password is useful on windows if you don’t have a
   * security domain set up.
   * If no password is supplied, it is expected that a valid kerberos
   * ticket has already been created for the principal.
   */
  kerberosPassword: { type: 'string', default: undefined },
  kerberosCanonicalizeHostname: { type: 'boolean', default: false }
});

/**
 * `authStrategy = LDAP`
 *
 * @example
 *    const c = new Connection({
 *     ldapUsername: 'arlo',
 *     ldapPassword: 'w@of',
 *     ns: 'ldap'
 *   });
 *   console.log(c.driverUrl)
 *   >>> mongodb://arlo:w%40of@localhost:27017/ldap?slaveOk=true&authMechanism=PLAIN
 *   console.log(c.driverOptions)
 *   >>> { db: { readPreference: 'nearest' }, replSet: { connectWithNoPrimary: true } }
 *
 * @enterprise
 * @see http://bit.ly/mongodb-node-driver-ldap
 */
assign(props, {
  /**
   * @see http://bit.ly/mongodb-node-driver-ldap
   * @see http://bit.ly/mongodb-ldap
   */
  ldapUsername: { type: 'string', default: undefined },
  /**
   * @see http://bit.ly/mongodb-node-driver-ldap
   * @see http://bit.ly/mongodb-ldap
   */
  ldapPassword: { type: 'string', default: undefined }
});

/**
 * `authStrategy = X509`
 *
 * @todo (imlucas): We've been assuming authenticaiton=X509 that SSL=ALL is implied,
 * but the driver docs only send `sslKey` and `sslCert`
 * so we may need to add another value to `SSL_VALUES`.  Need to verify this and
 * then update the example below.
 *
 * @example
 *   const c = new Connection({
 *    'x509Username': 'CN=client,OU=arlo,O=MongoDB,L=Philadelphia,ST=Pennsylvania,C=US',
 *   });
 *   console.log(c.driverUrl)
 *   >>> mongodb://CN%253Dclient%252COU%253Darlo%252CO%253DMongoDB%252CL%253DPhiladelphia%252CST%253DPennsylvania%252CC%253DUS@localhost:27017?slaveOk=true&authMechanism=MONGODB-X509
 *   console.log(c.driverOptions)
 *   >>> { db: { readPreference: 'nearest' }, replSet: { connectWithNoPrimary: true } }
 *
 * @see http://bit.ly/mongodb-node-driver-x509
 * @see http://bit.ly/mongodb-x509
 */
assign(props, {
  /**
   * The x.509 certificate derived user name, e.g. "CN=user,OU=OrgUnit,O=myOrg,..."
   */
  x509Username: { type: 'string', default: undefined }
});

/**
 * SSL
 */
assign(props, {
  ssl: { type: 'any', default: undefined },
  sslMethod: {
    type: 'string',
    values: SSL_METHOD_VALUES,
    default: SSL_DEFAULT
  },
  /**
   * Array of valid certificates either as Buffers or Strings
   * (needs to have a mongod server with ssl support, 2.4 or higher).
   */
  sslCA: { type: 'any', default: undefined },
  /**
   * String or buffer containing the certificate we wish to present
   * (needs to have a mongod server with ssl support, 2.4 or higher).
   */
  sslCert: { type: 'any', default: undefined },
  /**
   * String or buffer containing the certificate private key we wish to present
   * (needs to have a mongod server with ssl support, 2.4 or higher).
   */
  sslKey: { type: 'any', default: undefined },
  /**
   * String or buffer containing the certificate password
   * (needs to have a mongod server with ssl support, 2.4 or higher).
   */
  sslPass: { type: 'string', default: undefined }
});

/**
 * SSH TUNNEL
 */
assign(props, {
  sshTunnel: {
    type: 'string',
    values: SSH_TUNNEL_VALUES,
    default: SSH_TUNNEL_DEFAULT
  },
  /**
   * The hostname of the SSH remote host.
   */
  sshTunnelHostname: { type: 'string', default: undefined },
  /**
   * The SSH port of the remote host.
   */
  sshTunnelPort: { type: 'port', default: 22 },
  /**
   * Bind the localhost endpoint of the SSH Tunnel to this port.
   */
  sshTunnelBindToLocalPort: { type: 'port', default: undefined },
  /**
   * The optional SSH username for the remote host.
   */
  sshTunnelUsername: { type: 'string', default: undefined },
  /**
   * The optional SSH password for the remote host.
   */
  sshTunnelPassword: { type: 'string', default: undefined },
  /**
   * The optional path to the SSH identity file for the remote host.
   */
  sshTunnelIdentityFile: { type: 'any', default: undefined },
  /**
   * The optional passphrase for `sshTunnelIdentityFile`.
   */
  sshTunnelPassphrase: { type: 'string', default: undefined }
});

/**
 * Assigning derived (computed) properties of a state class
 */
assign(derived, {
  /**
   * @see http://npm.im/mongodb-instance-model
   */
  instanceId: {
    type: 'string',
    deps: ['hostname', 'port'],
    fn() {
      return format('%s:%s', this.hostname, this.port);
    }
  },
  /**
   * Converts the value of `authStrategy` for humans
   * into the `authMechanism` value for the driver.
   */
  driverAuthMechanism: {
    type: 'string',
    deps: ['authStrategy'],
    fn() {
      return AUTHENICATION_TO_AUTH_MECHANISM[this.authStrategy];
    }
  }
});

/**
 * Adds auth info to URL. The connection model builds two URLs.
 * driverUrl - for the driver with the password included.
 * safeUrl - for the UI with stars instead of password.
 *
 * @param {Object} options - Has only isPasswordProtected propery.
 *
 * @returns {String} - URL with auth.
 */
function addAuthToUrl({ isPasswordProtected }) {
  let username = '';
  let password = '';
  let authField = '';
  let result = this.baseUrl;

  // Post url.format() workaround for
  // https://github.com/nodejs/node/issues/1802
  if (
    this.authStrategy === 'MONGODB' ||
    this.authStrategy === 'SCRAM-SHA-256'
  ) {
    username = encodeURIComponent(this.mongodbUsername);
    password = isPasswordProtected ? '*****' : encodeURIComponent(this.mongodbPassword);
    authField = format('%s:%s', username, password);
  } else if (this.authStrategy === 'LDAP') {
    username = encodeURIComponent(this.ldapUsername);
    password = isPasswordProtected ? '*****' : encodeURIComponent(this.ldapPassword);
    authField = format('%s:%s', username, password);
  } else if (this.authStrategy === 'X509') {
    username = encodeURIComponent(this.x509Username);
    authField = username;
  } else if (this.authStrategy === 'KERBEROS' && this.kerberosPassword) {
    username = encodeURIComponent(this.kerberosPrincipal);
    password = isPasswordProtected ? '*****' : encodeURIComponent(this.kerberosPassword);
    authField = format('%s:%s', username, password);
  } else if (this.authStrategy === 'KERBEROS') {
    username = encodeURIComponent(this.kerberosPrincipal);
    authField = format('%s:', username);
  }

  // The auth component comes straight after `the mongodb://`
  // so a single string replace should always work
  result = result.replace('AUTH_TOKEN', authField, 1);

  if (includes(['LDAP', 'KERBEROS', 'X509'], this.authStrategy)) {
    result = `${result}&authSource=$external`;
  }

  if (this.authStrategy === 'KERBEROS' && this.kerberosCanonicalizeHostname) {
    result = `${result}&authMechanismProperties=CANONICALIZE_HOST_NAME:true`;
  }

  return result;
}

/**
 * Driver Connection Options
 *
 * So really everything above is all about putting
 * a human API on top of the two arguments `scout-server`
 * will always blindly pass to the driver when connecting to mongodb:
 * `MongoClient.connect(model.driverUrl, model.driverOptions)`.
 */
assign(derived, {
  /**
   * Get the URL which can be passed to `MongoClient.connect(url)`.
   * @see http://bit.ly/mongoclient-connect
   * @return {String}
   */
  baseUrl: {
    cache: false,
    fn() {
      const req = {
        protocol: 'mongodb',
        port: null,
        slashes: true,
        pathname: '/',
        query: {}
      };

      // In the `mongodb+srv` protocol the comma separated list of host names is
      // replaced with a single hostname.
      // The format is: `mongodb+srv://{hostname}.{domainname}/{options}`
      if (this.isSrvRecord) {
        req.protocol = 'mongodb+srv';
        req.hostname = this.hostname;
      } else if (this.hosts.length === 1) {
        // Driver adds sharding info to the original hostname.
        // And returnes a list of all coresponding hosts.
        // If driver returns a list of hosts which size is equal one,
        // we can use hostname attribute that stores unmodified value.
        req.hostname = this.hostname;
        req.port = this.port;
      } else {
        req.host = this.hosts
          .map(item => `${item.host}:${item.port}`)
          .join(',');
      }

      if (this.ns) {
        req.pathname = format('/%s', this.ns);
      }

      // Encode auth for url format
      if (this.authStrategy === 'MONGODB') {
        req.auth = 'AUTH_TOKEN';
        req.query.authSource =
          this.mongodbDatabaseName || MONGODB_DATABASE_NAME_DEFAULT;
      } else if (this.authStrategy === 'SCRAM-SHA-256') {
        req.auth = 'AUTH_TOKEN';
        req.query.authSource =
          this.mongodbDatabaseName || MONGODB_DATABASE_NAME_DEFAULT;
        req.query.authMechanism = this.driverAuthMechanism;
      } else if (this.authStrategy === 'KERBEROS') {
        req.auth = 'AUTH_TOKEN';
        defaults(req.query, {
          gssapiServiceName: this.kerberosServiceName || KERBEROS_SERVICE_NAME_DEFAULT,
          authMechanism: this.driverAuthMechanism
        });
      } else if (this.authStrategy === 'X509') {
        req.auth = 'AUTH_TOKEN';
        defaults(req.query, { authMechanism: this.driverAuthMechanism });
      } else if (this.authStrategy === 'LDAP') {
        req.auth = 'AUTH_TOKEN';
        defaults(req.query, { authMechanism: this.driverAuthMechanism });
      }

      Object.keys(CONNECTION_STRING_OPTIONS).forEach(item => {
        if (typeof this[item] !== 'undefined' && !req.query[item]) {
          if (item === 'compression') {
            if (this.compression && this.compression.compressors) {
              req.query.compressors = this.compression.compressors.join(',');
            }

            if (this.compression && this.compression.zlibCompressionLevel) {
              req.query.zlibCompressionLevel = this.compression.zlibCompressionLevel;
            }
          } else if (item === 'authMechanismProperties') {
            if (this.authMechanismProperties) {
              req.query.authMechanismProperties = Object.keys(
                this.authMechanismProperties
              )
                .map(tag => `${tag}:${this.authMechanismProperties[tag]}`)
                .join(',');
            }
          } else if (item === 'readPreferenceTags') {
            if (this.readPreferenceTags) {
              req.query.readPreferenceTags = Object.keys(
                this.readPreferenceTags
              )
                .map(tag => `${tag}:${this.readPreferenceTags[tag]}`)
                .join(',');
            }
          } else if (this[item] !== '') {
            req.query[item] = this[item];
          }
        }
      });

      if (this.ssl) {
        req.query.ssl = this.ssl;
      } else if (
        includes(['UNVALIDATED', 'SYSTEMCA', 'SERVER', 'ALL'], this.sslMethod)
      ) {
        req.query.ssl = 'true';
      } else if (this.sslMethod === 'IFAVAILABLE') {
        req.query.ssl = 'prefer';
      } else if (this.sslMethod === 'NONE') {
        req.query.ssl = 'false';
      }

      const reqClone = clone(req);

      return toURL(reqClone);
    }
  },
  safeUrl: {
    cache: false,
    fn() {
      return addAuthToUrl.call(this, { isPasswordProtected: true });
    }
  },
  driverUrl: {
    cache: false,
    fn() {
      return addAuthToUrl.call(this, { isPasswordProtected: false });
    }
  },
  /**
   * Get the options which can be passed to `MongoClient.connect`
   * in addition to the URI.
   * @see http://mongodb.github.io/node-mongodb-native/2.0/api/MongoClient.html#.connect
   * @return {Object}
   */
  driverOptions: {
    cache: false,
    fn() {
      const opts = clone(DRIVER_OPTIONS_DEFAULT, true);

      if (this.sslMethod === 'SERVER') {
        assign(opts, { sslValidate: true, sslCA: this.sslCA });
      } else if (this.sslMethod === 'ALL') {
        assign(opts, {
          sslValidate: true,
          sslCA: this.sslCA,
          sslKey: this.sslKey,
          sslCert: this.sslCert
        });

        if (this.sslPass) {
          opts.sslPass = this.sslPass;
        }

        if (this.authStrategy === 'X509') {
          opts.checkServerIdentity = false;
          opts.sslValidate = false;
        }
      } else if (this.sslMethod === 'UNVALIDATED') {
        assign(opts, { checkServerIdentity: false, sslValidate: false });
      } else if (this.sslMethod === 'SYSTEMCA') {
        assign(opts, { checkServerIdentity: true, sslValidate: true });
      } else if (this.sslMethod === 'IFAVAILABLE') {
        assign(opts, { checkServerIdentity: false, sslValidate: true });
      }

      // assign and overwrite all extra options provided by user
      assign(opts, this.extraOptions);

      // only set promoteValues if it is defined
      if (this.promoteValues !== undefined) {
        opts.promoteValues = this.promoteValues;
      }

      opts.readPreference = this.readPreference;

      return opts;
    }
  },
  /**
   * @return {Object} The options passed to our SSHTunnel and also
   * downwards to http://npm.im/ssh2
   */
  sshTunnelOptions: {
    cache: false,
    fn() {
      if (this.sshTunnel === 'NONE') {
        return {};
      }

      if (!this.sshTunnelBindToLocalPort) {
        this.sshTunnelBindToLocalPort = localPortGenerator();
      }

      const opts = {
        readyTimeout: 20000,
        forwardTimeout: 20000,
        keepaliveInterval: 20000,
        srcAddr: '127.0.0.1', // OS should figure out an ephemeral srcPort
        dstPort: this.port,
        dstAddr: this.hostname,
        localPort: this.sshTunnelBindToLocalPort,
        localAddr: '127.0.0.1',
        host: this.sshTunnelHostname,
        port: this.sshTunnelPort,
        username: this.sshTunnelUsername
      };

      if (this.sshTunnel === 'USER_PASSWORD') {
        opts.password = this.sshTunnelPassword;
      } else if (this.sshTunnel === 'IDENTITY_FILE') {
        /* eslint no-sync: 0 */
        if (this.sshTunnelIdentityFile && this.sshTunnelIdentityFile[0]) {
          // @note: COMPASS-2263: Handle the case where the file no longer exists.
          const fileName = this.sshTunnelIdentityFile[0];

          try {
            opts.privateKey = fs.readFileSync(fileName);
          } catch (e) {
            /* eslint no-console: 0 */
            console.error(
              `Could not locate ssh tunnel identity file: ${fileName}`
            );
          }
        }

        if (this.sshTunnelPassphrase) {
          opts.passphrase = this.sshTunnelPassphrase;
        }
      }

      return opts;
    }
  }
});

/**
 * An ampersand.js model to represent a connection to a MongoDB database.
 * It does not actually talk to MongoDB. It is just a higher-level
 * abstraction that prepares arguments for `MongoClient.connect`.
 */
Connection = AmpersandModel.extend({
  namespace: 'Connection',
  idAttribute: 'instanceId',
  props,
  derived,
  session,
  dataTypes,
  initialize(attrs) {
    if (attrs) {
      if (typeof attrs === 'string') {
        throw new TypeError(
          'To create a connection object from URI please use `Connection.from` function.'
        );
      } else {
        if (attrs.sslCA && !Array.isArray(attrs.sslCA)) {
          this.sslCA = attrs.sslCA = [attrs.sslCA];
        }

        if (attrs.sshTunnel && attrs.sshTunnel !== 'NONE') {
          const port = localPortGenerator();

          attrs.sshTunnelBindToLocalPort = port;
          this.sshTunnelBindToLocalPort = port;
        }

        this.parse(attrs);
      }
    }
  },
  parse(attrs) {
    if (!attrs) {
      return attrs;
    }

    if (attrs.mongodbUsername && attrs.authStrategy !== 'SCRAM-SHA-256') {
      this.authStrategy = attrs.authStrategy = 'MONGODB';
    } else if (attrs.kerberosPrincipal) {
      this.authStrategy = attrs.authStrategy = 'KERBEROS';
    } else if (attrs.ldapUsername) {
      this.authStrategy = attrs.authStrategy = 'LDAP';
    } else if (attrs.x509Username) {
      this.authStrategy = attrs.authStrategy = 'X509';
    }

    if (
      attrs.authStrategy === 'MONGODB' ||
      attrs.authStrategy === 'SCRAM-SHA-256'
    ) {
      if (!attrs.mongodbDatabaseName) {
        attrs.mongodbDatabaseName = MONGODB_DATABASE_NAME_DEFAULT;
      }

      this.mongodbDatabaseName = attrs.mongodbDatabaseName;
    }

    if (attrs.authStrategy === 'KERBEROS') {
      if (!attrs.kerberosServiceName) {
        attrs.kerberosServiceName = KERBEROS_SERVICE_NAME_DEFAULT;
      }

      this.kerberosServiceName = attrs.kerberosServiceName;
    }

    // Map the old password fields to the new ones.
    Object.keys(PASSWORD_MAPPINGS).forEach(oldField => {
      const newField = PASSWORD_MAPPINGS[oldField];
      if (!attrs[newField] && attrs[oldField]) {
        this[newField] = attrs[newField] = attrs[oldField];
      }
    });

    return attrs;
  },
  validate(attrs) {
    try {
      this.validateSsl(attrs);
      this.validateMongodb(attrs);
      this.validateKerberos(attrs);
      this.validateX509(attrs);
      this.validateLdap(attrs);
      this.validateSshTunnel(attrs);
      this.validateStitch(attrs);
    } catch (err) {
      return err;
    }
  },
  /**
   * Enforce constraints for SSL.
   * @param {Object} attrs - Incoming attributes.
   */
  validateSsl(attrs) {
    if (
      !attrs.sslMethod ||
      includes(
        ['NONE', 'UNVALIDATED', 'IFAVAILABLE', 'SYSTEMCA'],
        attrs.sslMethod
      )
    ) {
      return;
    }

    if (attrs.sslMethod === 'SERVER' && !attrs.sslCA) {
      throw new TypeError('sslCA is required when ssl is SERVER.');
    } else if (attrs.sslMethod === 'ALL') {
      if (!attrs.sslCA) {
        throw new TypeError('sslCA is required when ssl is ALL.');
      }

      if (!attrs.sslKey) {
        throw new TypeError('sslKey is required when ssl is ALL.');
      }

      if (!attrs.sslCert) {
        throw new TypeError('sslCert is required when ssl is ALL.');
      }
    }
  },
  validateMongodb(attrs) {
    if (
      attrs.authStrategy === 'MONGODB' ||
      attrs.authStrategy === 'SCRAM-SHA-256'
    ) {
      if (!attrs.mongodbUsername) {
        throw new TypeError(
          'The mongodbUsername field is required when ' +
            'using MONGODB or SCRAM-SHA-256 for authStrategy.'
        );
      }

      if (!attrs.mongodbPassword) {
        throw new TypeError(
          'The mongodbPassword field is required when ' +
            'using MONGODB or SCRAM-SHA-256 for authStrategy.'
        );
      }
    }
  },
  /**
   * Enforce constraints for Kerberos.
   * @param {Object} attrs - Incoming attributes.
   */
  validateKerberos(attrs) {
    if (attrs.authStrategy !== 'KERBEROS') {
      if (attrs.kerberosServiceName) {
        throw new TypeError(
          format(
            'The kerberosServiceName field does not apply when ' +
              'using %s for authStrategy.',
            attrs.authStrategy
          )
        );
      }
      if (attrs.kerberosPrincipal) {
        throw new TypeError(
          format(
            'The kerberosPrincipal field does not apply when ' +
              'using %s for authStrategy.',
            attrs.authStrategy
          )
        );
      }
      if (attrs.kerberosPassword) {
        throw new TypeError(
          format(
            'The kerberosPassword field does not apply when ' +
              'using %s for authStrategy.',
            attrs.authStrategy
          )
        );
      }
    } else if (!attrs.kerberosPrincipal) {
      throw new TypeError(
        'The kerberosPrincipal field is required when using KERBEROS for authStrategy.'
      );
    }
  },
  validateX509(attrs) {
    if (attrs.authStrategy === 'X509') {
      if (!attrs.x509Username) {
        throw new TypeError(
          'The x509Username field is required when using X509 for authStrategy.'
        );
      }
    }
  },
  validateLdap(attrs) {
    if (attrs.authStrategy === 'LDAP') {
      if (!attrs.ldapUsername) {
        throw new TypeError(
          format(
            'The ldapUsername field is required when ' +
              'using LDAP for authStrategy.'
          )
        );
      }
      if (!attrs.ldapPassword) {
        throw new TypeError(
          format(
            'The ldapPassword field is required when ' +
              'using LDAP for authStrategy.'
          )
        );
      }
    }
  },
  validateSshTunnel(attrs) {
    if (!attrs.sshTunnel || attrs.sshTunnel === SSH_TUNNEL_DEFAULT) {
      return;
    }

    if (attrs.sshTunnel === 'USER_PASSWORD') {
      this.validateStandardSshTunnelOptions(attrs);

      if (!attrs.sshTunnelPassword) {
        throw new TypeError(
          'sslTunnelPassword is required when sshTunnel is USER_PASSWORD.'
        );
      }
    } else if (attrs.sshTunnel === 'IDENTITY_FILE') {
      this.validateStandardSshTunnelOptions(attrs);

      if (!attrs.sshTunnelIdentityFile) {
        throw new TypeError(
          'sslTunnelIdentityFile is required when sshTunnel is IDENTITY_FILE.'
        );
      }
    }
  },
  validateStandardSshTunnelOptions(attrs) {
    if (!attrs.sshTunnelUsername) {
      throw new TypeError(
        'sslTunnelUsername is required when sshTunnel is not NONE.'
      );
    }

    if (!attrs.sshTunnelHostname) {
      throw new TypeError(
        'sslTunnelHostname is required when sshTunnel is not NONE.'
      );
    }

    if (!attrs.sshTunnelPort) {
      throw new TypeError(
        'sslTunnelPort is required when sshTunnel is not NONE.'
      );
    }
  },
  validateStitch(attrs) {
    if (attrs.connectionType === CONNECTION_TYPE_VALUES.STITCH_ATLAS) {
      if (!attrs.stitchClientAppId) {
        throw new TypeError(
          'stitchClientAppId is required when connectionType is STITCH_ATLAS.'
        );
      }
    } else if (attrs.connectionType === CONNECTION_TYPE_VALUES.STITCH_ON_PREM) {
      if (!attrs.stitchClientAppId) {
        throw new TypeError(
          'stitchClientAppId is required when connectionType is STITCH_ON_PREM.'
        );
      }

      if (!attrs.stitchBaseUrl) {
        throw new TypeError(
          'stitchBaseUrl is required when connectionType is STITCH_ON_PREM.'
        );
      }

      if (!attrs.stitchGroupId) {
        throw new TypeError(
          'stitchGroupId is required when connectionType is STITCH_ON_PREM.'
        );
      }

      if (!attrs.stitchServiceName) {
        throw new TypeError(
          'stitchServiceName is required when connectionType is STITCH_ON_PREM.'
        );
      }
    } else if (attrs.connectionType === CONNECTION_TYPE_VALUES.NODE_DRIVER) {
      if (attrs.stitchClientAppId) {
        throw new TypeError(
          'stitchClientAppId should not be provided when connectionType is NODE_DRIVER.'
        );
      }

      if (attrs.stitchBaseUrl) {
        throw new TypeError(
          'stitchBaseUrl should not be provided when connectionType is NODE_DRIVER.'
        );
      }

      if (attrs.stitchGroupId) {
        throw new TypeError(
          'stitchGroupId should not be provided when connectionType is NODE_DRIVER.'
        );
      }

      if (attrs.stitchServiceName) {
        throw new TypeError(
          'stitchServiceName should not be provided when connectionType is NODE_DRIVER.'
        );
      }
    }
  }
});

/**
 * For easy command line integration.
 *
 * @example
 *   const args = require('minimist')(process.argv.slice(2));
 *   const Connection = require('mongodb-connection-model');
 *   const createClient = require('scout-client');
 *   args.endpoint = args.endpoint || 'https://localhost:29017';
 *   const client = createClient(args.endpoint, Connection.from(url, () => {}));
 *
 * @param {String} [url]
 * @param {Function} [callback]
 */
Connection.from = (url, callback) => {
  const MONGO = 'mongodb://';
  const MONGO_SRV = 'mongodb+srv://';

  let isSrvRecord = false;

  /* eslint camelcase:0 */
  if (!url) {
    url = 'mongodb://localhost:27017';
  }

  if (url.indexOf(MONGO) === -1 && url.indexOf(MONGO_SRV) === -1) {
    url = `${MONGO}${url}`;
  }

  if (url.indexOf(MONGO_SRV) > -1) {
    isSrvRecord = true;
  }

  const unescapedUrl = unescape(url);

  parseConnectionString(unescapedUrl, (error, parsed) => {
    if (error) {
      return callback(error);
    }

    let attrs = Object.assign(
      {},
      {
        hosts: parsed.hosts,
        hostname: parsed.hosts[0].host,
        port: parsed.hosts[0].port,
        auth: parsed.auth,
        isSrvRecord
      },
      parsed.options
    );

    if (isSrvRecord) {
      // Driver does not return the original hostname.
      // We do extra parsing to get this value.
      // See JIRA ticket: NODE-2048
      // Note: If driver will change the behavior,
      // we should remove extra parsing and update tests.
      // See also: https://github.com/mongodb/specifications/blob/master/source/initial-dns-seedlist-discovery/initial-dns-seedlist-discovery.rst#specification
      const extraParsed = URL.parse(unescapedUrl, true);

      attrs = Object.assign(attrs, {
        hostname: extraParsed.hostname,
        port: parseInt(extraParsed.port, 10)
      });
    }

    // We don't inherit the drivers default values
    // into our model's default values so only set `ns`
    // if it was actually in the URL and not a default.
    if (url.indexOf(parsed.defaultDatabase) > -1) {
      attrs.ns = parsed.defaultDatabase;
    }

    // The `authStrategy` value for humans
    let authStrategy = null;

    if (attrs.authMechanism) {
      authStrategy = attrs.authMechanism;
    } else if (attrs.auth && attrs.auth.username && attrs.auth.password) {
      authStrategy = 'DEFAULT';
    } else if (attrs.auth && attrs.auth.username) {
      authStrategy = 'MONGODB-X509';
    }

    attrs.authStrategy = authStrategy
      ? AUTH_MECHANISM_TO_AUTH_STRATEGY[authStrategy]
      : AUTH_STRATEGY_DEFAULT;

    if (parsed.auth) {
      const user = decodeURIComponent(parsed.auth.username);
      const password = decodeURIComponent(parsed.auth.password);

      if (attrs.authStrategy === 'LDAP') {
        attrs.ldapUsername = user;
        attrs.ldapPassword = password;
      } else if (attrs.authStrategy === 'X509') {
        attrs.x509Username = user;
      } else if (attrs.authStrategy === 'KERBEROS') {
        attrs.kerberosPrincipal = user;
        attrs.kerberosPassword = password;
      } else if (attrs.authStrategy === 'MONGODB') {
        attrs.mongodbUsername = user;
        attrs.mongodbPassword = password;

        // authSource takes precedence, but fall back to admin
        // @note Durran: This is not the documented behaviour of the connection string
        // but the shell also does not fall back to the dbName and will use admin.
        attrs.mongodbDatabaseName = decodeURIComponent(
          attrs.authSource || Connection.MONGODB_DATABASE_NAME_DEFAULT
        );

        Object.assign(
          attrs,
          Connection._improveAtlasDefaults(url, attrs.auth.password, attrs.ns)
        );
      }
    }

    return callback(null, new Connection(attrs));
  });
};

/**
 * Helper function to improve the Atlas user experience by
 * providing better default values.
 *
 * @param {String} url - The connection string URL.
 * @param {String} mongodbPassword - The mongodbPassword
 *   which the user may need to change.
 * @param {String} ns - The namespace to connect to.
 * @returns {Object} Connection attributes to override
 * @private
 */
Connection._improveAtlasDefaults = (url, mongodbPassword, ns) => {
  const atlasConnectionAttrs = {};

  if (Connection.isAtlas(url)) {
    atlasConnectionAttrs.sslMethod = 'SYSTEMCA';

    if (mongodbPassword.match(/^.?PASSWORD.?$/i)) {
      atlasConnectionAttrs.mongodbPassword = '';
    }

    if (!ns || ns.match(/^.?DATABASE.?$/i)) {
      atlasConnectionAttrs.ns = Connection.MONGODB_DATABASE_NAME_DEFAULT;
    }
  }

  return atlasConnectionAttrs;
};

/**
 * For a given `authStrategy` strategy, what are the applicable
 * field names for say a form?
 *
 * @param {String} authStrategy - The desired authentication strategy
 * @return {Array}
 */
Connection.getFieldNames = authStrategy =>
  AUTH_STRATEGY_TO_FIELD_NAMES[authStrategy];

Connection.isAtlas = str => str.match(/mongodb.net[:/]/i);

Connection.isURI = str =>
  str.startsWith('mongodb://') || str.startsWith('mongodb+srv://');

Connection.AUTH_STRATEGY_VALUES = AUTH_STRATEGY_VALUES;
Connection.AUTH_STRATEGY_DEFAULT = AUTH_STRATEGY_DEFAULT;
Connection.SSL_METHOD_VALUES = SSL_METHOD_VALUES;
Connection.SSL_DEFAULT = SSL_DEFAULT;
Connection.SSH_TUNNEL_VALUES = SSH_TUNNEL_VALUES;
Connection.SSH_TUNNEL_DEFAULT = SSH_TUNNEL_DEFAULT;
Connection.MONGODB_DATABASE_NAME_DEFAULT = MONGODB_DATABASE_NAME_DEFAULT;
Connection.KERBEROS_SERVICE_NAME_DEFAULT = KERBEROS_SERVICE_NAME_DEFAULT;
Connection.DRIVER_OPTIONS_DEFAULT = DRIVER_OPTIONS_DEFAULT;
Connection.READ_PREFERENCE_VALUES = READ_PREFERENCE_VALUES;
Connection.READ_PREFERENCE_DEFAULT = READ_PREFERENCE_DEFAULT;
Connection.CONNECTION_TYPE_VALUES = CONNECTION_TYPE_VALUES;

const ConnectionCollection = AmpersandCollection.extend({
  comparator: 'instanceId',
  model: Connection,
  modelType: 'ConnectionCollection'
});

module.exports = Connection;
module.exports.Collection = ConnectionCollection;
