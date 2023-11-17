# @mongodb-js/mongodb-notary-service-client [![npm][npm_img]][npm_url]

> A client for our notary-service (an API for codesigning).

## Example

### API


```javascript
process.env.NOTARY_URL="${url}";
process.env.NOTARY_AUTH_TOKEN="${token}";
process.env.NOTARY_SIGNING_KEY="${key_name}";

const sign = require('@mongodb-js/mongodb-notary-service-client');
sign('my-app.rpm').then((signed) => {
  if (signed) console.log('my-app.rpm has been signed and rewritten in-place');
});
```

[npm_img]: https://img.shields.io/npm/v/@mongodb-js/mongodb-notary-service-client.svg
[npm_url]: https://npmjs.org/package/@mongodb-js/mongodb-notary-service-client
