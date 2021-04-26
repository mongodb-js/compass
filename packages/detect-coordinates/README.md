# detect-coordinates [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Geo coordinates detection based on a mongodb-schema type.

This module exports a function which detects whether a [mongodb-schema][mongodb-schema]
type object represents geo coordinates, either as legacy coordinate pairs
(2-element array of long/lat coordinates) or a GeoJSON object.

It returns a zipped array of `[[lng, lat], [lng, lat], ...]` coordinates, or
`false` if no coordinates could be found.

## Example

For this example, you need the `mongodb` node driver, `mongodb-schema` and
`lodash` modules installed in addition to this module:

```
npm install mongodb mongodb-schema detect-coordinates lodash
```

This code connects to a MongoDB server, gets the schema of a collection
and looks at the first type of the first field to determine if it has
coordinates.

```javascript
var parseSchema = require('mongodb-schema');
var connect = require('mongodb');
var detect = require('detect-coordinates');
var _ = require('lodash');

// connect to a MongoDB instance
connect('mongodb://localhost:27017/test', function(err, db){
  if(err) return console.error(err);

  // get the schema of the collection `test.users` (only first 100 docs)
  parseSchema('test.users', db.collection('users').find().limit(100), function(err, schema){
    if(err) return console.error(err);

    // serialize the schema and extract first type of field "last_position"
    var plainSchema = schema.serialize();
    var type = _.find(plainSchema.fields, ['name', 'last_position']).types[0];

    // check if that type represents geo coordinates
    var coordinates = detect(type);
    if (coordinates) {
      console.log('type contains coordinates, here they are:\n', coordinates);
    } else {
      console.log('type does not contain coordinates!');
    }
    db.close();
  });
});
```

This outputs:

```
type contains coordinates, here they are:
[ [ -73.98808416, 40.74854862 ],
  [ -74.015756, 40.711512 ],
  [ -74.0026376103, 40.7390169121 ],
  [ -74.015756, 40.711512 ],
  [ -73.96525063, 40.71044554 ],
  ...
```

## License

Apache 2.0

[mongodb-schema]: https://github.com/mongodb-js/mongodb-schema
[travis_img]: https://img.shields.io/travis/mongodb-js/detect-coordinates.svg
[travis_url]: https://travis-ci.org/mongodb-js/detect-coordinates
[npm_img]: https://img.shields.io/npm/v/detect-coordinates.svg
[npm_url]: https://npmjs.org/package/detect-coordinates
