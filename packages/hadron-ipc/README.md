# hadron-ipc [![npm][npm_img]][npm_url]

Simplified wrapper around Electron's IPC events.

# Usage

```javascript
process.env.DEBUG = 'hadron-*';

const ipc = require('hadron-ipc');
const AppRegistry = require('hadron-app-registry');

const globalAppRegistry = new AppRegistry();

// called from a renderer process:
ipc.call('compass:loading:change-status', { status: 'loading preferences' });

// responded to in the main process:
ipc.respondTo('app:loading:change-status', (evt, meta) => {
  // main process then broadcasts to its renderer processes:
  ipc.broadcast('app:loading:change-status', meta);
});

// renderer process deals with information when received
ipc.on('app:loading:change-status', (evt, meta) => {
  globalAppRegistry.emit('app:loading:change-status', meta);
});
```

## API - from Main Process

Communication from the main process to a renderer process.

### ipc.respondTo(methodName, handler)

Respond to an event sent from a renderer process. `handler` keeps track of
`BrowserWindow` instance and any of the `args`.

```js
const ipc = require('hadron-ipc');

const onFindInPage = (sender, searchTerm, opt) => {
  if (!_window) return;

  opt = opt || {};
  _window.webContents.findInPage(searchTerm, opt);
};

ipc.respondTo('app:find-in-page', onFindInPage);
```

You can also use `broadcast` as part of the response:

```js
const ipc = require('hadron-ipc');

ipc.respondTo('app:loading:change-status', (evt, meta) => {
  ipc.broadcast('app:loading:change-status', meta);
});
```

### ipc.broadcast(methodName, [...args])

Broadcast an event to renderer process(es).

For example, here is a broadcast from a Menu Item:

```js
const ipc = require('hadron-ipc');

function viewSubMenu() {
  return {
    label: '&View',
      {
        label: '&Reload Data',
        accelerator: 'CmdOrCtrl+R',
        click: function() {
          ipc.broadcast('app:refresh-data'); // renderer processes will be
listening to this event
        }
      }
    ]
  };
}
```

### ipc.broadcastFocused(methodName, [...args])

Broadcast to renderer process(es) only if the current window is focused.

```js
ipc.broadcastFocused('app:disconnect');
```

### ipc.remove(channel, listener)

Remove a listener from the main process' ipc.

```js
const ipc = require('hadron-ipc');

const onFindInPage = (sender, searchTerm, opt) => {
  if (!_window) return;

  opt = opt || {};
  _window.webContents.findInPage(searchTerm, opt);
};

ipc.remove('app:stop-find-in-page', onStopFindInPage);
```

## API - from Renderer process

Communication from a renderer proces to the main process. All of the
[ipcRenderer][ipc-renderer] events are kept as
is, `ipc.call` is added as an additional method.

### ipc.call(methodName, [...args])

Call the main process under the provided `methodName`. Under the hood `args`
are serialised as JSON.

```js
const ipc = require('hadron-ipc');

const args = {
  query: {
    filter: {},
    project: { field: 1 }
  }
};
ipc.call('app:open-export', args, (res) = {
  console.log('callback from renderer process', res)
});
```

### ipc.on(methodName, handler)

From Electron's `ipcRenderer` API. Useful for when replying to Main process'
`ipc.broadcast` events.

```js
const ipc = require('hadron-ipc');
const app = require('hadron-app');
global.hadronApp = app;

ipc.on('app:refresh-data', () =>
  global.hadronApp.appRegistry.emit('refresh-data')
);
```

# Install

```shell
npm install hadron-ipc
```

# Related Content

- [Electron's ipcMain][ipc-main]
- [Electron's ipcRenderer][ipc-renderer]
- [Hadron App][hadron-app]
- [Hadron App Registry][hadron-app-registry]

[npm_img]: https://img.shields.io/npm/v/hadron-ipc.svg
[npm_url]: https://npmjs.org/package/hadron-ipc
[ipc-renderer]: https://electronjs.org/docs/api/ipc-renderer
[ipc-main]: https://electronjs.org/docs/api/ipc-mai://electronjs.org/docs/api/ipc-main
[hadron-app]: https://github.com/mongodb-js/hadron-app
[hadron-app-registry]: https://github.com/mongodb-js/hadron-app-registr://github.com/mongodb-js/hadron-app-registry
