const hadronApp = require('hadron-app');
const { AppRegistry } = require('hadron-app-registry');

// TODO
const { activate } = require('@mongodb-js/compass-deployment-awareness');
const appRegistry = new AppRegistry();

global.hadronApp = hadronApp;
global.hadronApp.appRegistry = appRegistry;

activate(appRegistry);
appRegistry.onActivated();
