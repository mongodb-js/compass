/* eslint complexity: 0 */
const URL = require('url');
const toURL = URL.format;
const { format, promisify, callbackify } = require('util');
const fs = require('fs');

const {
  defaults,
  clone,
  cloneDeep,
  unescape
} = require('lodash');
const AmpersandModel = require('ampersand-model');
const AmpersandCollection = require('ampersand-rest-collection');
const { ReadPreference } = require('mongodb');
const { parseConnectionString } = require('mongodb3/lib/core');
const ConnectionString = require('mongodb-connection-string-url').default;
const dataTypes = require('./data-types');
const localPortGenerator = require('./local-port-generator');

const resolveMongodbSrv = require('resolve-mongodb-srv');
const resolveOptions = {};
try {
  const osDns = require('os-dns-native');
  resolveOptions.dns = osDns.withNodeFallback;
} catch (e) {
  console.error(e);
}

/**
 * Defining constants.
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
 * Defining default values.
 */
const AUTH_STRATEGY_DEFAULT = 'NONE';
const READ_PREFERENCE_DEFAULT = ReadPreference.PRIMARY;
const MONGODB_DATABASE_NAME_DEFAULT = 'admin';
const KERBEROS_SERVICE_NAME_DEFAULT = 'mongodb';
const SSL_DEFAULT = 'NONE';
const SSH_TUNNEL_DEFAULT = 'NONE';
const DRIVER_OPTIONS_DEFAULT = { };

/**
 * Mappings from the old connection model properties to the new one.
 */
const PASSWORD_MAPPINGS = {
  mongodb_password: 'mongodbPassword',
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
 * New ConnectionInfo properties
 */
Object.assign(props, {
  connectionInfo: { type: 'object', default: undefined },

  // anything in secrets is saved in the keyring by storage mixin
  secrets: { type: 'object', default: undefined }
});

/**
 * Assigning observable top-level properties of a state class.
 */
Object.assign(props, {
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

Object.assign(session, {
  auth: { type: 'object', default: undefined }
});

/**
 * Connection string options.
 */
const CONNECTION_STRING_OPTIONS = {
  replicaSet: { type: 'string', default: undefined },
  connectTimeoutMS: { type: 'number', default: undefined },
  socketTimeoutMS: { type: 'number', default: undefined },
  compression: { type: 'object', default: undefined },
  /**
   * Connection Pool Option.
   */
  maxPoolSize: { type: 'number', default: undefined },
  minPoolSize: { type: 'number', default: undefined },
  maxIdleTimeMS: { type: 'number', default: undefined },
  waitQueueMultiple: { type: 'number', default: undefined },
  waitQueueTimeoutMS: { type: 'number', default: undefined },
  /**
   * Write Concern Options.
   */
  w: { type: 'any', default: undefined },
  wTimeoutMS: { type: 'number', default: undefined },
  journal: { type: 'boolean', default: undefined },
  /**
   * Read Concern Options.
   */
  readConcernLevel: { type: 'string', default: undefined },
  /**
   * Read Preference Options.
   */
  readPreference: {
    type: 'string',
    values: READ_PREFERENCE_VALUES,
    default: READ_PREFERENCE_DEFAULT
  },
  maxStalenessSeconds: { type: 'number', default: undefined },
  readPreferenceTags: { type: 'array', default: undefined },
  /**
   * Authentication Options.
   */
  authSource: { type: 'string', default: undefined },
  authMechanism: { type: 'string', default: undefined },
  authMechanismProperties: { type: 'object', default: undefined },
  gssapiServiceName: { type: 'string', default: undefined },
  gssapiServiceRealm: { type: 'string', default: undefined },
  gssapiCanonicalizeHostName: { type: 'boolean', default: undefined },
  /**
   * Server Selection and Discovery Options.
   */
  localThresholdMS: { type: 'number', default: undefined },
  serverSelectionTimeoutMS: { type: 'number', default: undefined },
  serverSelectionTryOnce: { type: 'boolean', default: undefined },
  heartbeatFrequencyMS: { type: 'number', default: undefined },
  /**
   * Miscellaneous Configuration.
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
  },
  directConnection: { type: 'boolean', default: undefined },
  loadBalanced: { type: 'boolean', default: undefined }
};

Object.assign(props, CONNECTION_STRING_OPTIONS);

/**
 * Stitch attributes.
 */
Object.assign(props, {
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
 *   >>> { db: { readPreference: 'nearest' }, replSet: { } }
 */
Object.assign(props, {
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
 *     kerberosPrincipal: 'arlo/dog@krb5.mongodb.parts',
 *     ns: 'kerberos'
 *   });
 *   console.log(c.driverUrl)
 *   >>> mongodb://arlo%252Fdog%2540krb5.mongodb.parts@localhost:27017/kerberos?slaveOk=true&authMechanism=GSSAPI
 *   console.log(c.driverOptions)
 *   >>> { db: { readPreference: 'nearest' }, replSet: { } }
 *
 * @enterprise
 * @see http://bit.ly/mongodb-node-driver-kerberos
 */
Object.assign(props, {
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
   * `mongodb://#{encodeURIComponentRFC3986(this.kerberosPrincipal)}`
   */
  kerberosPrincipal: { type: 'string', default: undefined },
  kerberosServiceRealm: { type: 'string', default: undefined },
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
 *   >>> { db: { readPreference: 'nearest' }, replSet: { } }
 *
 * @enterprise
 * @see http://bit.ly/mongodb-node-driver-ldap
 */
Object.assign(props, {
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
 *   >>> { db: { readPreference: 'nearest' }, replSet: { } }
 *
 * @see http://bit.ly/mongodb-node-driver-x509
 * @see http://bit.ly/mongodb-x509
 */
Object.assign(props, {
  /**
   * The x.509 certificate derived user name, e.g. "CN=user,OU=OrgUnit,O=myOrg,..."
   */
  x509Username: { type: 'string', default: undefined }
});

/**
 * SSL
 */
Object.assign(props, {
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
Object.assign(props, {
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
 * Assigning derived (computed) properties of a state class.
 */
Object.assign(derived, {
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
 * To be more stringent in adhering to RFC 3986,
 * replace !, ', (, ), and * with a corresponding character code.
 *
 * @param {String} str - String that needs to be percent-encoded.
 *
 * @returns {String} - Encoded string that compliant with RFC 3986.
 */
function encodeURIComponentRFC3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

function setAuthSourceToExternal(url) {
  const uri = new ConnectionString(url);
  uri.searchParams.set('authSource', '$external');
  return uri.toString();
}

/**
 * Adds auth info to URL. The connection model builds two URLs.
 * driverUrl - for the driver with the password included.
 * safeUrl - for the UI with stars instead of password.
 *
 * @param {Object} options - Has only isPasswordProtected propery.
 *
 * @returns {String} - URL with auth.
 */
function addAuthToUrl({ url, isPasswordProtected }) {
  let username = '';
  let password = '';
  let authField = '';

  // Post url.format() workaround for
  // https://github.com/nodejs/node/issues/1802
  if (
    this.authStrategy === 'MONGODB' ||
    this.authStrategy === 'SCRAM-SHA-256'
  ) {
    username = encodeURIComponentRFC3986(this.mongodbUsername);
    password = isPasswordProtected
      ? '*****'
      : encodeURIComponentRFC3986(this.mongodbPassword);
    authField = format('%s:%s', username, password);
  } else if (this.authStrategy === 'LDAP') {
    username = encodeURIComponentRFC3986(this.ldapUsername);
    password = isPasswordProtected
      ? '*****'
      : encodeURIComponentRFC3986(this.ldapPassword);
    authField = format('%s:%s', username, password);
  } else if (this.authStrategy === 'X509' && this.x509Username) {
    username = encodeURIComponentRFC3986(this.x509Username);
    authField = username;
  } else if (this.authStrategy === 'KERBEROS') {
    username = encodeURIComponentRFC3986(this.kerberosPrincipal);
    authField = format('%s', username);
  }

  // The auth component comes straight after `the mongodb://`
  // so a single string replace should always work.
  url = url.replace('AUTH_TOKEN', authField, 1);

  if (['LDAP', 'KERBEROS', 'X509'].includes(this.authStrategy)) {
    url = setAuthSourceToExternal(url);
  }

  return url;
}

/**
 * Driver Connection Options.
 *
 * So really everything above is all about putting
 * a human API on top of the two arguments `scout-server`
 * will always blindly pass to the driver when connecting to mongodb:
 * `MongoClient.connect(model.driverUrl, model.driverOptions)`.
 *
 * @param {Object} model - The current instance of the Ampersand model.
 *
 * @returns {Object} - The request object.
 */
const prepareRequest = (model) => {
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
  if (model.isSrvRecord) {
    req.protocol = 'mongodb+srv';
    req.hostname = model.hostname;
  } else if (model.hosts.length === 1) {
    // Driver adds sharding info to the original hostname.
    // And returnes a list of all coresponding hosts.
    // If driver returns a list of hosts which size is equal one,
    // we can use hostname attribute that stores unmodified value.
    req.hostname = model.hostname;
    req.port = model.port;
  } else {
    req.host = model.hosts.map((item) => `${item.host}:${item.port}`).join(',');
  }

  if (model.ns) {
    req.pathname = format('/%s', model.ns);
  }

  const authMechanismProperties = {};

  // Encode auth for url format.
  if (model.authStrategy === 'MONGODB') {
    req.auth = 'AUTH_TOKEN';
    req.query.authSource =
      model.mongodbDatabaseName || MONGODB_DATABASE_NAME_DEFAULT;
  } else if (model.authStrategy === 'SCRAM-SHA-256') {
    req.auth = 'AUTH_TOKEN';
    req.query.authSource =
      model.mongodbDatabaseName || MONGODB_DATABASE_NAME_DEFAULT;
    req.query.authMechanism = model.driverAuthMechanism;
  } else if (model.authStrategy === 'KERBEROS') {
    req.auth = 'AUTH_TOKEN';
    defaults(req.query, {
      authMechanism: model.driverAuthMechanism
    });
    if (model.kerberosServiceName && model.kerberosServiceName !== KERBEROS_SERVICE_NAME_DEFAULT) {
      authMechanismProperties.SERVICE_NAME = model.kerberosServiceName;
    }
    if (model.kerberosServiceRealm) {
      authMechanismProperties.SERVICE_REALM = model.kerberosServiceRealm;
    }
    if (model.kerberosCanonicalizeHostname === true) {
      // TODO: we have to set the proper authMechanismProperty once it is supported by the driver
      // see NODE-3351
      // authMechanismProperties.CANONICALIZE_HOST_NAME = true;
      authMechanismProperties.gssapiCanonicalizeHostName = true;
    }
  } else if (model.authStrategy === 'X509') {
    if (model.x509Username) {
      // Username is not required with x509.
      // Since MongoDB 3.4 it's pulled from the client certificate.
      req.auth = 'AUTH_TOKEN';
    }
    defaults(req.query, { authMechanism: model.driverAuthMechanism });
  } else if (model.authStrategy === 'LDAP') {
    req.auth = 'AUTH_TOKEN';
    defaults(req.query, { authMechanism: model.driverAuthMechanism });
  }

  Object.keys(CONNECTION_STRING_OPTIONS).forEach((item) => {
    if (item === 'authMechanismProperties') {
      Object.assign(authMechanismProperties, model.authMechanismProperties || {});
      if (Object.keys(authMechanismProperties).length) {
        req.query.authMechanismProperties = Object.keys(authMechanismProperties)
          .map((tag) => `${tag}:${authMechanismProperties[tag]}`)
          .join(',');
      }
    } else if (typeof model[item] !== 'undefined' && !req.query[item]) {
      if (item === 'compression') {
        if (model.compression && model.compression.compressors) {
          req.query.compressors = model.compression.compressors.join(',');
        }

        if (model.compression && model.compression.zlibCompressionLevel) {
          req.query.zlibCompressionLevel =
            model.compression.zlibCompressionLevel;
        }
      } else if (item === 'readPreferenceTags') {
        if (model.readPreferenceTags) {
          req.query.readPreferenceTags = Object.values(
            model.readPreferenceTags
          ).map((tagGroup) =>
            Object.keys(tagGroup)
              .map((tag) => `${tag}:${tagGroup[tag]}`)
              .join(',')
          );
        }
      } else if (model[item] !== '') {
        req.query[item] = model[item];
      }
    }
  });

  if (model.ssl) {
    req.query.ssl = model.ssl;
  } else if (
    ['UNVALIDATED', 'SYSTEMCA', 'SERVER', 'ALL'].includes(model.sslMethod)
  ) {
    req.query.ssl = 'true';
  } else if (model.sslMethod === 'IFAVAILABLE') {
    req.query.ssl = 'prefer';
  } else if (model.sslMethod === 'NONE') {
    req.query.ssl = 'false';
  }

  return req;
};

Object.assign(derived, {
  safeUrl: {
    cache: false,
    fn() {
      return addAuthToUrl.call(this, {
        url: toURL(prepareRequest(this)),
        isPasswordProtected: true
      });
    }
  },
  driverUrl: {
    cache: false,
    fn() {
      const req = prepareRequest(this);
      return addAuthToUrl.call(this, {
        url: toURL(req),
        isPasswordProtected: false
      });
    }
  },
  driverUrlWithSsh: {
    cache: false,
    fn() {
      const req = cloneDeep(prepareRequest(this));

      if (this.sshTunnel !== 'NONE') {
        // Populate the SSH Tunnel options correctly.
        req.hostname = this.sshTunnelOptions.localAddr;
        req.port = this.sshTunnelOptions.localPort;
      }

      return addAuthToUrl.call(this, {
        url: toURL(req),
        isPasswordProtected: false
      });
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
        Object.assign(opts, { sslValidate: true, sslCA: this.sslCA });
      } else if (this.sslMethod === 'ALL') {
        Object.assign(opts, {
          sslValidate: true,
          sslCA: this.sslCA,
          sslKey: this.sslKey,
          sslCert: this.sslCert
        });

        if (this.sslPass) {
          opts.sslPass = this.sslPass;
        }

        if (this.authStrategy === 'X509') {
          opts.tlsAllowInvalidHostnames = true;
          opts.sslValidate = false;
        }
      } else if (this.sslMethod === 'UNVALIDATED') {
        Object.assign(opts, { tlsAllowInvalidHostnames: true, sslValidate: false });
      } else if (this.sslMethod === 'SYSTEMCA') {
        Object.assign(opts, { tlsAllowInvalidHostnames: false, sslValidate: true });
      } else if (this.sslMethod === 'IFAVAILABLE') {
        Object.assign(opts, { tlsAllowInvalidHostnames: true, sslValidate: true });
      }

      // Assign and overwrite all extra options provided by user.
      Object.assign(opts, this.extraOptions);

      // Only set promoteValues if it is defined.
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
        srcAddr: '127.0.0.1', // OS should figure out an ephemeral srcPort.
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

        const sshTunnelIdentityFileName = Array.isArray(this.sshTunnelIdentityFile) ?
          this.sshTunnelIdentityFile[0] : this.sshTunnelIdentityFile;

        if (sshTunnelIdentityFileName) {
          try {
            opts.privateKey = fs.readFileSync(sshTunnelIdentityFileName);
          } catch (e) {
            /* eslint no-console: 0 */
            console.error(
              `Could not locate ssh tunnel identity file: ${sshTunnelIdentityFileName}`
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
      this.parseKerberosProperties(attrs);
    }

    // Map the old password fields to the new ones.
    Object.keys(PASSWORD_MAPPINGS).forEach((oldField) => {
      const newField = PASSWORD_MAPPINGS[oldField];
      if (!attrs[newField] && attrs[oldField]) {
        this[newField] = attrs[newField] = attrs[oldField];
      }
    });

    return attrs;
  },
  parseKerberosProperties(attrs) {
    const authProperties = attrs.authMechanismProperties || {};
    this.kerberosServiceName = attrs.kerberosServiceName || attrs.gssapiServiceName || authProperties.SERVICE_NAME;
    this.kerberosServiceRealm = attrs.kerberosServiceRealm || attrs.gssapiServiceRealm || authProperties.SERVICE_REALM;
    this.kerberosCanonicalizeHostname = attrs.kerberosCanonicalizeHostname || attrs.gssapiCanonicalizeHostName || authProperties.CANONICALIZE_HOST_NAME || authProperties.gssapiCanonicalizeHostName;

    this.gssapiServiceName = undefined;
    delete attrs.gssapiServiceName;
    this.gssapiServiceRealm = undefined;
    delete attrs.gssapiServiceRealm;
    this.gssapiCanonicalizeHostName = undefined;
    delete attrs.gssapiCanonicalizeHostName;

    delete authProperties.SERVICE_NAME;
    delete authProperties.SERVICE_REALM;
    delete authProperties.CANONICALIZE_HOST_NAME;
    delete authProperties.gssapiCanonicalizeHostName;
    if (this.authProperties) {
      delete this.authProperties.SERVICE_NAME;
      delete this.authProperties.SERVICE_REALM;
      delete this.authProperties.CANONICALIZE_HOST_NAME;
      delete this.authProperties.gssapiCanonicalizeHostName;
    }
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
      ['NONE', 'UNVALIDATED', 'IFAVAILABLE', 'SYSTEMCA'].includes(
        attrs.sslMethod
      )
    ) {
      return;
    }

    if (attrs.sslMethod === 'SERVER' && !attrs.sslCA) {
      throw new TypeError('sslCA is required when ssl is SERVER.');
    } else if (attrs.sslMethod === 'ALL') {
      if (!attrs.sslCA) {
        throw new TypeError('SSL \'Certificate Authority\' is required when the SSL method is set to \'Server and Client Validation\'.');
      }

      if (!attrs.sslCert) {
        throw new TypeError('SSL \'Client Certificate\' is required when the SSL method is set to \'Server and Client Validation\'.');
      }

      if (!attrs.sslKey) {
        throw new TypeError('SSL \'Client Private Key\' is required when the SSL method is set to \'Server and Client Validation\'.');
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
          'The \'Username\' field is required when ' +
            'using \'Username/Password\' or \'SCRAM-SHA-256\' for authentication.'
        );
      }

      if (!attrs.mongodbPassword) {
        throw new TypeError(
          'The \'Password\' field is required when ' +
            'using \'Username/Password\' or \'SCRAM-SHA-256\' for authentication.'
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
            'The Kerberos \'Service Name\' field does not apply when ' +
              'using %s for authentication.',
            attrs.authStrategy
          )
        );
      }
      if (attrs.kerberosPrincipal) {
        throw new TypeError(
          format(
            'The Kerberos \'Principal\' field does not apply when ' +
              'using %s for authentication.',
            attrs.authStrategy
          )
        );
      }
    } else if (!attrs.kerberosPrincipal) {
      throw new TypeError(
        'The Kerberos \'Principal\' field is required when using \'Kerberos\' for authentication.'
      );
    }
  },
  validateX509(attrs) {
    if (attrs.authStrategy === 'X509') {
      if (attrs.sslMethod !== 'ALL') {
        throw new TypeError(
          'SSL method is required to be set to \'Server and Client Validation\' when using X.509 authentication.'
        );
      }
    }
  },
  validateLdap(attrs) {
    if (attrs.authStrategy === 'LDAP') {
      if (!attrs.ldapUsername) {
        throw new TypeError(
          format(
            'The \'Username\' field is required when ' +
              'using \'LDAP\' for authentication.'
          )
        );
      }
      if (!attrs.ldapPassword) {
        throw new TypeError(
          format(
            'The \'Password\' field is required when ' +
              'using LDAP for authentication.'
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
          '\'SSH Password\' is required when SSH Tunnel is set to \'Use Password\'.'
        );
      }
    } else if (attrs.sshTunnel === 'IDENTITY_FILE') {
      this.validateStandardSshTunnelOptions(attrs);

      if (!attrs.sshTunnelIdentityFile) {
        throw new TypeError(
          '\'SSH Identity File\' is required when SSH Tunnel is set to \'Use Identity File\'.'
        );
      }
    }
  },
  validateStandardSshTunnelOptions(attrs) {
    if (!attrs.sshTunnelUsername) {
      throw new TypeError(
        '\'SSH Username\' is required when SSH Tunnel is set.'
      );
    }

    if (!attrs.sshTunnelHostname) {
      throw new TypeError(
        '\'SSH Hostname\' is required when SSH Tunnel is set.'
      );
    }

    if (!attrs.sshTunnelPort) {
      throw new TypeError(
        '\'SSH Tunnel Port\' is required when SSH Tunnel is set.'
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

const parseConnectionStringAsPromise = promisify(parseConnectionString);

async function createConnectionFromUrl(url) {
  // We use resolveMongodbSrv because it understands the load balancer
  // option, whereas parseConnectionString from the 3.6 driver does not.
  // This could potentially go away once we're using the 3.7 driver,
  // which will have load balancer support, *but* the whole reason that
  // resolveMongodbSrv exists is as a possible solution for
  // https://jira.mongodb.org/browse/COMPASS-4768
  // so we may want to keep it around anyway.
  const unescapedUrl = unescape(url);
  const resolvedUrl = await resolveMongodbSrv(unescapedUrl, resolveOptions);
  const parsed = await parseConnectionStringAsPromise(resolvedUrl);
  const isSrvRecord = unescapedUrl.startsWith('mongodb+srv://');
  const attrs = Object.assign(
    {
      hosts: parsed.hosts,
      // If this is using an srv record, we can just take the original
      // URL before SRV resolution to get the "hostname".
      hostname: isSrvRecord ? new ConnectionString(unescapedUrl).hosts[0] : parsed.hosts[0].host,
      auth: parsed.auth,
      isSrvRecord
    },
    parsed.options
  );

  if (!isSrvRecord) {
    attrs.port = parsed.hosts[0].port;
  } else {
    // The 3.x driver's options parser adds this for resolved SRV records
    // that only point to a single node, it seems. We should not add it,
    // since it interferes with load balancer support.
    delete attrs.directConnection;
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
  }

  attrs.authStrategy = authStrategy
    ? AUTH_MECHANISM_TO_AUTH_STRATEGY[authStrategy]
    : AUTH_STRATEGY_DEFAULT;

  if (parsed.auth) {
    let user = parsed.auth.username;
    let password = parsed.auth.password;

    if (attrs.authStrategy === 'LDAP') {
      attrs.ldapUsername = user;
      attrs.ldapPassword = password;
    } else if (attrs.authStrategy === 'X509' && parsed.auth.username) {
      attrs.x509Username = user;
    } else if (attrs.authStrategy === 'KERBEROS') {
      attrs.kerberosPrincipal = user;
    } else if (
      attrs.authStrategy === 'MONGODB' ||
      attrs.authStrategy === 'SCRAM-SHA-256'
    ) {
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

  // Since the 3.x parser does not recognize loadBalanced as an option, we have to
  // parse it ourselves.
  const loadBalanced = new ConnectionString(unescapedUrl).searchParams.get('loadBalanced');
  switch (loadBalanced) {
    case 'true':
      attrs.loadBalanced = true;
      delete attrs.directConnection;
      break;
    case 'false':
      attrs.loadBalanced = false;
      break;
    default:
      break;
  }

  return new Connection(attrs);
}

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
Connection.from = callbackify(createConnectionFromUrl);

/**
 * Helper function to improve the Atlas user experience by
 * providing better default values.
 *
 * @param {String} url - The connection string URL.
 * @param {String} mongodbPassword - The mongodbPassword.
 *   which the user may need to change.
 * @param {String} ns - The namespace to connect to.
 * @returns {Object} Connection attributes to override.
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
 * @param {String} authStrategy - The desired authentication strategy.
 * @return {Array}
 */
Connection.getFieldNames = (authStrategy) =>
  AUTH_STRATEGY_TO_FIELD_NAMES[authStrategy];

Connection.isAtlas = (str) => str.match(/mongodb.net[:/]/i);

Connection.isURI = (str) =>
  str.startsWith('mongodb://') || str.startsWith('mongodb+srv://');

Connection.encodeURIComponentRFC3986 = encodeURIComponentRFC3986;

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
