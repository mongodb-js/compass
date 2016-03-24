# mongodb-index-model [![][npm_img]][npm_url] [![][travis_img]][travis_url]

MongoDB index model.

## Example

```javascript
var IndexModel = require('mongodb-index-model');

// e.g. from collection.getIndexes()
var indexDefs = [
  {
    'v': 1,
    'key': {
      '_id': 1
    },
    'name': '_id_',
    'ns': 'mongodb.fanclub'
  },
  {
    'v': 1,
    'key': {
      'last_login': -1
    },
    'name': 'last_login_-1',
    'ns': 'mongodb.fanclub'
  }
];

var indexes = new IndexModel(indexDefs, {parse: true});

// get index by `<namespace>.<name>`
indexes.get('mongodb.fanclub.last_login_-1').compound  // returns `false`

// get index by `<name>` (use `name` ampersand index)
indexes.get('_id_', 'name').unique // returns `true`
```

## Installation

```
npm install --save mongodb-index-model
```

## Testing

```
npm test
```

## License

Apache 2.0

[travis_img]: https://secure.travis-ci.org/mongodb-js/index-model.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/index-model
[npm_img]: https://img.shields.io/npm/v/mongodb-index-model.svg
[npm_url]: https://www.npmjs.org/package/mongodb-index-model
