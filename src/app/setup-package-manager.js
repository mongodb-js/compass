const app = require('ampersand-app');
const path = require('path');
const AppRegistry = require('hadron-app-registry');
const { PackageManager } = require('hadron-package-manager');

app.appRegistry = new AppRegistry();
app.packageManager = new PackageManager(path.join(__dirname, '..', 'internal-packages'));
app.packageManager.activate();
