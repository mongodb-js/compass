import path from 'path';
import { nativeImage } from 'electron';
import compassIconPath from '../app/images/compass-dialog-icon.png';

const COMPASS_ICON = path.join(__dirname, compassIconPath);

/**
 * Convenience for getting the app icon to customize native UI components
 * via electron.
 *
 * @example
 * ```javascript
 * const icon = require('./icon');
 * const dialog = require('electron').dialog;
 * dialog.showMessageBox({icon: icon, message: 'I have a nice Compass icon.'});
 * ```
 *
 * @see https://jira.mongodb.org/browse/COMPASS-586
 */
const image = nativeImage.createFromPath(COMPASS_ICON);

export default image;
export { COMPASS_ICON as path };
