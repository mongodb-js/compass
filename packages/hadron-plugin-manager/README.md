# hadron-package-manager [![][travis_img]][travis_url] [![][npm_img]][npm_url]

> Hadron Package Manager

## Installation

```
npm install --save hadron-package-manager
```

## Usage

```js
const packagesPath = path.join(__dirname, 'packages');
const intPackagesPath = path.join(__dirname, 'internal-packages');
const PackageManager = require('hadron-package-manager');
const AppRegistry = require('hadron-app-registry');

const manager = new PackageManager(
  [ intPackagesPath, packagesPath ],
  __dirname,
  ['external-packages/example3']
);

const appRegistry = new AppRegistry();
manager.activate(appRegistry);
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-package-manager.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-package-manager
[npm_img]: https://img.shields.io/npm/v/hadron-package-manager.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-package-manager
