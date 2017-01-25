var path = require('path');
var COMPASS_ICON = path.join(__dirname, 'app', 'images', 'compass-dialog-icon.png');
var nativeImage = require('electron').nativeImage;

/**
 * Convenience for getting the app icon to customize native UI components
 * via electron.
 *
 * @example
 * ```javascript
 * var icon = require('./icon');
 * var dialog = require('electron').dialog;
 * dialog.showMessageBox({icon: icon, message: 'I have a nice Compass icon.'});
 * ```
 *
 * @see https://jira.mongodb.org/browse/COMPASS-586
 */
module.exports = nativeImage.createFromPath(COMPASS_ICON);
module.exports.path = COMPASS_ICON;
