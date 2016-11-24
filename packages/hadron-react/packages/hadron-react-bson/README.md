# hadron-react-bson [![][travis_img]][travis_url] [![][npm_img]][npm_url]

> Hadron React Components for BSON values

### Usage

Use the `getComponent` method to return the correct component for the
provided BSON type.

```javascript
const React = require('react');
const getComponent = require('hadron-react-bson');
const component = getComponent('String');

React.createElement(component, { type: 'String', value: 'testing' });
```

Require components directly. Note that if a BSON type does not have a
specific component, it will be handled by the generic `Value` component
which calls `toString` on the object.

```javascript
const {
  BinaryValue,
  CodeValue,
  DateValue,
  Value,
  DoubleValue,
  Int32Value,
  KeyValue,
  RegexValue
} = require('hadron-react-bson');
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-react.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-react
[npm_img]: https://img.shields.io/npm/v/hadron-react-bson.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-react-bson
