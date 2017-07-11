const Aliaser = require('./aliaser');

// import all segment constructor functions
const constructQuerySegment = require('./segment-query');
const constructReductionSegment = require('./segment-reduction');
const constructAggregationSegment = require('./segment-aggregation');
const constructEncodingSegment = require('./segment-encoding');

/**
 * Constructs an aggregation pipeline based on the current chart store state.
 *
 * The pipeline consists of 4 main segments, which are
 *
 *   1. Query stages ($match, $sort, $skip, $sample/$limit)
 *   2. Array reduction stages ($unwind, $addFields)
 *   3. Aggregation stages ($group, $bucket, $project)
 *   4. Encoding and flattening stages ($project)
 *
 *
 *                  QUERY        REDUCTIONS    AGGREGATIONS     ENCODING
 *                    |              |              |              |
 * === PIPELINE ===== x ============ x ============ x ============ x =====>
 *                    |              |              |              |
 *                  $match        $unwind        $group         $project
 *                  $sort         $addFields     $bucket
 *                  $skip                        $project
 *              $sample / $limit
 *
 * The segments are computed individually and then concatenated in above
 * order to construct the final pipeline.
 */

function constructPipeline(state) {
  // create new stateful AggregationAliaser instance, which will track
  // temporary renaming of fields throughout the entire pipeline
  const aliaser = new Aliaser();

  // call all segment constructors individually, passing in state and aliaser
  const querySegment = constructQuerySegment(state, aliaser);
  const reductionSegment = constructReductionSegment(state, aliaser);
  const aggregationSegment = constructAggregationSegment(state, aliaser);
  const encodingSegment = constructEncodingSegment(state, aliaser);

  // combine all segments to the final pipeline
  const pipeline = [].concat(querySegment, reductionSegment,
    aggregationSegment, encodingSegment);

  return pipeline;
}

module.exports = constructPipeline;
