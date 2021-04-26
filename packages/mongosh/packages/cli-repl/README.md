# @mongosh/cli-repl [![Build Status][azure-build-url]][azure-build]

[Evergreen Build][evergreen-url]

CLI interface for [MongoDB Shell][mongosh], an extension to Node.js REPL with MongoDB API.

## Usage
```shell
  $ mongosh [options] [db address]

  Options:

    -h, --help                                 Show this usage information
        --host [arg]                           Server to connect to
        --port [arg]                           Port to connect to
        --version                              Show version information
        --shell                                Run the shell after executing files
        --nodb                                 Don't connect to mongod on startup - no 'db address' [arg] expected
        --norc                                 Will not run the '.mongoshrc.js' file on start up
        --eval [arg]                           Evaluate javascript
        --retryWrites                          Automatically retry write operations upon transient network errors

  Authentication Options:

    -u, --username [arg]                       Username for authentication
    -p, --password [arg]                       Password for authentication
        --authenticationDatabase [arg]         User source (defaults to dbname)
        --authenticationMechanism [arg]        Authentication mechanism
        --awsIamSessionToken [arg]             AWS IAM Temporary Session Token ID

  TLS Options:

        --tls                                  Use TLS for all connections
        --tlsCertificateKeyFile [arg]          PEM certificate/key file for TLS
        --tlsCertificateKeyFilePassword [arg]  Password for key in PEM file for TLS
        --tlsCAFile [arg]                      Certificate Authority file for TLS
        --tlsAllowInvalidHostnames             Allow connections to servers with non-matching hostnames
        --tlsAllowInvalidCertificates          Allow connections to servers with invalid certificates
        --tlsCertificateSelector [arg]         TLS Certificate in system store (Windows and macOS only)
        --tlsDisabledProtocols [arg]           Comma separated list of TLS protocols to disable [TLS1_0,TLS1_1,TLS1_2]

  FLE Options:

        --awsAccessKeyId [arg]                 AWS Access Key for FLE Amazon KMS
        --awsSecretAccessKey [arg]             AWS Secret Key for FLE Amazon KMS
        --awsSessionToken [arg]                Optional AWS Session Token ID
        --keyVaultNamespace [arg]              database.collection to store encrypted FLE parameters
        --kmsURL [arg]                         Test parameter to override the URL of the KMS endpoint

  API version options:

        --apiVersion [arg]                     Specifies the API version to connect with
        --apiStrict                            Use strict API version mode
        --apiDeprecationErrors                 Fail deprecated commands for the specified API version

  DB Address Examples:

        foo                                    Foo database on local machine
        192.168.0.5/foo                        Foo database on 192.168.0.5 machine
        192.168.0.5:9999/foo                   Foo database on 192.168.0.5 machine on port 9999
        mongodb://192.168.0.5:9999/foo         Connection string URI can also be used

  File Names:

        A list of files to run. Files must end in .js and will exit after unless --shell is specified.

  Examples:

        Start mongosh using 'ships' database on specified connection string:
        $ mongosh mongodb://192.168.0.5:9999/ships

  For more information on usage: https://docs.mongodb.com/mongodb-shell.

```

### Log Format
CLI REPL listens to a few events via a message bus  that are then logged to
user's local log file in `~/.mongodb/mongosh/` in ndjson format using
[pino][pino-js].

### bus.on('mongosh:connect', connectEvent)
Where `connectionInfo` is an object with the following interface:
```ts
interface ConnectEvent {
  driverUri: string;
}
```
Used to log and send telemetry about connection information. Sensitive
information is stripped beforehand.

Example:
```js
bus.emit('mongosh:connect', {
  driverUri: 'mongodb://192.168.0.5:9999/ships'
})
```

### bus.on('mongosh:new-user', userID, enableTelemetry)
Where `userID` is a [BSON ObjectID][object-id] and `enableTelemetry` is a boolean flag.
This is used for telemetry tracking when the user initially uses mongosh.

Example:
```js
bus.emit('mongosh:new-user', '12394dfjvnaw3uw3erdf', true)
```

### bus.on('mongosh:update-user', id, enableTelemetry)
Where `userID` is a [BSON ObjectID][object-id] and `enableTelemetry` is a boolean flag.
This is used internally to update telemetry preferences and userID in the
logger.

Example:
```js
bus.emit('mongosh:update-user', '12394dfjvnaw3uw3erdf', false)
```

### bus.on('mongosh:error', error)
Where `error` is an [Error Object][error-object]. Used to log and send telemetry
about errors that are _thrown_.

Example:
```js
bus.emit('mongosh:error', new Error('Unable to show collections'))
```

### bus.on('mongosh:help')
Used when `help` command was used.

Example:
```js
bus.emit('mongosh:help')
```

### bus.on('mongosh:rewritten-async-input', inputInfo)
Used for internal debugging of async-rewriter. `inputInfo` is an object with the
following interface:
```ts
interface AsyncRewriterEvent {
  original: string;
  rewritten: string;
}
```

Example:
```js
bus.emit('mongosh:rewritten-async-input', {
  original: 'db.coll.find().forEach()',
  rewritten: 'await db.coll.find().forEach();'
})

```

### bus.on('mongosh:use', args)
Used for recording information about `use`. `args` has the following interface:

```ts
interface UseEvent {
  db: string;
}
```

Example:
```js
bus.emit('mongosh:use', { db: 'cats' })

```

### bus.on('mongosh:show', args)
Used for recording information about `show` command. `args` has the following
interface:

```ts
interface ShowEvent {
  method: string;
}
```

Example:
```js
bus.emit('mongosh:show', { method: 'dbs' })

```

### bus.on('mongosh:it')
Used for recording when `it` command was called.

Example:
```js
bus.emit('mongosh:it')

```
### bus.on('mongosh:api-call', args)
Used for recording information when API calls are made. `args` has the following
interface:
```ts
interface ApiEvent {
  method?: string;
  class?: string;
  db?: string;
  coll?: string;
  arguments?: ApiEventArguments;
}
```

```ts
interface ApiEventArguments {
  pipeline?: any[];
  query?: object;
  options?: object;
  filter?: object;
}
```

`arguments` may contain information about the API call. As a rule, we don't emit
information containing documents coming from API calls such as
`db.coll.insert()` or `db.coll.bulkWrite()` to keep cleaner logs.

`aggregate` Event Example:
```js
this.messageBus.emit('mongosh:api-call', {
  method: 'aggregate',
  class: 'Collection',
  db, coll, arguments: { options, pipeline }
});

```

`runCommand` Event Example:
```js
this.messageBus.emit('mongosh:api-call', {
  method: 'runCommand', class: 'Database', db, arguments: { cmd }
});

```

`createIndex` Event Example:
```js
this.messageBus.emit('mongosh:api-call', {
  method: 'createIndex',
  class: 'Collection',
  db, coll, arguments: { keys, options }
});
```


## Local Development


## Installation
```shell
npm install --save @mongosh/cli-repl
```

[mongosh]: https://github.com/mongodb-js/mongosh
[azure-build-url]: https://dev.azure.com/team-compass/mongosh/_apis/build/status/mongodb-js.mongosh?branchName=master
[azure-build]: https://dev.azure.com/team-compass/mongosh/_build/latest?definitionId=5&branchName=master
[evergreen-url]: https://evergreen.mongodb.com/waterfall/mongosh
[pino-js]: https://github.com/pinojs/pino
[object-id]: https://docs.mongodb.com/manual/reference/method/ObjectId/
[error-object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
