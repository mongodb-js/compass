/**
 * The main entrypoint Electron will execute.
 */
var appRoot = __dirname;

require('electron-compile').init(appRoot, './src/electron');
