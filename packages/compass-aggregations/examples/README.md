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

## Usage

See [`aggregations.stories.js`](https://github.com/mongodb-js/compass-aggregations/blob/master/examples/aggregations.stories.js).

## Adding new examples

We haven't defined a process for this yet, but we'd be thrilled to have more. [Open an issue and let's chat more!](https://github.com/mongodb-js/compass-aggregations/issues)
