import {
  EXAMPLE,
  STAGE_DEFAULTS
} from './example-constants.js';

/**
 * From @terakilobyte's aggregation examples from Education Team.
 *
 * @see https://gist.github.com/imlucas/5c92b6cfd46cba2a8bbb4a428c37c31b
 */

// gathering stats when items are in an array using $project accumulators
const ARRAY_STATS_EXAMPLE = {
  ...EXAMPLE,
  namespace: 'aggregations.icecream_data',
  pipeline: [{
    ...STAGE_DEFAULTS,
    id: 0,
    stageOperator: '$project',
    stage: `{
  _id: 0,
  average_cpi: {$avg: "$trends.icecream_cpi" },
  max_cpi: {$max: "$trends.icecream_cpi" },
  min_cpi: {$min: "$trends.icecream_cpi" },
  cpi_deviation: {$stdDevPop: "$trends.icecream_cpi" }
}`
  }]
};

export default ARRAY_STATS_EXAMPLE;
