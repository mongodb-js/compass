# mongodb-data-service [![][travis_img]][travis_url] [![][npm_img]][npm_url]

> MongoDB Data Service: an API on top of (currently) the [MongoDB Node Driver][driver] and (some day) [mongodb-scope-client][scope-client].

## Installation

```
npm install --save mongodb-data-service
```

## Usage

### Instantiating the service.

```javascript
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');

var service = new DataService(new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'data-service'
}));
```

### Connecting to the server.

Once the service is ready, it will also emit a `readable` event.

```javascript
service.connect((err) => assert.equal(null, err)})
  .on('readable', () => console.log('Connected!'));
```

### API

```javascript
// Get information for a collection.
service.collection('database.collection', {}, (error, result) => {
  assert.equal(null, error);
});

// Get a document count.
service.count('database.collection', { a: 1 }, {}, (error, count) => {
  assert.equal(null, error);
});

// Get information for a database.
service.database('database', {}, (error, result) => {
  assert.equal(null, error);
});

// Find documents in a collection.
service.find('database.collection', { a: 1 }, {}, (error, documents) => {
  assert.equal(null, error);
});

// Get a result for a RESTful endpoint.
service.get('/collection/database.test', {}, (error, result) => {
  assert.equal(null, error);
});

// Get instance details.
service.instance({}, (error, result) => {
  assert.equal(null, error);
});

// Get a sample stream of documents from a collection.
service.sample('database.collection', {});
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/data-service.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/data-service
[npm_img]: https://img.shields.io/npm/v/mongodb-data-service.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-data-service
[scope-client]: https://github.com/mongodb-js/scope-client
[driver]: https://github.com/mongodb/node-mongodb-native
