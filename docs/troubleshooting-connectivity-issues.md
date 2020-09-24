# Troubleshooting connectivity issues

What follows are instructions to debug connectivity issues in Compass.

## Usage

1. Open `DevTools` in compass (`View` -> `Toggle Devtools`).
2. Copy/paste the content of the [Connectivity Tests Script](connectivity-tests.js) below in the `DevTools` console.
3. Run one of the available test, ie. `connectivityTests.testNativeDriverUri('mongodb://localhost:27017')`.
4. Wait for the test to print `"Done. Test succeeded."`. If that message is not printed the connection was not established correctly.

### Available tests

#### `testConnectionModelUri(connectionString)`

Tests the connection simulating the process happening in Compass when connecting with a connection string.

##### Usage & Examples

``` js
connectivityTests.testConnectionModelUri('mongodb://localhost:27017')`;
```

#### `testConnectionModelAttributes(attributes)`

Tests the connection simulating the process happening in Compass when connecting with form parameters.

##### Usage & Examples

Basic standalone server:

``` js
connectivityTests.testConnectionModelAttributes({
  "isSrvRecord": false,
  "hostname": "localhost",
  "port": 27017,
  "hosts": [
    {
      "host": "localhost",
      "port": 27017
    }
  ],
  "authStrategy": "NONE"
})`;
```

Kerberos:

``` js
connectivityTests.testConnectionModelAttributes({
  "isSrvRecord": false,
  "hostname": "<server hostname>",
  "port": <server port>,
  "hosts": [
    {
      "host": "<server hostname>",
      "port": <server port>
    }
  ],
  "authStrategy": "KERBEROS",
  "kerberosServiceName": "<kerberos service name>",
  "kerberosPrincipal": "<kerberos principal>",
  "kerberosCanonicalizeHostname": false
});
```

LDAP:

``` js
connectivityTests.testConnectionModelAttributes({
  "isSrvRecord": false,
  "hostname": "<server hostname>",
  "port": <server port>,
  "hosts": [
    {
      "host": "<server hostname>",
      "port": <server port>
    }
  ],
  "authStrategy": "LDAP",
  "ldapUsername": "<ldap username>",
  "ldapPassword": "<ldap password>"
});
```

#### `testNativeDriverUri(connectionString, driverOptions)`

Tests the connection using the same node.js driver and default options as the Compass does. Default driver options are:

``` js
{
  connectWithNoPrimary: true,
  readPreference: "primary",
  useNewUrlParser: true,
  useUnifiedTopology: true
}
```

##### Usage & Examples

``` js
connectivityTests.testNativeDriverUri('mongodb://localhost:27017')`;
```

Overriding driver options:

``` js
connectivityTests.testNativeDriverUri('mongodb://localhost:27017', { useUnifiedTopology: false })`;
```
