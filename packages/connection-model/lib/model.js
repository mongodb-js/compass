const toURL = require('url').format;
const format = require('util').format;
const AmpersandModel = require('ampersand-model');
const AmpersandCollection = require('ampersand-rest-collection');
const ReadPreference = require('mongodb-core').ReadPreference;
const parseConnectionString = require('mongodb-core').parseConnectionString;
const assign = require('lodash.assign');
const defaults = require('lodash.defaults');
const clone = require('lodash.clone');
const includes = require('lodash.includes');
const unescape = require('lodash.unescape');
const dataTypes = require('./data-types');
const localPortGenerator = require('./local-port-generator');
const fs = require('fs');

/**
 * Defining constants
 */
const CONNECTION_TYPE_VALUES = require('../constants/connection-type-values');
const AUTH_MECHANISM_TO_AUTHENTICATION = require('../constants/auth-mechanism-to-authentication');
const AUTHENICATION_TO_AUTH_MECHANISM = require('../constants/authenication-to-auth-mechanism');
const AUTHENTICATION_VALUES = require('../constants/authentication-values');
const AUTHENTICATION_TO_FIELD_NAMES = require('../constants/authentication-to-field-names');
const SSL_VALUES = require('../constants/ssl-values');
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
const AUTHENTICATION_DEFAULT = 'NONE';
const READ_PREFERENCE_DEFAULT = ReadPreference.PRIMARY;
const MONGODB_DATABASE_NAME_DEFAULT = 'admin';
const MONGODB_NAMESPACE_DEFAULT = 'test';
const KERBEROS_SERVICE_NAME_DEFAULT = 'mongodb';
const SSL_DEFAULT = 'NONE';
const SSH_TUNNEL_DEFAULT = 'NONE';
const DRIVER_OPTIONS_DEFAULT = { connectWithNoPrimary: true };

const props = {};
const derived = {};

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
  name: { type: 'string', default: 'Local' },
  ns: { type: 'string', default: undefined },
  isSrvRecord: { type: 'boolean', default: false },
  auth: { type: 'object', default: undefined },
  hostname: { type: 'string', default: 'localhost' },
  port: { type: 'port', default: 27017 },
  hosts: {
    type: 'object',
    default: () => [{ host: 'localhost', port: 27017 }]
  },
  extraOptions: { type: 'object', default: () => ({}) },
  connectionType: { type: 'string', default: CONNECTION_TYPE_VALUES.NODE_DRIVER },
  authentication: {
    type: 'string',
    values: AUTHENTICATION_VALUES,
    default: AUTHENTICATION_DEFAULT
  }
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
  readPreferenceTags: { type: 'object', default: undefined },
  /**
   * Read Preference Options
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
    values: ['standard', 'csharpLegacy', 'javaLegacy', 'pythonLegacy'],
    default: undefined
  }
};

assign(props, CONNECTION_STRING_OPTIONS);

/**
 * Stitch attributes
 */
assign(props, {
  stitchServiceName: { type: 'string' },
  stitchClientAppId: { type: 'string' },
  stitchGroupId: { type: 'string' },
  stitchBaseUrl: { type: 'string' }
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
   * Converts the value of `authentication` (for humans)
   * into the `authMechanism` value for the driver.
   */
  driverAuthMechanism: {
    type: 'string',
    deps: ['authentication'],
    fn() {
      return AUTHENICATION_TO_AUTH_MECHANISM[this.authentication];
    }
  }
});

/**
 * `authentication = MONGODB`
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
   * If `authentication === 'MONGODB'`,
   * The value for `authSource` to pass to the driver.
   *
   * @see http://docs.mongodb.org/manual/reference/connection-string/#uri.authSource
   */
  mongodbDatabaseName: { type: 'string', default: undefined },
  /**
   * Whether BSON values should be promoted to their JS type counterparts.
   */
  promoteValues: { type: 'boolean' }
});

/**
 * `authentication = KERBEROS`
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
 * `authentication = LDAP`
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
 * `authentication = X509`
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
  sslType: { type: 'string', values: SSL_VALUES, default: SSL_DEFAULT },
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
  driverUrl: {
    cache: false,
    /* eslint complexity: 0 */
    fn() {
      const AUTH_TOKEN = 'AUTH_TOKEN';
      const req = {
        protocol: this.isSrvRecord ? 'mongodb+srv' : 'mongodb',
        slashes: true,
        pathname: '/',
        query: {}
      };

      if (this.hosts.length === 1) {
        req.hostname = this.hostname;
        req.port = this.isSrvRecord ? null : this.port;
      } else {
        req.host = this.hosts.map((item) => `${item.host}:${item.port}`).join(',');
      }

      if (this.ns) {
        req.pathname = format('/%s', this.ns);
      }

      // Encode auth for url format
      if (this.authentication === 'MONGODB') {
        req.auth = AUTH_TOKEN;
        req.query.authSource = this.mongodbDatabaseName || MONGODB_DATABASE_NAME_DEFAULT;
      } else if (this.authentication === 'SCRAM-SHA-256') {
        req.auth = AUTH_TOKEN;
        req.query.authSource = this.mongodbDatabaseName || MONGODB_DATABASE_NAME_DEFAULT;
        req.query.authMechanism = this.driverAuthMechanism;
      } else if (this.authentication === 'KERBEROS') {
        req.auth = AUTH_TOKEN;
        defaults(req.query, {
          gssapiServiceName: this.kerberosServiceName,
          authMechanism: this.driverAuthMechanism
        });
      } else if (this.authentication === 'X509') {
        req.auth = this.x509Username;
        defaults(req.query, { authMechanism: this.driverAuthMechanism });
      } else if (this.authentication === 'LDAP') {
        req.auth = AUTH_TOKEN;
        defaults(req.query, { authMechanism: this.driverAuthMechanism });
      }

      Object.keys(CONNECTION_STRING_OPTIONS).forEach((item) => {
        if (typeof this[item] !== 'undefined' && !req.query[item]) {
          if (item === 'compression') {
            if (this.compression.compressors) {
              req.query.compressors = this.compression.compressors.join(',');
            }

            if (this.compression.zlibCompressionLevel) {
              req.query.zlibCompressionLevel = this.compression.zlibCompressionLevel;
            }
          } else if (item === 'authMechanismProperties') {
            if (this.authMechanismProperties) {
              req.query.authMechanismProperties = Object
                .keys(this.authMechanismProperties)
                .map((tag) => `${tag}:${this.authMechanismProperties[tag]}`)
                .join(',');
            }
          } else if (item === 'readPreferenceTags') {
            if (this.readPreferenceTags) {
              req.query.readPreferenceTags = Object
                .keys(this.readPreferenceTags)
                .map((tag) => `${tag}:${this.readPreferenceTags[tag]}`)
                .join(',');
            }
          } else {
            req.query[item] = this[item];
          }
        }
      });

      if (this.ssl) {
        req.query.ssl = this.ssl;
      } else if (includes(['UNVALIDATED', 'SYSTEMCA', 'SERVER', 'ALL'], this.sslType)) {
        req.query.ssl = 'true';
      } else if (this.sslType === 'IFAVAILABLE') {
        req.query.ssl = 'prefer';
      } else if (this.sslType === 'NONE') {
        req.query.ssl = 'false';
      }

      const reqClone = clone(req);

      if (this.sshTunnel !== 'NONE') {
        // Populate the SSH Tunnel options correctly
        reqClone.hostname = this.sshTunnelOptions.localAddr;
        reqClone.port = this.sshTunnelOptions.localPort;
      }

      let result = toURL(reqClone);

      // Post url.format() workaround for
      // https://github.com/nodejs/node/issues/1802
      if (this.authentication === 'MONGODB' || this.authentication === 'SCRAM-SHA-256') {
        const authField = format(
          '%s:%s',
          encodeURIComponent(this.mongodbUsername),
          encodeURIComponent(this.mongodbPassword)
        );

        // The auth component comes straight after the mongodb:// so
        // a single string replace should always work
        result = result.replace(AUTH_TOKEN, authField, 1);
      }

      if (this.authentication === 'LDAP') {
        const authField = format(
          '%s:%s',
          encodeURIComponent(this.ldapUsername),
          encodeURIComponent(this.ldapPassword)
        );
        result = result.replace(AUTH_TOKEN, authField, 1);
        result = `${result}&authSource=$external`;
      }

      if (this.authentication === 'KERBEROS') {
        if (this.kerberosPassword) {
          const authField = format(
            '%s:%s',
            encodeURIComponent(this.kerberosPrincipal),
            encodeURIComponent(this.kerberosPassword)
          );
          result = result.replace(AUTH_TOKEN, authField, 1);
        } else {
          const authField = format(
            '%s:',
            encodeURIComponent(this.kerberosPrincipal)
          );

          result = result.replace(AUTH_TOKEN, authField, 1);
        }

        result = `${result}&authSource=$external`;

        if (this.kerberosCanonicalizeHostname) {
          result = `${result}&authMechanismProperties=CANONICALIZE_HOST_NAME:true`;
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
  driverOptions: {
    cache: false,
    fn() {
      const opts = clone(DRIVER_OPTIONS_DEFAULT, true);

      if (this.sslType === 'SERVER') {
        assign(opts, { sslValidate: true, sslCA: this.sslCA });
      } else if (this.sslType === 'ALL') {
        assign(opts, {
          sslValidate: true,
          sslCA: this.sslCA,
          sslKey: this.sslKey,
          sslCert: this.sslCert
        });

        if (this.sslPass) {
          opts.sslPass = this.sslPass;
        }

        if (this.authentication === 'X509') {
          opts.checkServerIdentity = false;
          opts.sslValidate = false;
        }
      } else if (this.sslType === 'UNVALIDATED') {
        assign(opts, { checkServerIdentity: false, sslValidate: false });
      } else if (this.sslType === 'SYSTEMCA') {
        assign(opts, { checkServerIdentity: true, sslValidate: true });
      } else if (this.sslType === 'IFAVAILABLE') {
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
        readyTimeout: 5000,
        forwardTimeout: 5000,
        keepaliveInterval: 5000,
        srcAddr: '127.0.0.1',  // OS should figure out an ephemeral srcPort
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
            console.error(`Could not locate ssh tunnel identity file: ${fileName}`);
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
  dataTypes,
  initialize(attrs) {
    if (attrs) {
      if (typeof attrs === 'string') {
        try {
          attrs = Connection.from(attrs);
        } catch (e) {
          this.validationError = e;

          return;
        }
      }

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
  },
  parse(attrs) {
    if (!attrs) {
      return attrs;
    }

    if (attrs.mongodbUsername && attrs.authentication !== 'SCRAM-SHA-256') {
      this.authentication = attrs.authentication = 'MONGODB';
    } else if (attrs.kerberosPrincipal) {
      this.authentication = attrs.authentication = 'KERBEROS';
    } else if (attrs.ldapUsername) {
      this.authentication = attrs.authentication = 'LDAP';
    } else if (attrs.x509Username) {
      this.authentication = attrs.authentication = 'X509';
    }

    if (
      attrs.authentication === 'MONGODB' ||
      attrs.authentication === 'SCRAM-SHA-256'
    ) {
      if (!attrs.mongodbDatabaseName) {
        attrs.mongodbDatabaseName = MONGODB_DATABASE_NAME_DEFAULT;
      }

      this.mongodbDatabaseName = attrs.mongodbDatabaseName;
    }

    if (attrs.authentication === 'KERBEROS') {
      if (!attrs.kerberosServiceName) {
        attrs.kerberosServiceName = KERBEROS_SERVICE_NAME_DEFAULT;
      }

      this.kerberosServiceName = attrs.kerberosServiceName;
    }

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
      !attrs.sslType ||
      includes(['NONE', 'UNVALIDATED', 'IFAVAILABLE', 'SYSTEMCA'], attrs.sslType)
    ) {
      return;
    }

    if (attrs.sslType === 'SERVER' && !attrs.sslCA) {
      throw new TypeError('sslCA is required when ssl is SERVER.');
    } else if (attrs.sslType === 'ALL') {
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
      attrs.authentication === 'MONGODB' ||
      attrs.authentication === 'SCRAM-SHA-256'
    ) {
      if (!attrs.mongodbUsername) {
        throw new TypeError(
          'The mongodbUsername field is required when ' +
          'using MONGODB or SCRAM-SHA-256 for authentication.'
        );
      }

      if (!attrs.mongodbPassword) {
        throw new TypeError(
          'The mongodbPassword field is required when ' +
          'using MONGODB or SCRAM-SHA-256 for authentication.'
        );
      }
    }
  },
  /**
   * Enforce constraints for Kerberos.
   * @param {Object} attrs - Incoming attributes.
   */
  validateKerberos(attrs) {
    if (attrs.authentication !== 'KERBEROS') {
      if (attrs.kerberosServiceName) {
        throw new TypeError(format(
          'The kerberosServiceName field does not apply when ' +
          'using %s for authentication.', attrs.authentication));
      }
      if (attrs.kerberosPrincipal) {
        throw new TypeError(format(
          'The kerberosPrincipal field does not apply when ' +
          'using %s for authentication.', attrs.authentication));
      }
      if (attrs.kerberosPassword) {
        throw new TypeError(format(
          'The kerberosPassword field does not apply when ' +
          'using %s for authentication.', attrs.authentication));
      }
    } else if (!attrs.kerberosPrincipal) {
      throw new TypeError(
        'The kerberosPrincipal field is required when using KERBEROS for authentication.'
      );
    }
  },
  validateX509(attrs) {
    if (attrs.authentication === 'X509') {
      if (!attrs.x509Username) {
        throw new TypeError(
          'The x509Username field is required when using X509 for authentication.'
        );
      }
    }
  },
  validateLdap(attrs) {
    if (attrs.authentication === 'LDAP') {
      if (!attrs.ldapUsername) {
        throw new TypeError(format(
          'The ldapUsername field is required when ' +
          'using LDAP for authentication.'));
      }
      if (!attrs.ldapPassword) {
        throw new TypeError(format(
          'The ldapPassword field is required when ' +
          'using LDAP for authentication.'));
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
        throw new TypeError('sslTunnelPassword is required when sshTunnel is USER_PASSWORD.');
      }
    } else if (attrs.sshTunnel === 'IDENTITY_FILE') {
      this.validateStandardSshTunnelOptions(attrs);

      if (!attrs.sshTunnelIdentityFile) {
        throw new TypeError('sslTunnelIdentityFile is required when sshTunnel is IDENTITY_FILE.');
      }
    }
  },
  validateStandardSshTunnelOptions(attrs) {
    if (!attrs.sshTunnelUsername) {
      throw new TypeError('sslTunnelUsername is required when sshTunnel is not NONE.');
    }

    if (!attrs.sshTunnelHostname) {
      throw new TypeError('sslTunnelHostname is required when sshTunnel is not NONE.');
    }

    if (!attrs.sshTunnelPort) {
      throw new TypeError('sslTunnelPort is required when sshTunnel is not NONE.');
    }
  },
  validateStitch(attrs) {
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
 *   const args = require('minimist')(process.argv.slice(2));
 *   const Connection = require('mongodb-connection-model');
 *   const createClient = require('scout-client');
 *   args.endpoint = args.endpoint || 'https://localhost:29017';
 *   const client = createClient(args.endpoint, Connection.from(args._[0]));
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

    const attrs = Object.assign(
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

    // We don't inherit the drivers default values
    // into our model's default values so only set `ns`
    // if it was actually in the URL and not a default.
    if (url.indexOf(parsed.defaultDatabase) > -1) {
      attrs.ns = parsed.defaultDatabase;
    }

    // The `authentication` value for humans
    let authentication = null;

    if (attrs.authMechanism) {
      authentication = attrs.authMechanism;
    } else if (attrs.auth && attrs.auth.username && attrs.auth.password) {
      authentication = 'DEFAULT';
    } else if (attrs.auth && attrs.auth.username) {
      authentication = 'MONGODB-X509';
    }

    attrs.authentication = authentication
      ? AUTH_MECHANISM_TO_AUTHENTICATION[authentication]
      : AUTHENTICATION_DEFAULT;

    if (parsed.auth) {
      const user = decodeURIComponent(parsed.auth.username);
      const password = decodeURIComponent(parsed.auth.password);

      if (attrs.authentication === 'LDAP') {
        attrs.ldapUsername = user;
        attrs.ldapPassword = password;
      } else if (attrs.authentication === 'X509') {
        attrs.x509Username = user;
      } else if (attrs.authentication === 'KERBEROS') {
        attrs.kerberosPrincipal = user;
        attrs.kerberosPassword = password;
      } else if (attrs.authentication === 'MONGODB') {
        attrs.mongodbUsername = user;
        attrs.mongodbPassword = password;

        // authSource takes precedence, but fall back to admin
        // @note Durran: This is not the documented behaviour of the connection string
        // but the shell also does not fall back to the dbName and will use admin.
        attrs.mongodbDatabaseName = decodeURIComponent(
          attrs.authSource || Connection.MONGODB_DATABASE_NAME_DEFAULT
        );

        Object.assign(attrs, Connection._improveAtlasDefaults(url, attrs.auth.password, attrs.ns));
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
    atlasConnectionAttrs.sslType = 'SYSTEMCA';

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
 * For a given `authentication` strategy, what are the applicable
 * field names for say a form?
 *
 * @param {String} authentication - @see {Connection#authentication}
 * @return {Array}
 */
Connection.getFieldNames = (authentication) => AUTHENTICATION_TO_FIELD_NAMES[authentication];

Connection.isAtlas = (str) => str.match(/mongodb.net[:/]/i);

Connection.isURI = (str) => (str.startsWith('mongodb://')) || (str.startsWith('mongodb+srv://'));

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

const ConnectionCollection = AmpersandCollection.extend({
  comparator: 'instanceId',
  model: Connection,
  modelType: 'ConnectionCollection'
});

module.exports = Connection;
module.exports.Collection = ConnectionCollection;
