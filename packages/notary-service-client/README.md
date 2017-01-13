# mongodb-notary-service-client [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> A client for our notary-service (an API for codesigning).

## Example

```javascript
process.env.NOTARY_URL="${url}";
process.env.NOTARY_AUTH_TOKEN="${token}";
process.env.NOTARY_SIGNING_KEY="${key_name}";

const sign = require('mongodb-notary-service-client');
sign('my-app.rpm').then((signed) => {
  if (signed) console.log('my-app.rpm has been signed and rewritten in-place');
});
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/notary-service-client.svg
[travis_url]: https://travis-ci.org/mongodb-js/notary-service-client
[npm_img]: https://img.shields.io/npm/v/mongodb-notary-service-client.svg
[npm_url]: https://npmjs.org/package/mongodb-notary-service-client
