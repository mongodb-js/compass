/**
 * Constants for window sizes on multiple platforms
 */

/**
* The outer dimensions to use for new windows.
*/
exports.DEFAULT_WIDTH = 1280;
exports.DEFAULT_HEIGHT = 800;

/**
* The outer window dimensions to use for new dialog
* windows like the connection and setup dialogs.
*/
exports.DEFAULT_WIDTH_DIALOG = 640;
exports.DEFAULT_HEIGHT_DIALOG = 470;
/**
* Adjust the heights to account for platforms
* that use a single menu bar at the top of the screen.
*/
if (process.platform === 'linux') {
  exports.DEFAULT_HEIGHT_DIALOG -= 30;
  exports.DEFAULT_HEIGHT -= 30;
} else if (process.platform === 'darwin') {
  exports.DEFAULT_HEIGHT_DIALOG -= 60;
  exports.DEFAULT_HEIGHT -= 60;
}

module.exports = exports;
