# Aggregation Builder Examples

These are a base set of example aggregation's from @terakilobyte used in his M121 agg framework university course. These provide canonical, real-world references of various complexity for us to design/test against. The underlying source datasets are in Atlas and connected to a Stitch app (see [`examples/data-service-provider.js`](https://github.com/mongodb-js/compass-aggregations/blob/master/examples/data-service-provider.js)).

## Examples

### Basic

[`example-basic.js`](https://github.com/mongodb-js/compass-aggregations/blob/master/examples/example-basic.js) is a simple `$match` and `$count`.

[View in storybook](https://mongodb-js.github.io/compass-aggregations/?path=/story/examples--basic)

### Array Stats

[`example-array-stats.js`](https://github.com/mongodb-js/compass-aggregations/blob/master/examples/example-array-stats.js) uses `$project` of accumulators to generate summary statistics 

[View in storybook](https://mongodb-js.github.io/compass-aggregations/?path=/story/examples--array-stats)

### Grouped Stats

[`example-grouped-stats.js`](https://github.com/mongodb-js/compass-aggregations/blob/master/examples/example-grouped-stats.js) uses `$match` and `$group` to achieve the same goal as `example-array-stats.js`

[View in storybook](https://mongodb-js.github.io/compass-aggregations/?path=/story/examples--grouped-stats)

### Schema Checker

[`example-complex.js`](https://github.com/mongodb-js/compass-aggregations/blob/master/examples/example-schema-checker.js) uses `$lookup` and more to sanity check mistyped names or bad references.

[View in storybook](https://mongodb-js.github.io/compass-aggregations/?path=/story/examples--schema-chcker)

### Pearson's rho

[`example-pearsons-rho.js`](https://github.com/mongodb-js/compass-aggregations/blob/master/examples/example-pearsons-rho.js) calculates [the correlation co-efficient of two fields using Pearsons Rho](http://ilearnasigoalong.blogspot.com/2017/10/calculating-correlation-inside-mongodb.html). (HT @johnlpage)

[View in storybook](https://mongodb-js.github.io/compass-aggregations/?path=/story/examples--pearsons-rho)

## Usage

See [`aggregations.stories.js`](https://github.com/mongodb-js/compass-aggregations/blob/master/examples/aggregations.stories.js).

## Adding new examples

1. [Put your data set in MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new Stitch app with read permissions for the example collection
3. Copy `./example-grouped-stats.js` to `./example-<my-example>.js` and update with your pipeline details and `stitchAppId`
4. In [`aggregations.stories.js`](https://github.com/mongodb-js/compass-aggregations/blob/master/examples/aggregations.stories.js) `import MY_EXAMPLE from ./example-<my-example>.js` and add a new story
5. `npm run storybook` and your new example will load
6. Open a new pull request with your changes and include a brief description of what you use this aggregation pipeline for.
