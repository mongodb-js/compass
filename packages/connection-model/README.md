# mongodb-connection-model  [![][npm_img]][npm_url]

*Not recommended for use. This package will be be updated or removed in COMPASS-5490*

## Usage

### Building URI

```javascript
const Connection = require('mongodb-connection-model');
const c = new Connection({ appname: 'My App Name' });

console.log(c.driverUrl)
>>> 'mongodb://localhost:27017/?readPreference=primary&appname=My%20App&ssl=false'
```

### Parsing URI

```javascript
const Connection = require('mongodb-connection-model');

Connection.from(
  'mongodb://someUsername:testPassword@localhost',
  (error, result) => {
    console.log(result);
    >>> `{
      hosts: [{ host: 'localhost', port: 27017 }],
      hostname: 'localhost',
      port: 27017,
      auth: {
        username: 'someUsername',
        password: 'testPassword',
        db: 'admin'
      },
      isSrvRecord: false,
      authStrategy: 'MONGODB',
      mongodbUsername: 'someUsername',
      mongodbPassword: 'testPassword',
      mongodbDatabaseName: 'admin',
      extraOptions: {},
      connectionType: 'NODE_DRIVER',
      readPreference: 'primary',
      kerberosCanonicalizeHostname: false,
      sslMethod: 'NONE',
      sshTunnel: 'NONE',
      sshTunnelPort: 22
    }`
  }
);
```

## Properties

MongoDB connection model is based on Ampersand.js framework and consist of [props](https://ampersandjs.com/docs/#ampersand-state-props) and [derived props](https://ampersandjs.com/docs/#ampersand-state-derived). The props object describes the observable properties that MongoDB connection model gets from the Node.js Driver API.

```javascript
const с = new Connection();
const props = с.getAttributes({ props: true });
```
## Derived Properties

Derived properties (also known as computed properties) are properties of the state object that depend on other properties to determine their value.

```javascript
const c = new Connection();
const derivedProps = c.getAttributes({ derived: true });
```

[npm_img]: https://img.shields.io/npm/v/mongodb-connection-model.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-connection-model