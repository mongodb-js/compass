const Reflux = require('reflux');

const ConnectActions = Reflux.createActions({
  'resetConnection': { sync: true },
  'onHostnameChanged': { sync: true },
  'onPortChanged': { sync: true },
  'onReadPreferenceChanged': { sync: true },
  'onReplicaSetChanged': { sync: true },
  'onAuthStrategyChanged': { sync: true },
  'onUsernameChanged': { sync: true },
  'onPasswordChanged': { sync: true },
  'onAuthSourceChanged': { sync: true },
  'onSSLMethodChanged': { sync: true },
  'onSSLCAChanged': { sync: true },
  'onSSLCertificateChanged': { sync: true },
  'onSSLPrivateKeyChanged': { sync: true },
  'onSSLPrivateKeyPasswordChanged': { sync: true },
  'onFavoriteNameChanged': { sync: true },
  'onCreateFavorite': { sync: true },
  'onCreateRecent': { sync: true },
  'onSSHTunnelPasswordChanged': { sync: true },
  'onSSHTunnelPassphraseChanged': { sync: true },
  'onSSHTunnelHostnameChanged': { sync: true },
  'onSSHTunnelUsernameChanged': { sync: true },
  'onSSHTunnelPortChanged': { sync: true },
  'onSSHTunnelIdentityFileChanged': { sync: true },
  'onSSHTunnelChanged': { sync: true },
  'onSaveConnection': { sync: true },
  'onDeleteConnection': { sync: true },
  'onDeleteConnections': { sync: true },
  'onConnectionSelected': { sync: true },
  'onConnect': { sync: true },
  'onDisconnect': { sync: true },
  'onSRVRecordToggle': { sync: true },
  'onVisitAtlasLink': { sync: true },
  'onAtlasLearnMore': { sync: true }
});

module.exports = ConnectActions;
