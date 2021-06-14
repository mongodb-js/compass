# mongodb-data-service [![][workflow_img]][workflow_url] [![][npm_img]][npm_url] [![][dependabot_img]][dependabot_url]

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

var service = new DataService(
  new Connection({
    hostname: '127.0.0.1',
    port: 27018,
    ns: 'data-service'
  })
);
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

## Instance Details

### `collections`

```javascript
[
  {
    _id: 'admin.system.version',
    name: 'system.version',
    database: 'admin',
    readonly: false,
    collation: null,
    type: 'collection',
    view_on: undefined,
    pipeline: undefined
  },
  {
    _id: 'config.system.sessions',
    name: 'system.sessions',
    database: 'config',
    readonly: false,
    collation: null,
    type: 'collection',
    view_on: undefined,
    pipeline: undefined
  },
  {
    _id: 'data-service.test',
    name: 'test',
    database: 'data-service',
    readonly: false,
    collation: null,
    type: 'collection',
    view_on: undefined,
    pipeline: undefined
  },
  {
    _id: 'data-service.system.views',
    name: 'system.views',
    database: 'data-service',
    readonly: false,
    collation: null,
    type: 'collection',
    view_on: undefined,
    pipeline: undefined
  },
  {
    _id: 'data-service.myView',
    name: 'myView',
    database: 'data-service',
    readonly: true,
    collation: null,
    type: 'view',
    view_on: 'test',
    pipeline: [{ $project: { a: 0 } }]
  },
  {
    _id: 'local.startup_log',
    name: 'startup_log',
    database: 'local',
    readonly: false,
    collation: null,
    type: 'collection',
    view_on: undefined,
    pipeline: undefined
  }
];
```

## Contributing

### Running Tests

```bash
npm test
```

All tests in an electron renderer process thanks to [electron-mocha](https://npm.im/electron-mocha).

[workflow_img]: https://github.com/mongodb-js/data-service/workflows/Check%20and%20Test/badge.svg?event=push
[workflow_url]: https://github.com/mongodb-js/data-service/actions?query=workflow%3A%22Check+and+Test%22
[npm_img]: https://img.shields.io/npm/v/mongodb-data-service.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-data-service
[scope-client]: https://github.com/mongodb-js/scope-client
[driver]: https://github.com/mongodb/node-mongodb-native
[dependabot_img]: https://api.dependabot.com/badges/status?host=github&repo=mongodb-js/data-service
[dependabot_url]: https://app.dependabot.com/accounts/mongodb-js/repos/51536401
