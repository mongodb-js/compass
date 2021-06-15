# hadron-style-manager [![][npm_img]][npm_url]

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

[npm_img]: https://img.shields.io/npm/v/hadron-style-manager.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-style-manager
