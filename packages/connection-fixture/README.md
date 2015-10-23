# mongodb-connection-fixture [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Fixture data used by [mongodb-connection-model][mongodb-connection-model] for testing.

## Example

```javascript
var _ = require('lodash');
var data = require('mongodb-connection-fixture');
var Connection = require('mongodb-connection-model');

console.log(new Connection(data.KERBEROS));
console.log(new Connection(data.LDAP));
console.log(new Connection(data.X509));

// Compass currently supports a test matrix of the MongoDB dimensions:
//
// 1. auth
// 2. ssl
// 3. deployment_type
// 4. version
// 5. instance_type
_.each(data.INSTANCES, function(instance){
  var options = _.clone(instance);
  _.each(data.MONGODB, function(creds){
    _.extend(options, creds);
    console.log(new Connection(options));
  });
});

// This is precomputed for ease of use
console.log(data.MATRIX);
```

```bash
travis encrypt MONGODB_PASSWORD_INTEGRATIONS='<users_password>' --add;
travis encrypt MONGODB_PASSWORD_COMPASS='<users_password>' --add;
travis encrypt MONGODB_PASSWORD_FANCLUB='<users_password>' --add;
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/connection-fixture.svg
[travis_url]: https://travis-ci.org/mongodb-js/connection-fixture
[npm_img]: https://img.shields.io/npm/v/mongodb-connection-fixture.svg
[npm_url]: https://npmjs.org/package/mongodb-connection-fixture
[mongodb-connection-model]: https://github.com/mongodb-js/mongodb-connection-model
