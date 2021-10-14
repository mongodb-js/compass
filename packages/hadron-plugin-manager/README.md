# @mongodb-js/hadron-plugin-manager [![][npm_img]][npm_url]

> Hadron Plugin Manager

## Installation

```
npm install --save @mongodb-js/hadron-plugin-manager
```

## Usage

```js
const pluginsPath = path.join(__dirname, 'plugins');
const intPluginsPath = path.join(__dirname, 'internal-plugins');
const PluginManager = require('@mongodb-js/hadron-plugin-manager');
const { AppRegistry } = require('hadron-app-registry');

const manager = new PluginManager(
  [ intPluginsPath, pluginsPath ],
  __dirname,
  ['external-plugins/example3']
);

const appRegistry = new AppRegistry();
manager.activate(appRegistry);
```

[npm_img]: https://img.shields.io/npm/v/@mongodb-js/hadron-plugin-manager.svg?style=flat-square
[npm_url]: https://www.npmjs.org/plugin/@mongodb-js/hadron-plugin-manager
