import Connect from './plugin';
import Actions from 'actions';
import Store from 'stores';
import MongoDBAuthentication from 'components/form/mongodb-authentication';
import ScramSha256 from 'components/form/scram-sha-256';
import SSLServerValidation from 'components/form/ssl-server-validation';
import SSLServerClientValidation from 'components/form/ssl-server-client-validation';
import SSHTunnelIdentityFileValidation from 'components/form/ssh-tunnel-identity-file-validation';
import SSHTunnelPasswordValidation from 'components/form/ssh-tunnel-password-validation';
import FavoriteModal from 'components/form/favorite-modal';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Connect',
  component: Connect
};

/**
 * No auth role has no component.
 */
const NO_AUTH_ROLE = {
  name: 'NONE',
  selectOption: { NONE: 'None' }
};

/**
 * No auth role has no component.
 */
const MONGODB_AUTH_ROLE = {
  name: 'MONGODB',
  selectOption: { MONGODB: 'Username / Password' },
  component: MongoDBAuthentication
};

/**
 * SCRAM-SHA-256
 */
const SCRAM_SHA_256_AUTH_ROLE = {
  name: 'SCRAM-SHA-256',
  selectOption: { 'SCRAM-SHA-256': 'SCRAM-SHA-256' },
  component: ScramSha256
};

/**
 * No ssl role has no component.
 */
const NO_SSL_ROLE = {
  name: 'NONE',
  selectOption: { NONE: 'None' }
};

/**
 * System CA ssl role has no component.
 */
const SYSTEM_CA_SSL_ROLE = {
  name: 'SYSTEMCA',
  selectOption: { SYSTEMCA: 'System CA / Atlas Deployment' }
};

/**
 * Unvalidated (insecure) ssl role has no component.
 */
const UNVALIDATED_SLL_ROLE = {
  name: 'UNVALIDATED',
  selectOption: { UNVALIDATED: 'Unvalidated (insecure)' }
};

/**
 * Server validation role.
 */
const SERVER_VALIDATION_SSL_ROLE = {
  name: 'SERVER',
  selectOption: { SERVER: 'Server Validation' },
  component: SSLServerValidation
};

/**
 * Server/Client validation role.
 */
const SERVER_CLIENT_VALIDATION_SSL_ROLE = {
  name: 'ALL',
  selectOption: { ALL: 'Server and Client Validation' },
  component: SSLServerClientValidation
};

/**
 * No SSH tunnel role has no component.
 */
const NO_SSH_TUNNEL_ROLE = {
  name: 'NONE',
  selectOption: { NONE: 'None' }
};

/**
 * Use passworld SSH tunnel role.
 */
const PASSWORD_SSH_TUNNEL_ROLE = {
  name: 'USER_PASSWORD',
  selectOption: { USER_PASSWORD: 'Use Password' },
  component: SSHTunnelPasswordValidation
};

/**
 * Use indentity file SSH tunnel role.
 */
const IDENTITY_FILE_SSH_TUNNEL_ROLE = {
  name: 'IDENTITY_FILE',
  selectOption: { IDENTITY_FILE: 'Use Identity File' },
  component: SSHTunnelIdentityFileValidation
};

/**
 * Activate all the components in the  Mongodb Js Compass Connect package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
function activate(appRegistry) {
  appRegistry.registerRole('Application.Connect', ROLE);
  appRegistry.registerRole('Connect.SSLMethod', NO_SSL_ROLE);
  appRegistry.registerRole('Connect.SSLMethod', SYSTEM_CA_SSL_ROLE);
  appRegistry.registerRole('Connect.SSLMethod', SERVER_VALIDATION_SSL_ROLE);
  appRegistry.registerRole('Connect.SSLMethod', SERVER_CLIENT_VALIDATION_SSL_ROLE);
  appRegistry.registerRole('Connect.SSLMethod', UNVALIDATED_SLL_ROLE);
  appRegistry.registerRole('Connect.SSHTunnel', NO_SSH_TUNNEL_ROLE);
  appRegistry.registerRole('Connect.SSHTunnel', PASSWORD_SSH_TUNNEL_ROLE);
  appRegistry.registerRole('Connect.SSHTunnel', IDENTITY_FILE_SSH_TUNNEL_ROLE);
  appRegistry.registerRole('Connect.AuthStrategy', NO_AUTH_ROLE);
  appRegistry.registerRole('Connect.AuthStrategy', MONGODB_AUTH_ROLE);
  appRegistry.registerRole('Connect.AuthStrategy', SCRAM_SHA_256_AUTH_ROLE);
  appRegistry.registerAction('Connect.Actions', Actions);
  appRegistry.registerStore('Connect.Store', Store);
}

/**
 * Deactivate all the components in the  Mongodb Js Compass Connect package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Application.Connect', ROLE);
  appRegistry.deregisterRole('Connect.SSLMethod', NO_SSL_ROLE);
  appRegistry.deregisterRole('Connect.SSLMethod', SYSTEM_CA_SSL_ROLE);
  appRegistry.deregisterRole('Connect.SSLMethod', SERVER_VALIDATION_SSL_ROLE);
  appRegistry.deregisterRole('Connect.SSLMethod', SERVER_CLIENT_VALIDATION_SSL_ROLE);
  appRegistry.deregisterRole('Connect.SSLMethod', UNVALIDATED_SLL_ROLE);
  appRegistry.deregisterRole('Connect.SSHTunnel', NO_SSH_TUNNEL_ROLE);
  appRegistry.deregisterRole('Connect.SSHTunnel', PASSWORD_SSH_TUNNEL_ROLE);
  appRegistry.deregisterRole('Connect.SSHTunnel', IDENTITY_FILE_SSH_TUNNEL_ROLE);
  appRegistry.deregisterRole('Connect.AuthStrategy', NO_AUTH_ROLE);
  appRegistry.deregisterRole('Connect.AuthStrategy', MONGODB_AUTH_ROLE);
  appRegistry.deregisterRole('Connect.AuthStrategy', SCRAM_SHA_256_AUTH_ROLE);
  appRegistry.deregisterAction('Connect.Actions');
  appRegistry.deregisterStore('Connect.Store');
}

export default Connect;
export {
  MongoDBAuthentication,
  ScramSha256,
  SSLServerValidation,
  SSLServerClientValidation,
  SSHTunnelIdentityFileValidation,
  SSHTunnelPasswordValidation,
  activate,
  deactivate,
  FavoriteModal
};
