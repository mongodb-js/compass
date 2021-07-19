import Connect from './plugin';
import Actions from './actions';
import Store from './stores';
import SSLServerValidation from './components/form/ssl-server-validation';
import SSLServerClientValidation from './components/form/ssl-server-client-validation';
import SSHTunnelIdentityFileValidation from './components/form/ssh-tunnel-identity-file-validation';
import SSHTunnelPasswordValidation from './components/form/ssh-tunnel-password-validation';
import FavoriteModal from './components/form/favorite-modal';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Connect',
  component: Connect
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
  appRegistry.registerRole('Connect.SSHTunnel', NO_SSH_TUNNEL_ROLE);
  appRegistry.registerRole('Connect.SSHTunnel', PASSWORD_SSH_TUNNEL_ROLE);
  appRegistry.registerRole('Connect.SSHTunnel', IDENTITY_FILE_SSH_TUNNEL_ROLE);
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
  appRegistry.deregisterRole('Connect.SSHTunnel', NO_SSH_TUNNEL_ROLE);
  appRegistry.deregisterRole('Connect.SSHTunnel', PASSWORD_SSH_TUNNEL_ROLE);
  appRegistry.deregisterRole('Connect.SSHTunnel', IDENTITY_FILE_SSH_TUNNEL_ROLE);
  appRegistry.deregisterAction('Connect.Actions');
  appRegistry.deregisterStore('Connect.Store');
}

export default Connect;
export {
  SSLServerValidation,
  SSLServerClientValidation,
  SSHTunnelIdentityFileValidation,
  SSHTunnelPasswordValidation,
  activate,
  deactivate,
  FavoriteModal
};
