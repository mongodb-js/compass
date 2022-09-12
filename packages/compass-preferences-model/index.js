const Preferences = require('./lib/preferences');
const { preferencesIpc } = require('./lib/renderer-ipc');

module.exports = Preferences;
module.exports.preferencesIpc = preferencesIpc;
