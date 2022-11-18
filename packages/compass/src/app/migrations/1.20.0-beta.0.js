const debug = require('debug')('mongodb-compass:migrations');
const { ConnectionIndexedDBCollection } = require('./connection-indexeddb');
const Connection = require('./connection-disk');

/**
 * Mappings from the old connection model properties to the new one.
 */
const MAPPINGS = {
  _id: '_id',
  name: 'name',
  hostname: 'hostname',
  port: 'port',
  connectionType: 'connectionType',
  ns: 'ns',
  app_name: 'appname',
  extra_options: 'extraOptions',
  isSrvRecord: 'isSrvRecord',
  last_used: 'lastUsed',
  is_favorite: 'isFavorite',
  stitchServiceName: 'stitchServiceName',
  stitchClientAppId: 'stitchClientAppId',
  stitchGroupId: 'stitchGroupId',
  stitchBaseUrl: 'stitchBaseUrl',
  read_preference: 'readPreference',
  replica_set_name: 'replicaSet',
  authentication: 'authStrategy',
  mongodb_username: 'mongodbUsername',
  mongodb_password: 'mongodbPassword',
  mongodb_database_name: 'mongodbDatabaseName',
  promote_values: 'promoteValues',
  kerberos_service_name: 'kerberosServiceName',
  kerberos_principal: 'kerberosPrincipal',
  kerberos_password: 'kerberosPassword',
  kerberos_canonicalize_hostname: 'kerberosCanonicalizeHostname',
  ldap_username: 'ldapUsername',
  ldap_password: 'ldapPassword',
  x509_username: 'x509Username',
  ssl: 'sslMethod',
  ssl_ca: 'sslCa',
  ssl_certificate: 'sslCert',
  ssl_private_key: 'sslKey',
  ssl_private_key_password: 'sslPass',
  ssh_tunnel: 'sshTunnel',
  ssh_tunnel_hostname: 'sshTunnelHostname',
  ssh_tunnel_port: 'sshTunnelPort',
  ssh_tunnel_bind_to_local_port: 'sshTunnelBindToLocalPort',
  ssh_tunnel_username: 'sshTunnelUsername',
  ssh_tunnel_password: 'sshTunnelPassword',
  ssh_tunnel_identity_file: 'sshTunnelIdentityFile',
  ssh_tunnel_passphrase: 'sshTunnelPassphrase',
};

/**
 * Map the old attributes object to a new attributes object.
 *
 * @param {Object} attributes - The old attributes.
 *
 * @returns {Object} The new attributes.
 */
const mapAttributes = (attributes) => {
  return Object.keys(attributes).reduce((newAttributes, key) => {
    const mapping = MAPPINGS[key];
    if (mapping) {
      const value = attributes[key];
      newAttributes[mapping] = value;
      if (key === 'ssl' && value !== 'NONE') {
        newAttributes.ssl = true;
      }
    }
    return newAttributes;
  }, {});
};

/**
 * This migration removes connections from IndexedDB and persists them to
 * disk. See COMPASS-3710. This needs to create a parallel async task for
 * the save to ensure the connection screen does not load before the
 * model persist finishes.
 *
 * @param {Function} done - The done callback.
 */
const moveToDiskStorage = (done) => {
  debug('migration: moveToDiskStorage');
  const connections = new ConnectionIndexedDBCollection();
  connections.once('sync', function () {
    if (connections.length > 0) {
      let callCount = 0;
      connections.each(function (connection) {
        const newAttributes = mapAttributes(connection.attributes);
        const newConnection = new Connection(newAttributes);
        const valid = newConnection.save(
          {},
          {
            success: () => {
              callCount += 1;
              if (callCount === connections.length) {
                done(null);
              }
            },
            error: () => {
              callCount += 1;
              if (callCount === connections.length) {
                done(null);
              }
            },
          }
        );
        if (!valid && callCount === connections.length) {
          callCount += 1;
          done(null);
        }
      });
    } else {
      done(null);
    }
  });
  connections.fetch({ reset: true });
};

module.exports = (previousVersion, currentVersion, callback) => {
  moveToDiskStorage(function (err) {
    if (err) {
      debug('encountered an error in the migration', err);
      return callback(null);
    }
    callback(null, 'successful migration to persist to disk');
  });
};
