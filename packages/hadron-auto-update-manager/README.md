# hadron-auto-update-manager [![npm][npm_img]][npm_url]

> Atom's [`AutoUpdateManager`](https://github.com/atom/atom/blob/master/src/browser/auto-update-manager.coffee) class as a standalone module.

## Example

```javascript
const path = require('path');
const AutoUpdateManager = require('hadron-auto-update-manager');

const autoUpdater = new AutoUpdateManager({
    endpoint: 'https://compass-mongodb-com.herokuapp.com',
    icon_path: path.join(__dirname, '..', 'resources', 'mongodb-compass.png')
  })
  .on('update-available', () => {
    autoUpdater.install();
  })
  .check();

```

[npm_img]: https://img.shields.io/npm/v/hadron-auto-update-manager.svg
[npm_url]: https://npmjs.org/package/hadron-auto-update-manager
