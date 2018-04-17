# BSON-Compilers
Transpilers for building BSON documents in any language.
## Authors
Anna Herlihy (herlihyap@gmail.com)

Alena Khineika (alena.khineika@mongodb.com)

Irina Shestak (shestak.irina@gmail.com)

## App Start

* `$ npm run compile`

## Usage
```
const compiler = require('bson-compilers');

const input = 'javascript';
const output = 'java';
compiler[input][output]("some code in js to compile to java");
// or
compiler.javascript.java("some code in js to compile to java");
```