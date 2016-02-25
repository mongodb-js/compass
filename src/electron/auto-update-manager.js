// var app = window.require('electron').app;

// var AutoUpdateManager = Model.extend({
//   properties: {
//     channel: {
//       type: 'string',
//       default: 'stable'
//     },
//     platform: {
//       type: 'string',
//       default: 'darwin'
//     },
//     platform: {
//       type: 'string',
//       default: 'darwin'
//     }
//   },
//   derived: {
//     feed_url: function(){
//       return 'https://squirrel-mongodb-parts.herokuapp.com/${app.name}/latest?%s', {
//           version: app.version,
//           platform: this.platform,
//           arch: this.arch
//         };
//     }
//   }
// });
//
// module.exports = function AutoUpdateManager(version, testMode, resourcePath) {
//     this.version = version;
//     this.testMode = testMode;
//     this.onUpdateError = bind(this.onUpdateError, this);
//     this.onUpdateNotAvailable = bind(this.onUpdateNotAvailable, this);
//     this.state = IdleState;
//     this.iconPath = path.resolve(__dirname, '..', '..', 'resources', 'atom.png');
//     this.feedUrl = "https://atom.io/api/updates?version=" + this.version;
//     this.config = new Config({
//       configDirPath: process.env.ATOM_HOME,
//       resourcePath: resourcePath,
//       enablePersistence: true
//     });
//     this.config.setSchema(null, {
//       type: 'object',
//       properties: _.clone(require('../config-schema'))
//     });
//     this.config.load();
//     process.nextTick((function(_this) {
//       return function() {
//         return _this.setupAutoUpdater();
//       };
//     })(this));
//   }
//
//   AutoUpdateManager.prototype.setupAutoUpdater = function() {
//     if (process.platform === 'win32') {
//       autoUpdater = require('./auto-updater-win32');
//     } else {
//       autoUpdater = require('auto-updater');
//     }
//     autoUpdater.on('error', (function(_this) {
//       return function(event, message) {
//         _this.setState(ErrorState);
//         return console.error("Error Downloading Update: " + message);
//       };
//     })(this));
//     autoUpdater.setFeedUrl(this.feedUrl);
//     autoUpdater.on('checking-for-update', (function(_this) {
//       return function() {
//         return _this.setState(CheckingState);
//       };
//     })(this));
//     autoUpdater.on('update-not-available', (function(_this) {
//       return function() {
//         return _this.setState(NoUpdateAvailableState);
//       };
//     })(this));
//     autoUpdater.on('update-available', (function(_this) {
//       return function() {
//         return _this.setState(DownladingState);
//       };
//     })(this));
//     autoUpdater.on('update-downloaded', (function(_this) {
//       return function(event, releaseNotes, releaseVersion) {
//         _this.releaseVersion = releaseVersion;
//         _this.setState(UpdateAvailableState);
//         return _this.emitUpdateAvailableEvent.apply(_this, _this.getWindows());
//       };
//     })(this));
//     this.config.onDidChange('core.automaticallyUpdate', (function(_this) {
//       return function(arg) {
//         var newValue;
//         newValue = arg.newValue;
//         if (newValue) {
//           return _this.scheduleUpdateCheck();
//         } else {
//           return _this.cancelScheduledUpdateCheck();
//         }
//       };
//     })(this));
//     if (this.config.get('core.automaticallyUpdate')) {
//       this.scheduleUpdateCheck();
//     }
//     switch (process.platform) {
//       case 'win32':
//         if (!autoUpdater.supportsUpdates()) {
//           return this.setState(UnsupportedState);
//         }
//         break;
//       case 'linux':
//         return this.setState(UnsupportedState);
//     }
//   };
//
//   AutoUpdateManager.prototype.emitUpdateAvailableEvent = function() {
//     var atomWindow, i, len, windows;
//     windows = 1 <= arguments.length ? slice.call(arguments, 0) : [];
//     if (this.releaseVersion == null) {
//       return;
//     }
//     for (i = 0, len = windows.length; i < len; i++) {
//       atomWindow = windows[i];
//       atomWindow.sendMessage('update-available', {
//         releaseVersion: this.releaseVersion
//       });
//     }
//   };
//
//   AutoUpdateManager.prototype.setState = function(state) {
//     if (this.state === state) {
//       return;
//     }
//     this.state = state;
//     return this.emit('state-changed', this.state);
//   };
//
//   AutoUpdateManager.prototype.getState = function() {
//     return this.state;
//   };
//
//   AutoUpdateManager.prototype.scheduleUpdateCheck = function() {
//     var checkForUpdates, fourHours;
//     if (!(/\w{7}/.test(this.version) || this.checkForUpdatesIntervalID)) {
//       checkForUpdates = (function(_this) {
//         return function() {
//           return _this.check({
//             hidePopups: true
//           });
//         };
//       })(this);
//       fourHours = 1000 * 60 * 60 * 4;
//       this.checkForUpdatesIntervalID = setInterval(checkForUpdates, fourHours);
//       return checkForUpdates();
//     }
//   };
//
//   AutoUpdateManager.prototype.cancelScheduledUpdateCheck = function() {
//     if (this.checkForUpdatesIntervalID) {
//       clearInterval(this.checkForUpdatesIntervalID);
//       return this.checkForUpdatesIntervalID = null;
//     }
//   };
//
//   AutoUpdateManager.prototype.check = function(arg) {
//     var hidePopups;
//     hidePopups = (arg != null ? arg : {}).hidePopups;
//     if (!hidePopups) {
//       autoUpdater.once('update-not-available', this.onUpdateNotAvailable);
//       autoUpdater.once('error', this.onUpdateError);
//     }
//     if (!this.testMode) {
//       return autoUpdater.checkForUpdates();
//     }
//   };
//
//   AutoUpdateManager.prototype.install = function() {
//     if (!this.testMode) {
//       return autoUpdater.quitAndInstall();
//     }
//   };
//
//   AutoUpdateManager.prototype.onUpdateNotAvailable = function() {
//     var dialog;
//     autoUpdater.removeListener('error', this.onUpdateError);
//     dialog = require('dialog');
//     return dialog.showMessageBox({
//       type: 'info',
//       buttons: ['OK'],
//       icon: this.iconPath,
//       message: 'No update available.',
//       title: 'No Update Available',
//       detail: "Version " + this.version + " is the latest version."
//     });
//   };
//
//   AutoUpdateManager.prototype.onUpdateError = function(event, message) {
//     var dialog;
//     autoUpdater.removeListener('update-not-available', this.onUpdateNotAvailable);
//     dialog = require('dialog');
//     return dialog.showMessageBox({
//       type: 'warning',
//       buttons: ['OK'],
//       icon: this.iconPath,
//       message: 'There was an error checking for updates.',
//       title: 'Update Error',
//       detail: message
//     });
//   };
//
//   AutoUpdateManager.prototype.getWindows = function() {
//     return global.atomApplication.windows;
//   };
//
//   return AutoUpdateManager;
//
// })();

// ---
// generated by coffee-script 1.9.2
