# electron-squirrel-startup [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url] [![appveyor][appveyor_img]][appveyor_url]

> Default [Squirrel.Windows][squirrel] event handler for your [Electron][electron] apps.

## Installation

```
npm i electron-squirrel-startup
```

## Usage

To handle the most common commands, such as managing desktop shortcuts, just
add the following to the top of your `main.js` and you're good to go:

```js
if(require('electron-squirrel-startup')) return;
```
For Babel/ES6:

```js
const { app } = require('electron');
// ....
if(require('electron-squirrel-startup')) app.quit();
```

## Read More

### [Handling Squirrel Events][squirrel-events]
### [Squirrel.Windows Commands][squirrel-commands]

## License

Apache 2.0

[squirrel]: https://github.com/Squirrel/Squirrel.Windows
[electron]: https://github.com/atom/electron
[squirrel-commands]: https://github.com/Squirrel/Squirrel.Windows/blob/master/src/Update/Program.cs#L98
[squirrel-events]: https://github.com/atom/grunt-electron-installer#handling-squirrel-events
[appveyor_img]: https://ci.appveyor.com/api/projects/status/jljyvooqy91gbo7y?svg=true
[appveyor_url]: https://ci.appveyor.com/project/imlucas/electron-squirrel-startup
[travis_img]: https://img.shields.io/travis/mongodb-js/electron-squirrel-startup.svg
[travis_url]: https://travis-ci.org/mongodb-js/electron-squirrel-startup
[npm_img]: https://img.shields.io/npm/v/electron-squirrel-startup.svg
[npm_url]: https://npmjs.org/package/electron-squirrel-startup
