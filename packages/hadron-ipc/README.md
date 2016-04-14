# hadron-ipc [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Simplified IPC for electron apps.

## Example

From the main process, use `.respondTo(methodName, handler)`:

```javascript
process.env.DEBUG = 'hadron-*';

const app = require('electron').app;
const ipc = require('hadron-ipc');

ipc.respondTo('application:ping', (sender) => {
  console.log('processing application:quit from BrowserWindow', sender);
  return 'pong';
});
```

From a renderer process, use `.call(methodName, handler)`:

```javascript
process.env.DEBUG = 'hadron-*';

const ipc = require('hadron-ipc');

ipc.call('application:ping', (res) => {
  console.log('main process says', res);
});
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-ipc.svg
[travis_url]: https://travis-ci.org/mongodb-js/hadron-ipc
[npm_img]: https://img.shields.io/npm/v/hadron-ipc.svg
[npm_url]: https://npmjs.org/package/hadron-ipc
