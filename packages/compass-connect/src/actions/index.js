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
  'onFavoriteSelected'
]);

module.exports = ConnectActions;
