const Reflux = require('reflux');

const ConnectActions = Reflux.createActions([
  'resetConnection',
  'onHostnameChanged',
  'onPortChanged',
  'onReadPreferenceChanged',
  'onReplicaSetNameChanged',
  'onAuthenticationMethodChanged',
  'onUsernameChanged',
  'onPasswordChanged',
  'onAuthSourceChanged',
  'onSSLMethodChanged',
  'onSSLCAChanged',
  'onSSLCertificateChanged',
  'onSSLPrivateKeyChanged',
  'onSSLPrivateKeyPasswordChanged',
  'onFavoriteNameChanged',
  'onCreateFavorite',
  'onCreateRecent',
  'onSSHTunnelPasswordChanged',
  'onSSHTunnelPassphraseChanged',
  'onSSHTunnelHostnameChanged',
  'onSSHTunnelUsernameChanged',
  'onSSHTunnelPortChanged',
  'onSSHTunnelIdentityFileChanged',
  'onSSHTunnelChanged',
  'onSaveConnection',
  'onDeleteConnection',
  'onConnectionSelected',
  'onConnectClicked'
]);

module.exports = ConnectActions;
