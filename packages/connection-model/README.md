# mongodb-connection-model [![][travis_img]][travis_url] [![][npm_img]][npm_url] [![][inch_img]][inch_url]

> MongoDB connection model.


## Installation

```
npm install --save mongodb-connection-model
```

## Usage

```javascript
const Connection = require('mongodb-connection-model');
const model = new Connection();
```

## Properties

MongoDB connection model is based on Ampersand.js framework and consist of [props](https://ampersandjs.com/docs/#ampersand-state-props) and [derived props](https://ampersandjs.com/docs/#ampersand-state-derived). The props object describes the observable properties of Ampersand state class.

```javascript
const model = new Connection();
const props = model.getAttributes({ props: true });
```

### General Properties

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `name` | String | User specified name | `My MongoDB` |
| `ns` | String | A valid [ns][ns] the user can read from | `undefined` |
| `isSrvRecord` | Boolean | Indicates SRV record | `false` |
| `auth` | Object | Authentication from driver (username, user, db, password) | `undefined` |
| `hostname` | String | Hostname of a MongoDB Instance. In case of replica set the first host and port will be taken | `localhost` |
| `port` | Number | TCP port of a MongoDB Instance | `27017` |
| `hosts` | Array | Contains all hosts and ports for replica set | `[{ host: 'localhost', port: 27017 }]` |
| `extraOptions` | Object | Extra options passed to the node driver as part of `driverOptions` | `{}` |
| `connectionType` | String | Possible values: `NODE_DRIVER`, `STITCH_ON_PREM`, `STITCH_ATLAS` | `NODE_DRIVER` |
| `authStrategy` | String | The desired authentication strategy. Possible values: `NONE`, `MONGODB`, `X509`, `KERBEROS`, `LDAP`, `SCRAM-SHA-256` | `NONE` |

### Connection string options

#### General connection string options

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `replicaSet` | String | Specifies the name of the replica set, if the mongod is a member of a replica set | `undefined` |
| `connectTimeoutMS` | Number | The time in milliseconds to attempt a connection before timing out | `undefined` |
| `socketTimeoutMS` | Number | The time in milliseconds to attempt a send or receive on a socket before the attempt times out | `undefined` |
| `compression` | Object | Comma-delimited string of compressors to enable network compression for communication between this client and a mongod/mongos instance | `undefined` |

#### Connection Pool Option

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `maxPoolSize` | Number | The maximum number of connections in the connection pool | `undefined` |
| `minPoolSize` | Number | The minimum number of connections in the connection pool | `undefined` |
| `maxIdleTimeMS` | Number | The maximum number of milliseconds that a connection can remain idle in the pool before being removed and closed | `undefined` |
| `waitQueueMultiple` | Number | A number that the driver multiples the maxPoolSize value to, to provide the maximum number of threads allowed to wait for a connection to become available from the pool | `undefined` |
| `waitQueueTimeoutMS` | Number | The maximum time in milliseconds that a thread can wait for a connection to become available | `undefined` |

#### Write Concern Options

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `w` | Number/String | Corresponds to the write concern [w Option](https://docs.mongodb.com/manual/reference/write-concern/#wc-w) | `undefined` |
| `wTimeoutMS` | Number | Corresponds to the write concern [wtimeout](https://docs.mongodb.com/manual/reference/write-concern/#wc-wtimeout) | `undefined` |
| `journal` | Boolean | Corresponds to the write concern [j Option](https://docs.mongodb.com/manual/reference/write-concern/#wc-j) | `undefined` |

#### Read Concern Options

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `readConcernLevel` | String | The level of isolation | `undefined` |

#### Read Preference Options

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `readPreference` | String | Specifies the read preferences for this connection. Possible values: `PRIMARY`, `PRIMARY_PREFERRED`, `SECONDARY`, `SECONDARY_PREFERRED`, `NEAREST` | `PRIMARY` |
| `maxStalenessSeconds` | Number | Specifies, in seconds, how stale a secondary can be before the client stops using it for read operations | `undefined` |
| `readPreferenceTags` | Object | Specifies a tag set | `undefined` |

#### Authentication Options

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `authSource` | String | Specify the database name associated with the user’s credentials | `undefined` |
| `authMechanism` | String | Specifies the authentication mechanism that MongoDB will use to authenticate the connection. Possible values: `DEFAULT`, `GSSAPI`, `MONGODB-X509`, `PLAIN`, `SCRAM-SHA-256` | `undefined` |
| `authMechanismProperties` | Object | Specifies properties for authMechanism | `undefined` |
| `gssapiServiceName` | String | Set the Kerberos service name when connecting to Kerberized MongoDB instances | `undefined` |
| `gssapiServiceRealm` | String | Set the Realm service name | `undefined` |
| `gssapiCanonicalizeHostName` | Boolean | Whether canonicalized hostname | `undefined` |

#### Server Selection and Discovery Options

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `localThresholdMS` | Number | The size (in milliseconds) of the latency window for selecting among multiple suitable MongoDB instances | `undefined` |
| `serverSelectionTimeoutMS` | Number | Specifies how long (in milliseconds) to block for server selection before throwing an exception | `undefined` |
| `serverSelectionTryOnce` | Boolean | Instructs the driver to scan the MongoDB deployment exactly once after server selection fails and then either select a server or raise an error | `undefined` |
| `heartbeatFrequencyMS` | Number | Controls when the driver checks the state of the MongoDB deployment | `undefined` |

#### Miscellaneous Configuration

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `appname` | String | An application name passed to server as client metadata | `undefined` |
| `retryWrites` | Boolean | Enable retryable writes | `undefined` |
| `uuidRepresentation` | String | Possible values: `standard`, `csharpLegacy`, `javaLegacy`, `pythonLegacy` | `undefined` |

### Stitch attributes

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `stitchServiceName` | String | Stitch service name | `undefined` |
| `stitchClientAppId` | String | Stitch сlient app ID | `undefined` |
| `stitchGroupId` | String | Stitch group ID | `undefined` |
| `stitchBaseUrl` | String | Stitch base Url | `undefined` |

### MONGODB authentication

```javascript
const model = new Connection({
  mongodbUsername: 'arlo',
  mongodbPassword: 'w@of'
});

console.log(model.driverUrl)
>>> 'mongodb://arlo:w%40of@localhost:27017/?slaveOk=true&authSource=admin'

console.log(model.driverOptions)
>>> {
  db: { readPreference: 'nearest' },
  replSet: { connectWithNoPrimary: true }
}
```

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `mongodbUsername` | String | MongoDB username | `undefined` |
| `mongodbPassword` | String | MongoDB password | `undefined` |
| `mongodbDatabaseName` | String | The database name associated with the user's credentials | `undefined` |
| `promoteValues` | Boolean | Whether BSON values should be promoted to their JS type counterparts | `undefined` |

### KERBEROS authentication

```javascript
const model = new Connection({
  kerberosServiceName: 'mongodb',
  kerberosPrincipal: 'arlo/dog@krb5.mongodb.parts',
  kerberosPassword: 'w@@f',
  ns: 'toys'
});

console.log(model.driverUrl)
>>> 'mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/toys?slaveOk=true&gssapiServiceName=mongodb&authMechanism=GSSAPI'

console.log(model.driverOptions)
>>> {
  db: { readPreference: 'nearest' },
  replSet: { connectWithNoPrimary: true }
}
```

> @note (imlucas): Kerberos on Windows is broken out as it's own state for UX consideration.

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `kerberosServiceName` | String | Any program or computer you access over a network | `undefined` |
| `kerberosPrincipal` | String | The format of a typical Kerberos V5 principal is primary/instance@REALM | `undefined` |
| `kerberosPassword` | String | You can optionally include a password for a kerberos connection | `undefined` |
| `kerberosCanonicalizeHostname` | Boolean | Whether canonicalized kerberos hostname | `undefined` |

#### See Also

- [node.js driver Kerberos reference](http://bit.ly/mongodb-node-driver-kerberos)
- [node.js driver Kerberos functional test][kerberos-functional]

### LDAP authentication

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `ldapUsername` | String | LDAP username | `undefined` |
| `ldapPassword` | String | LDAP password | `undefined` |

### X509 authentication

![][enterprise_img]

```javascript
const model = new Connection({
  x509Username: 'CN=client,OU=arlo,O=MongoDB,L=Philadelphia,ST=Pennsylvania,C=US'
});

console.log(model.driverUrl)
>>> 'mongodb://CN%253Dclient%252COU%253Darlo%252CO%253DMongoDB%252CL%253DPhiladelphia%252CST%253DPennsylvania%252CC%253DUS@localhost:27017?slaveOk=true&authMechanism=MONGODB-X509'

console.log(model.driverOptions)
>>> {
  db: { readPreference: 'nearest' },
  replSet: { connectWithNoPrimary: true }
}
```

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `x509Username` | String | The x.509 certificate derived user name, e.g. `CN=user,OU=OrgUnit,O=myOrg,...` | `undefined` |

#### See Also

- [node.js driver X509 reference](http://bit.ly/mongodb-node-driver-x509)
- [node.js driver X509 functional test][x509-functional]

### SSL

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `ssl` | Number/String | A boolean to enable or disables TLS/SSL for the connection | `undefined` |
| `sslType` | String | How to use SSL. Possible values: `NONE`, `SYSTEMCA`, `IFAVAILABLE`, `UNVALIDATED`, `SERVER`, `ALL` | `NONE` |
| `sslCA` | Buffer/String | Array of valid certificates | `undefined` |
| `sslCert` | Buffer/String | The certificate | `undefined` |
| `sslKey` | Buffer/String | The certificate private key | `undefined` |
| `sslPass` | Buffer/String | The certificate password | `undefined` |

### SSH TUNNEL

| Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `sshTunnel` | String | How to use SSH tunneling. Possible values: `NONE`, `USER_PASSWORD`, `IDENTITY_FILE` | `undefined` |
| `sshTunnelHostname` | String | The hostname of the SSH remote host | `undefined` |
| `sshTunnelPort` | Port | The SSH port of the remote host | `22` |
| `sshTunnelBindToLocalPort` | Port | Bind the localhost endpoint of the SSH Tunnel to this port | `undefined` |
| `sshTunnelUsername` | String | The optional SSH username for the remote host | `undefined` |
| `sshTunnelPassword` | String | The optional SSH password for the remote host | `undefined` |
| `sshTunnelIdentityFile` | String/Array | The optional path to the SSH identity file for the remote host | `undefined` |
| `sshTunnelPassphrase` | String | The optional passphrase for `sshTunnelIdentityFile` | `undefined` |

## Derived Properties

Derived properties (also known as computed properties) are properties of the state object that depend on other properties to determine their value.

```javascript
const model = new Connection();
const derivedProps = model.getAttributes({ derived: true });
```

| Derived Property | Type | Description | Default |
| ----- | ---- | ---------- |  ----  |
| `instanceId` | String | The mongoscope | `localhost:27017` |
| `driverAuthMechanism` | String | Converts the value of `authStrategy` for humans into the `authMechanism` value for the driver | `undefined` |
| `driverUrl` | String | The first argument `mongoscope-server` passes to `mongodb.connect` | `mongodb://localhost:27017/?slaveOk=true` |
| `driverOptions` | String | The second argument `mongoscope-server` passes to `mongodb.connect` | `{}` |


<a name="authentication-ldap"></a>
#### A6. LDAP

![][enterprise_img]

- `ldap_username` (**required**, String)
- `ldap_password` (**required**, String)

##### See Also

- [node.js driver LDAP reference](http://bit.ly/mongodb-node-driver-ldap)
- [node.js driver X509 functional test][ldap-functional]

```javascript
var c = new Connection({
 ldap_username: 'arlo',
 ldap_password: 'w@of',
 ns: 'toys'
});
console.log(c.driver_url)
>>> 'mongodb://arlo:w%40of@localhost:27017/toys?slaveOk=true&authMechanism=PLAIN'
console.log(c.driver_options)
>>> { db: { readPreference: 'nearest' },
  replSet: { connectWithNoPrimary: true } }
```

### Trait: SSL

> **Note**: Not to be confused with `authentication=X509`.

- `ssl` (optional, String) ... The desired ssl strategy [Default: `NONE`]
  - `SYSTEMCA` SSL required, validate using System CA, with host verification.
  - `IFAVAILABLE` Try SSL first and fall back to no SSL if unavailable, validate using System CA, no host verification.
  - `SERVER` Driver should validate Server certificate.
  - `ALL` Driver should validate Server certificate and present valid Certificate.
  - `NONE` No SSL. (Not recommended)
  - `UNVALIDATED` No validation of certificate chain. (**Very** not recommended)

#### SYSTEMCA

SSL required, validate using System CA, with host verification.

#### IFAVAILABLE

The driver should try SSL first, fall back to no SSL if unavailable, and use the system's Certificate Authority.

#### SERVER

The driver should validate the server certificate and fail to connect if validation fails.

See also [node.js driver "Validate Server Certificate" docs][driver-ssl-server].

#### ALL

The driver must present a valid certificate and validate the server certificate.

See also [node.js driver "Validate Server Certificate and Present Valid Certificate" docs][driver-ssl-all].

#### NONE

Do not use SSL for anything.

#### UNVALIDATED

Use SSL but do not perform any validation of the certificate chain.

See also [node.js driver "No Certificate Validation" docs][driver-ssl-none].

**Very** not recommended and likely to be deprecated in future releases because it exposes potential Man-In-The-Middle attack vectors.

##### See also

- [node.js driver SSL implementation][driver-ssl-impl]
- [node.js driver SSL tutorial][driver-ssl-tutorial]

### Trait: SSH Tunnel

> New in mongodb-connection-model@5.0.0

- `ssh_tunnel` (optional, String) ... The desired SSH tunnel strategy [Default: `NONE`]
  - `NONE` Do not use SSH tunneling.
  - `USER_PASSWORD` The tunnel is created with SSH username and password only.
  - `IDENTITY_FILE` The tunnel is created using an identity file.

Because [authentication](#authentication) is quite difficult for operators to migrate to, the most common method of securing a MongoDB deployment is to use an [SSH tunnel][sf-ssh-tunnel].  This allows operators to leverage their existing SSH security infrastructure to also provide secure access to MongoDB.  For a standard deployment of MongoDB on AWS, this is almost always to strategy.  Because of this, we now support creating SSH tunnels automatically when connecting to MongoDB.

```javascript
const connect = require('mongodb-connection-model').connect;
const options = {
  hostname: 'localhost',
  port: 27017,
  ssh_tunnel: 'IDENTITY_FILE',
  ssh_tunnel_hostname: 'ec2-11-111-111-111.compute-1.amazonaws.com',
  ssh_tunnel_username: 'ubuntu',
  ssh_tunnel_identity_file: ['/Users/albert/.ssh/my-key-aws-pair.pem']
};

connect(options, (err, db) => {
  if (err) {
    return console.log(err);
  }
  db.db('mongodb').collection('fanclub').count((err2, count) => {
    console.log('counted:', err2, count);
    db.close();
  });
});
```

The above provides the same functionality as creating the tunnel using the bash
command below and connecting to MongoDB via another terminal. Notice that
connection-model uses a random local port each time it creates a tunnel.
Using the command line, you'd have to replace `<random port>` with an actual
port number.

```bash
ssh -i ~/.ssh/my-key-aws-pair.pem -L <random port>:localhost:27017 ubuntu@ec2-11-111-111-111.compute-1.amazonaws.com
```

#### ST1. NONE

Do not use SSH tunneling. (Default)

#### ST2. USER_PASSWORD

The tunnel is created with SSH username and password only.

#### ST3. IDENTITY_FILE

The tunnel is created using an identity file.

## Events

### status

> New in mongodb-connection-model@5.0.0

#### Example: SSH Tunnel

```javascript
const connect = require('mongodb-connection-model').connect;
const options = {
  hostname: 'localhost',
  port: 27017,
  ssh_tunnel: 'IDENTITY_FILE',
  ssh_tunnel_hostname: 'ec2-11-111-111-111.compute-1.amazonaws.com',
  ssh_tunnel_username: 'ubuntu',
  ssh_tunnel_identity_file: ['/Users/albert/.ssh/my-key-aws-pair.pem']
};

connect(options).on('status', (evt) => console.log('status:', evt));
```

This will log the following events to the console:

```javascript
>>> status: { message: 'Validate', pending: true }
>>> status: { message: 'Validate', complete: true }
>>> status: { message: 'Load SSL files', pending: true }
>>> status: { message: 'Load SSL files', skipped: true,
  reason: 'The selected SSL mode does not need to load any files.' }
>>> status: { message: 'Create SSH Tunnel', pending: true }
>>> status: { message: 'Create SSH Tunnel', complete: true}
>>> status: { message: 'Connect to MongoDB', pending: true }
>>> status: { message: 'Connect to MongoDB', complete: true }
```

#### Example: SSL

```javascript
const connect = require('mongodb-connection-model').connect;
const options = {
  hostname: 'localhost',
  port: 27017,
  ssl: 'ALL',
  ssl_ca: '~/.ssl/my-ca.pem',
  ssl_certificate: '~/.ssl/my-server.pem',
  ssl_private_key: '~/.ssl/my-server.pem'
};

connect(options).on('status', (evt) => console.log('status:', evt));
```

This will log the following events to the console:

```javascript
>>> status: { message: 'Validate', pending: true }
>>> status: { message: 'Validate', complete: true }
>>> status: { message: 'Load SSL files', pending: true }
>>> status: { message: 'Load SSL files', complete: true}
>>> status: { message: 'Create SSH Tunnel', pending: true }
>>> status: { message: 'Create SSH Tunnel', skipped: true,
  reason: 'The selected SSH Tunnel mode is NONE.'}
>>> status: { message: 'Connect to MongoDB', pending: true }
>>> status: { message: 'Connect to MongoDB', complete: true }
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/connection-model.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/connection-model
[npm_img]: https://img.shields.io/npm/v/mongodb-connection-model.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-connection-model
[inch_img]: http://inch-ci.org/github/mongodb-js/connection-model.svg?branch=master
[inch_url]: http://inch-ci.org/github/mongodb-js/connection-model
[gitter_img]: https://badges.gitter.im/Join%20Chat.svg
[gitter_url]: http://gitter.im/mongodb-js/mongodb-js
[enterprise_img]: https://img.shields.io/badge/MongoDB-Enterprise-blue.svg?style=flat-square
[coming_soon_img]: https://img.shields.io/badge/-Coming%20Soon-ff69b4.svg?style=flat-square
[kerberos-functional]: https://github.com/mongodb/node-mongodb-native/blob/2.0/test/functional/kerberos_tests.js
[ldap-functional]: https://github.com/mongodb/node-mongodb-native/blob/2.0/test/functional/ldap_tests.js
[x509-functional]: https://github.com/mongodb/node-mongodb-native/blob/2.0/test/functional/ssl_x509_tests.js
[ns]: https://github.com/mongodb-js/ns
[sf-ssh-tunnel]: http://serverfault.com/questions/597765/how-to-connect-to-mongodb-server-via-ssh-tunnel
[ec2-key-pairs]: http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html
[driver-ssl-impl]: https://github.com/christkv/mongodb-core/blob/c3d21cb636d74d7a68134ecd3b9f6af536311279/lib/connection/connection.js#L365-L407
[driver-ssl-tutorial]: http://mongodb.github.io/node-mongodb-native/2.2/tutorials/connect/ssl/
[driver-ssl-none]: http://mongodb.github.io/node-mongodb-native/2.2/tutorials/connect/ssl/#no-certificate-validation
[driver-ssl-server]: http://mongodb.github.io/node-mongodb-native/2.2/tutorials/connect/ssl/#validate-server-certificate
[driver-ssl-all]: http://mongodb.github.io/node-mongodb-native/2.2/tutorials/connect/ssl/#validate-server-certificate-and-present-valid-certificate
