import {
  EXAMPLE,
  STAGE_DEFAULTS
} from './example-constants.js';

/**
 * From @terakilobyte's aggregation examples from Education Team.
 *
 * @see https://gist.github.com/imlucas/5c92b6cfd46cba2a8bbb4a428c37c31b
 */

// gathering metacritic info for movies that have Tom Hanks or Daniel Day-Lewis
// as cast members
const GROUPED_STATS_EXAMPLE = {
  ...EXAMPLE,
  namespace: 'aggregations.movies',
  pipeline: [{
    ...STAGE_DEFAULTS,
    id: 0,
    stageOperator: '$match',
    stage: `{
cast: { $in: ['Tom Hanks', 'Daniel Day-Lewis'] }
}`,
    previewDocuments: []
  },
  {
    ...STAGE_DEFAULTS,
    id: 1,
    stageOperator: '$group',
    stage: `{
  _id: 0,
  average_rating: { $avg: '$metacritic' },
  films_counted: { $sum: 1 },
  min_rating: { $min: '$metacritic' },
  max_rating: { $max: '$metacritic' }
}`,
    previewDocuments: []
  }]
};

export default GROUPED_STATS_EXAMPLE;
