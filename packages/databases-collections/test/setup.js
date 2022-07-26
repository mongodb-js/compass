const hadronApp = require('hadron-app');
const { AppRegistry } = require('hadron-app-registry');

const appRegistry = new AppRegistry();

global.hadronApp = hadronApp;
global.hadronApp.appRegistry = appRegistry;

// TODO: add App.InstanceStore

appRegistry.onActivated();
