# hadron-style-manager [![][travis_img]][travis_url] [![][npm_img]][npm_url]

Hadron Style Manager is a wrapper for the less cache.

## Installation

```
npm install --save hadron-style-manager
```

## Usage

```javascript
const StyleManager = require('hadron-style-manager');

const manager = new StyleManager(cachePath, resourcePath);
manager.use(document, 'index.less');
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-style-manager.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-style-manager
[npm_img]: https://img.shields.io/npm/v/hadron-style-manager.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-style-manager
