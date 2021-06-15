# hadron-compile-cache [![][npm_img]][npm_url]

> Hadron Compile Cache

## Installation

```
npm install --save hadron-compile-cache
```

## Usage

```javascript
'use strict';

const path = require('path');
const CompileCache = require('hadron-compile-cache');
const home = path.join('path', 'to', 'my', 'root');

CompileCache.setHomeDirectory(home);

require('mysource.jsx'); // Will be hooked into the cache.
```

[npm_img]: https://img.shields.io/npm/v/hadron-compile-cache.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-compile-cache
