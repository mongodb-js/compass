# mongodb-connection-fixture [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Fixture data used by [mongodb-connection-model][mongodb-connection-model] for testing.

## Example

```javascript
var fixtures = require('mongodb-connection-fixture').MATRIX;
var connect = require('mongodb-connection-model').connect;
var format = require('util').format;

if (fixtures.length === 0) {
  describe(format('Connect to %d instances in the cloud #slow', fixtures.length), function() {
    it.skip('please see https://github.com/mongodb-js/connection-fixture');
  });
} else {
  describe(format('Connect to %d instances in the cloud #slow', fixtures.length), function() {
    fixtures.map(function(model) {
      if (process.env.dry) {
        it(format('should connect to `%s`', model.name));
      } else {
        it(format('should connect to `%s`', model.name), function(done) {
          this.slow(5000);
          this.timeout(10000);
          connect(model, done);
        });
      }
    });
  });
}

```

## Configuration

The `mongodb-connection-fixture` module is configurable via
environment variables which will automatically control the values
returned when running `require('mongodb-connection-fixture').MATRIX`.

The best way to explain is by using our mocha example above.  So first,
clone this repo and install dependecies:

```
git clone git@github.com:mongodb-js/connection-fixture.git ~/mongodb/connection-fixture;
cd ~/mongodb/connection-fixture && npm install;
```

Now if we just `npm run example`, we'll see the following:

```bash
Connect to 0 instances in the cloud #slow
  - please see https://github.com/mongodb-js/connection-fixture


0 passing (5ms)
1 pending
```

0 functional tests isn't so good... Fortunately, there are 4 environment variables
we can use to make this > 0:

- `MONGODB_KERBEROS`
- `MONGODB_KERBEROS_PASSWORD`
- `MONGODB_LDAP_PASSWORD`
- `MONGODB_PASSWORD_INTEGRATIONS`
- `MONGODB_PASSWORD_COMPASS`
- `MONGODB_PASSWORD_FANCLUB`

```bash
MONGODB_KERBEROS=1 npm run example;
```

```
Connect to 1 instances in the cloud #slow
  - should connect to `Enterprise: Kerberos (evergreen only)`


0 passing (8ms)
1 pending
```

```bash
MONGODB_KERBEROS=1 MONGODB_KERBEROS_PASSWORD=arlo npm run example;
```

```
Connect to 2 instances in the cloud #slow
  - should connect to `Enterprise: Kerberos (evergreen only)`
  - should connect to `Enterprise: Kerberos w/ password (evergreen only)`


0 passing (7ms)
2 pending
```

```bash
MONGODB_KERBEROS=1 MONGODB_KERBEROS_PASSWORD=arlo MONGODB_LDAP_PASSWORD=basil npm run example;
```

```
Connect to 3 instances in the cloud #slow
  - should connect to `Enterprise: LDAP (evergreen only)`
  - should connect to `Enterprise: Kerberos (evergreen only)`
  - should connect to `Enterprise: Kerberos w/ password (evergreen only)`


0 passing (6ms)
3 pending
```

```bash
MONGODB_PASSWORD_INTEGRATIONS=foo npm run example;
```

```
  Connect to 21 instances in the cloud #slow
    - should connect to `🔒  integrations@3.0 Standalone: Store 1`
    - should connect to `🔒  integrations@2.6 Standalone: Store 1`
    - should connect to `🔒  integrations@3.0 Replicaset: Store 1`
    - should connect to `🔒  integrations@3.0 Replicaset: Store 2`
    - should connect to `🔒  integrations@3.0 Replicaset: Store 3`
    - should connect to `🔒  integrations@3.0 Cluster: Router 1`
    - should connect to `🔒  integrations@3.0 Cluster: Router 2`
    - should connect to `🔒  integrations@3.0 Cluster: Router 3`
    - should connect to `🔒  integrations@3.0 Cluster: Config 1`
    - should connect to `🔒  integrations@3.0 Cluster: Config 2`
    - should connect to `🔒  integrations@3.0 Cluster: Config 3`
    - should connect to `🔒  integrations@3.0 Cluster: Store 1`
    - should connect to `🔒  integrations@3.0 Cluster: Store 2`
    - should connect to `🔒  integrations@3.0 Cluster: Store 3`
    - should connect to `🔒  integrations@2.6 Cluster: Router 1`
    - should connect to `🔒  integrations@2.6 Cluster: Store 1`
    - should connect to `🔒  integrations@2.6 Cluster: Store 2`
    - should connect to `🔒  integrations@2.6 Cluster: Store 3`
    - should connect to `🔒  integrations@2.6 Cluster: Config 1`
    - should connect to `🔒  integrations@2.6 Cluster: Config 2`
    - should connect to `🔒  integrations@2.6 Cluster: Config 3`


  0 passing (6ms)
  21 pending
```

```bash
MONGODB_PASSWORD_INTEGRATIONS=foo MONGODB_PASSWORD_COMPASS=bar npm run example
```

```
  Connect to 42 instances in the cloud #slow
    - should connect to `🔒  integrations@3.0 Standalone: Store 1`
    - should connect to `🔒  integrations@2.6 Standalone: Store 1`
    - should connect to `🔒  integrations@3.0 Replicaset: Store 1`
    - should connect to `🔒  integrations@3.0 Replicaset: Store 2`
    - should connect to `🔒  integrations@3.0 Replicaset: Store 3`
    - should connect to `🔒  integrations@3.0 Cluster: Router 1`
    - should connect to `🔒  integrations@3.0 Cluster: Router 2`
    - should connect to `🔒  integrations@3.0 Cluster: Router 3`
    - should connect to `🔒  integrations@3.0 Cluster: Config 1`
    - should connect to `🔒  integrations@3.0 Cluster: Config 2`
    - should connect to `🔒  integrations@3.0 Cluster: Config 3`
    - should connect to `🔒  integrations@3.0 Cluster: Store 1`
    - should connect to `🔒  integrations@3.0 Cluster: Store 2`
    - should connect to `🔒  integrations@3.0 Cluster: Store 3`
    - should connect to `🔒  integrations@2.6 Cluster: Router 1`
    - should connect to `🔒  integrations@2.6 Cluster: Store 1`
    - should connect to `🔒  integrations@2.6 Cluster: Store 2`
    - should connect to `🔒  integrations@2.6 Cluster: Store 3`
    - should connect to `🔒  integrations@2.6 Cluster: Config 1`
    - should connect to `🔒  integrations@2.6 Cluster: Config 2`
    - should connect to `🔒  integrations@2.6 Cluster: Config 3`
    - should connect to `🔒  compass@3.0 Standalone: Store 1`
    - should connect to `🔒  compass@2.6 Standalone: Store 1`
    - should connect to `🔒  compass@3.0 Replicaset: Store 1`
    - should connect to `🔒  compass@3.0 Replicaset: Store 2`
    - should connect to `🔒  compass@3.0 Replicaset: Store 3`
    - should connect to `🔒  compass@3.0 Cluster: Router 1`
    - should connect to `🔒  compass@3.0 Cluster: Router 2`
    - should connect to `🔒  compass@3.0 Cluster: Router 3`
    - should connect to `🔒  compass@3.0 Cluster: Config 1`
    - should connect to `🔒  compass@3.0 Cluster: Config 2`
    - should connect to `🔒  compass@3.0 Cluster: Config 3`
    - should connect to `🔒  compass@3.0 Cluster: Store 1`
    - should connect to `🔒  compass@3.0 Cluster: Store 2`
    - should connect to `🔒  compass@3.0 Cluster: Store 3`
    - should connect to `🔒  compass@2.6 Cluster: Router 1`
    - should connect to `🔒  compass@2.6 Cluster: Store 1`
    - should connect to `🔒  compass@2.6 Cluster: Store 2`
    - should connect to `🔒  compass@2.6 Cluster: Store 3`
    - should connect to `🔒  compass@2.6 Cluster: Config 1`
    - should connect to `🔒  compass@2.6 Cluster: Config 2`
    - should connect to `🔒  compass@2.6 Cluster: Config 3`


  0 passing (8ms)
  42 pending
```

```
MONGODB_PASSWORD_INTEGRATIONS=foo MONGODB_PASSWORD_COMPASS=bar MONGODB_PASSWORD_FANCLUB=baz npm run example
```

```
Connect to 63 instances in the cloud #slow
  - should connect to `🔒  integrations@3.0 Standalone: Store 1`
  - should connect to `🔒  integrations@2.6 Standalone: Store 1`
  - should connect to `🔒  integrations@3.0 Replicaset: Store 1`
  - should connect to `🔒  integrations@3.0 Replicaset: Store 2`
  - should connect to `🔒  integrations@3.0 Replicaset: Store 3`
  - should connect to `🔒  integrations@3.0 Cluster: Router 1`
  - should connect to `🔒  integrations@3.0 Cluster: Router 2`
  - should connect to `🔒  integrations@3.0 Cluster: Router 3`
  - should connect to `🔒  integrations@3.0 Cluster: Config 1`
  - should connect to `🔒  integrations@3.0 Cluster: Config 2`
  - should connect to `🔒  integrations@3.0 Cluster: Config 3`
  - should connect to `🔒  integrations@3.0 Cluster: Store 1`
  - should connect to `🔒  integrations@3.0 Cluster: Store 2`
  - should connect to `🔒  integrations@3.0 Cluster: Store 3`
  - should connect to `🔒  integrations@2.6 Cluster: Router 1`
  - should connect to `🔒  integrations@2.6 Cluster: Store 1`
  - should connect to `🔒  integrations@2.6 Cluster: Store 2`
  - should connect to `🔒  integrations@2.6 Cluster: Store 3`
  - should connect to `🔒  integrations@2.6 Cluster: Config 1`
  - should connect to `🔒  integrations@2.6 Cluster: Config 2`
  - should connect to `🔒  integrations@2.6 Cluster: Config 3`
  - should connect to `🔒  compass@3.0 Standalone: Store 1`
  - should connect to `🔒  compass@2.6 Standalone: Store 1`
  - should connect to `🔒  compass@3.0 Replicaset: Store 1`
  - should connect to `🔒  compass@3.0 Replicaset: Store 2`
  - should connect to `🔒  compass@3.0 Replicaset: Store 3`
  - should connect to `🔒  compass@3.0 Cluster: Router 1`
  - should connect to `🔒  compass@3.0 Cluster: Router 2`
  - should connect to `🔒  compass@3.0 Cluster: Router 3`
  - should connect to `🔒  compass@3.0 Cluster: Config 1`
  - should connect to `🔒  compass@3.0 Cluster: Config 2`
  - should connect to `🔒  compass@3.0 Cluster: Config 3`
  - should connect to `🔒  compass@3.0 Cluster: Store 1`
  - should connect to `🔒  compass@3.0 Cluster: Store 2`
  - should connect to `🔒  compass@3.0 Cluster: Store 3`
  - should connect to `🔒  compass@2.6 Cluster: Router 1`
  - should connect to `🔒  compass@2.6 Cluster: Store 1`
  - should connect to `🔒  compass@2.6 Cluster: Store 2`
  - should connect to `🔒  compass@2.6 Cluster: Store 3`
  - should connect to `🔒  compass@2.6 Cluster: Config 1`
  - should connect to `🔒  compass@2.6 Cluster: Config 2`
  - should connect to `🔒  compass@2.6 Cluster: Config 3`
  - should connect to `🔒  fanclub@3.0 Standalone: Store 1`
  - should connect to `🔒  fanclub@2.6 Standalone: Store 1`
  - should connect to `🔒  fanclub@3.0 Replicaset: Store 1`
  - should connect to `🔒  fanclub@3.0 Replicaset: Store 2`
  - should connect to `🔒  fanclub@3.0 Replicaset: Store 3`
  - should connect to `🔒  fanclub@3.0 Cluster: Router 1`
  - should connect to `🔒  fanclub@3.0 Cluster: Router 2`
  - should connect to `🔒  fanclub@3.0 Cluster: Router 3`
  - should connect to `🔒  fanclub@3.0 Cluster: Config 1`
  - should connect to `🔒  fanclub@3.0 Cluster: Config 2`
  - should connect to `🔒  fanclub@3.0 Cluster: Config 3`
  - should connect to `🔒  fanclub@3.0 Cluster: Store 1`
  - should connect to `🔒  fanclub@3.0 Cluster: Store 2`
  - should connect to `🔒  fanclub@3.0 Cluster: Store 3`
  - should connect to `🔒  fanclub@2.6 Cluster: Router 1`
  - should connect to `🔒  fanclub@2.6 Cluster: Store 1`
  - should connect to `🔒  fanclub@2.6 Cluster: Store 2`
  - should connect to `🔒  fanclub@2.6 Cluster: Store 3`
  - should connect to `🔒  fanclub@2.6 Cluster: Config 1`
  - should connect to `🔒  fanclub@2.6 Cluster: Config 2`
  - should connect to `🔒  fanclub@2.6 Cluster: Config 3`


0 passing (9ms)
63 pending
```

### TravisCI

```bash
# Enable any functional tests in this project for the following cloud manager users
travis encrypt MONGODB_PASSWORD_INTEGRATIONS='<users_password>' --add;
travis encrypt MONGODB_PASSWORD_COMPASS='<users_password>' --add;
travis encrypt MONGODB_PASSWORD_FANCLUB='<users_password>' --add;
```

See the [cloud-stage doc on google drive][cloud-stage gdocs] for password values.

### Evergreen

```bash
# Enable any functional tests in this project for Kerberos or LDAP
EVERGREEN=1;
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/connection-fixture.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/connection-fixture
[npm_img]: https://img.shields.io/npm/v/mongodb-connection-fixture.svg?style=flat-square
[npm_url]: https://npmjs.org/package/mongodb-connection-fixture
[mongodb-connection-model]: https://github.com/mongodb-js/connection-model
[cloud-stage gdocs]: https://docs.google.com/document/d/1AAtov0WhQNC7TcuIkzCl5taZb840iFDf3rJnji74_pU/edit#
