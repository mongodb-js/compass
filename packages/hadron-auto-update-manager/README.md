# hadron-auto-update-manager [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

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
## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-auto-update-manager.svg
[travis_url]: https://travis-ci.org/mongodb-js/hadron-auto-update-manager
[npm_img]: https://img.shields.io/npm/v/hadron-auto-update-manager.svg
[npm_url]: https://npmjs.org/package/hadron-auto-update-manager
