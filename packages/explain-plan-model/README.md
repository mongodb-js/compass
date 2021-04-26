# explain-plan-model [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

Ampersand model abstraction for MongoDB explain plans.


## Description

Parses the JSON output of the [explain cursor option in MongoDB][explain-docs],
which provides useful information about the query planning and execution stats.

Currently, this model only works on regular queries and not for the
Aggregation Framework.

## Example

Here is an example with the node.js driver to populate an explain
plan model for a given query:

```javascript

var MongoClient = require('mongodb').MongoClient;
var ExplainPlanModel = require('mongodb-explain-plan-model');

MongoClient.connect('mongodb://localhost:27018/mongodb', function(err, db) {
  db.collection('fanclub')
    .find({age: {$gte: 33, $lte: 40}})
    .explain(function(err2, explain) {
      var model = new ExplainPlanModel(explain, {parse: true});

      console.log(model.executionSuccess);      // ==> true
      console.log(model.isCovered);             // ==> false
      console.log(model.isCollectionScan);      // ==> false
      console.log(model.usedIndex);             // ==> "age_1"
      console.log(model.inMemorySort);          // ==> false
      console.log(model.nReturned);             // ==> 191665
      console.log(model.executionTimeMillis);   // ==> 146
      // ...

      db.close();
    });
});

```

## Stages

To access the raw information of any execution stage, you can use the
`.findStageByName()` method. This walks the tree of stage (depth-first,
pre-order) and returns the first stage matching the name (or `null` if
the stage is not present).

For example, to get information about the
`IXSCAN` stage, use:

```javascript

var ixscan = model.findStageByName('IXSCAN');
if (ixscan) {
  console.log('IXSCAN took', ixscan.executionTimeMillisEstimate, 'ms.');
} else {
  console.log('no IXSCAN stage found.');
}

```

## Supported Versions

This model works best with explain plan output from MongoDB 3.0 and higher,
but it does have a legacy mode and tries to infer the values from older formats.
However, depending on the explain plan, some fields may be `null` for older
formats.

If the explain plan is from an older (2.6 or below) version, the `legacyMode`
flag is set to true.


## License

Apache 2.0

[explain-docs]: https://docs.mongodb.org/manual/reference/method/cursor.explain/
[travis_img]: https://img.shields.io/travis/mongodb-js/explain-plan-model.svg
[travis_url]: https://travis-ci.org/mongodb-js/explain-plan-model
[npm_img]: https://img.shields.io/npm/v/explain-plan-model.svg
[npm_url]: https://npmjs.org/package/explain-plan-model
