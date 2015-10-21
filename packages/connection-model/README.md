# mongodb-connection-model [![][travis_img]][travis_url] [![][npm_img]][npm_url]

> MongoDB connection model.


## Installation

```
npm install --save mongodb-connection-model
```

## Usage

```javascript
var Connection = require('mongodb-connection-model');
```

## Properties

- `hostname` (optional, String) ... Hostname of a MongoDB Instance [Default: `localhost`].
- `port` (optional, Number) ... TCP port of a MongoDB Instance [Default: `27017`].
- `name` (optional, String) ... User specified name [Default: `My MongoDB`].

## Derived Properties

- `instance_id` (String) ... The mongoscope `instance_id` [Default: `localhost:27017`].
- `driver_url` (String) ... The first argument `mongoscope-server` passes to `mongodb.connect` [Default: `mongodb://localhost:27017/?slaveOk=true`].
- `driver_options` (Object) ... The second argument `mongoscope-server` passes to `mongodb.connect` [Default: `{}`].


## Traits

It's useful to think of the remaining properties as two primary traits: `authentication` and `ssl`.

### Trait: Authentication

- `authentication` (optional, String) ... The desired authetication strategy [Default: `NONE`]
  - `NONE` Use no authentication.
  - `MONGODB` Allow the driver to auto-detect and select SCRAM-SHA-1 or MONGODB-CR depending on server capabilities.
  - `KERBEROS`
  - `X509`
  - `LDAP`

#### A1. No Authentication

```javascript
var model = new Connection({
  authentication: 'NONE'
});
console.log(model.driver_url);
>>> 'mongodb://localhost:27017?slaveOk=true'

console.log(new Connection().driver_url);
>>> 'mongodb://localhost:27017?slaveOk=true'
```

#### A2. MongoDB

- `mongodb_username` (**required**, String)
- `mongodb_password` (**required**, String)
- `mongodb_database_name` (optional, String) [Default: `admin`]

```javascript
var c = new Connection({
  mongodb_username: 'arlo',
  mongodb_password: 'w@of'
});
console.log(c.driver_url)
>>> 'mongodb://arlo:w%40of@localhost:27017?slaveOk=true&authSource=admin'
console.log(c.driver_options)
>>> { uri_decode_auth: true,
  db: { readPreference: 'nearest' },
  replSet: { connectWithNoPrimary: true } }
```

#### A3. Kerberos

![][enterprise_img]

- `kerberos_principal` (**required**, String) ... The format of a typical Kerberos V5 principal is `primary/instance@REALM`.
- `kerberos_password` (optional, String) ... [Default: `undefined`].
- `kerberos_service_name` (optional, String) ... [Default: `mongodb`].

[node.js driver Kerberos reference](http://bit.ly/mongodb-node-driver-kerberos)

```javascript
 var c = new Connection({
   kerberos_service_name: 'mongodb',
   kerberos_password: 'w@@f',
   kerberos_principal: 'arlo/dog@krb5.mongodb.parts'
 });
 console.log(c.driver_url)
 >>> 'mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/kerberos?slaveOk=true&gssapiServiceName=mongodb&authMechanism=GSSAPI'
 console.log(c.driver_options)
 >>> { uri_decode_auth: true,
   db: { readPreference: 'nearest' },
   replSet: { connectWithNoPrimary: true } }
```

#### A4. Kerberos on Windows

> @note (imlucas): Broken out as it's own state for UX consideration.

```javascript
var model = new Connection({
  kerberos_principal: 'arlo/admin@MONGODB.PARTS',
  kerberos_password: 'B@sil',
  kerberos_service_name: 'MongoDB'
});
console.log(model.driver_url);
>>> 'mongodb://arlo%252Fadmin%2540MONGODB.PARTS:B%40sil@localhost:27017/kerberos?slaveOk=true&gssapiServiceName=MongoDB&authMechanism=GSSAPI'
```

#### A5. X509

![][enterprise_img]

- `x509_username` (**required**, String) ... The x.509 certificate derived user name, e.g. `CN=user,OU=OrgUnit,O=myOrg,...`.

[node.js driver X509 reference](http://bit.ly/mongodb-node-driver-x509)

```javascript
var c = new Connection({
  x509_username: 'CN=client,OU=arlo,O=MongoDB,L=Philadelphia,ST=Pennsylvania,C=US'
});
console.log(c.driver_url)
>>> 'mongodb://CN%253Dclient%252COU%253Darlo%252CO%253DMongoDB%252CL%253DPhiladelphia%252CST%253DPennsylvania%252CC%253DUS@localhost:27017?slaveOk=true&authMechanism=MONGODB-X509'
console.log(c.driver_options)
>>> { uri_decode_auth: true,
db: { readPreference: 'nearest' },
replSet: { connectWithNoPrimary: true } }
```


#### A6. LDAP

![][enterprise_img]

- `ldap_username` (**required**, String)
- `ldap_password` (**required**, String)

[node.js driver LDAP reference](http://bit.ly/mongodb-node-driver-ldap)

```javascript
var c = new Connection({
 ldap_username: 'arlo',
 ldap_password: 'w@of'
});
console.log(c.driver_url)
>>> 'mongodb://arlo:w%40of@localhost:27017?slaveOk=true&authMechanism=PLAIN'
console.log(c.driver_options)
>>> { uri_decode_auth: true,
 db: { readPreference: 'nearest' },
 replSet: { connectWithNoPrimary: true } }
```

### Trait: SSL

> **Note**: Not to be confused with `authentication=X509`.

- `ssl` (optional, String) ... The desired ssl strategy [Default: `NONE`]
  - `NONE` No SSL.
  - `UNVALIDATED` No validation of certificate chain.
  - `SERVER` Driver should validate Server certificate.
  - `ALL` Driver should validate Server certificate and present valid Certificate.

#### S1. NONE

Do not use SSL for anything.

#### S2. UNVALIDATED

Use SSL but do not perform any validation of the certificate chain.

#### S3. SERVER

The driver should validate the server certificate and fail to connect if validation fails.

#### S4. ALL

The driver must present a valid certificate and validate the server certificate.


## Matrix

| authentication:ssl |  NONE  |  UNVALIDATED  | SERVER | ALL |
| :----------------- | :----- | :------------ | :----- | :-- |
| NONE               |        |               |        |     |
| MONGODB            |        |               |        |     |
| KERBEROS           |        |               |        |     |
| KERBEROS_WINDOWS   |        |               |        |     |
| X509               |        |               |        |     |
| LDAP               |        |               |        |     |


## Testing

```
npm test
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/mongodb-connection-model.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/mongodb-connection-model
[npm_img]: https://img.shields.io/npm/v/mongodb-connection-model.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-connection-model
[gitter_img]: https://badges.gitter.im/Join%20Chat.svg
[gitter_url]: http://gitter.im/mongodb-js/mongodb-js
[enterprise_img]: https://img.shields.io/badge/MongoDB-Enterprise-blue.svg?style=flat-square
[coming_soon_img]: https://img.shields.io/badge/-Coming%20Soon-ff69b4.svg?style=flat-square
