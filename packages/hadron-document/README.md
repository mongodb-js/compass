# hadron-document [![][npm_img]][npm_url]

Hadron Document is a wrapper for javascript objects that represent documents
in a database intended for use with React components. It provides element
(key/value pair) level dirty tracking with the ability to add, edit, delete
and revert changes to elements directly.

## Installation

```
npm install --save hadron-document
```

## Usage

```javascript
'use strict';

const { Document } = require('hadron-document');

var object = {
  _id: 'aphex-twin',
  name: 'Aphex Twin',
  locations: ['London'],
  emails: {
    home: 'home@aphextwin.com',
    work: 'work@aphextwin.com',
  },
};

var doc = new Document(object);
```

[npm_img]: https://img.shields.io/npm/v/hadron-document.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-document
