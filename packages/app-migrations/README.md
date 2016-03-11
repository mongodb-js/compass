# app-migrations [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> A helper module to define and execute app schema migrations.

Run on every start of your application with the previous and current version.

Makes sure that the correct migration steps are executed in the right order and
that downgrades are only allowed if there hasn't been a migration between the
two versions.

app-migrations uses [semver](https://github.com/npm/node-semver) to determine
version order.

## Examples

##### Set up migrations

```javascript
// define your migrations functions, keyed to the version they were introduced at.
var migrations = {
  '1.0.4': function(previousVersion, currentVersion, done) {
    // introduced new "jetpack" feature which requires changes to the engine.
    // ... add code here ...
    done(null, 'upgraded engine to support jetpack.');
  },
  '1.0.9': function(previousVersion, currentVersion, done) {
    // added photon cannons for more fire power, but needed to deprecate
    // laser cannons instead.
    // ... add code here ...
    done(null, 'removed laser cannons, added photon cannons.');
  }
};

var migrate = require('app-migrations')(migrations);
```
On every new launch, run `migrate()` with previous and current version.

##### upgrade from 1.0.0 (got nothing) to 2.0.0 (need jetpack and photon cannons)

```javascript
migrate('1.0.0', '2.0.0', function(err, res) {
  if (err) return console.error('Error:', e.message);
  console.log('Success:', res);
});

// console output
// Success: { '1.0.4': 'upgraded engine to support jetpack.',
//  '1.0.9': 'removed laser cannons, added photon cannons.' }
```

##### upgrade from 1.0.5 (we already got jetpacks) to 1.1.4 (need photon cannon)
```javascript
migrate('1.0.5', '1.1.4', function(err, res) {
  if (err) return console.error('Error:', e.message);
  console.log('Success:', res);
});

// console output
// Success: { '1.0.9': 'removed laser cannons, added photon cannons.' }
```

##### upgrade from 1.0.4 to 1.0.4 (no changes needed)
```javascript
migrate('1.0.4', '1.0.4', function(err, res) {
  if (err) return console.error('Error:', e.message);
  console.log('Success:', res);
});

// console output
// Success: {}
```

##### downgrade from 1.0.8 to 1.0.6 (no internal changes, downgrade ok)
```javascript
migrate('1.0.8', '1.0.6', function(err, res) {
  if (err) return console.error('Error:', e.message);
  console.log('Success:', res);
});

// console output
// Success: {}
```

##### downgrade from 1.0.8 to 1.0.3 (incompatible due to internal changes)
```javascript
migrate('1.0.8', '1.0.3', function(err, res) {
  if (err) return console.error('Error:', e.message);
  console.log('Success:', res);
});

// console output
// Error: Downgrade from version 1.0.8 to 1.0.3 not possible.
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/migrations.svg
[travis_url]: https://travis-ci.org/mongodb-js/migrations
[npm_img]: https://img.shields.io/npm/v/migrations.svg
[npm_url]: https://npmjs.org/package/migrations
